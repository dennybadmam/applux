import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MODELS, SeptoModel } from "@/lib/brand";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Convert conversation messages to Gemini's expected contents array:
// 1. Alternating 'user' and 'model' turns
// 2. Starts with a 'user' turn
// 3. Merges consecutive messages of identical roles
// 4. Skips empty message parts
function formatGeminiContents(messages: ChatMessage[]) {
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  let lastRole: "user" | "model" | null = null;

  for (const m of messages) {
    const role: "user" | "model" = m.role === "assistant" ? "model" : "user";
    const text = (m.content || "").trim();
    if (!text) continue;

    if (role === lastRole && contents.length > 0) {
      contents[contents.length - 1].parts[0].text += "\n\n" + text;
    } else {
      if (contents.length === 0 && role !== "user") {
        continue;
      }
      contents.push({ role, parts: [{ text }] });
      lastRole = role;
    }
  }

  return contents;
}

async function callGemini(
  system: string,
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  const contents = formatGeminiContents(messages);
  if (!contents.length) {
    throw new Error("No messages to send to Gemini.");
  }

  const configuredModel = process.env.GEMINI_MODEL?.trim();
  // Gemini 1.5 is retired; prefer current Flash models and keep older,
  // still-supported choices only as fallbacks for account availability.
  const candidateModels = Array.from(new Set([
    configuredModel,
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
  ].filter(Boolean) as string[]));

  let lastError = "";

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          }),
        });

        if (!res.ok) {
          const raw = await res.text();
          let message = `Gemini API error (${res.status})`;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error?.message) {
              message = parsed.error.message;
            }
          } catch {
            message += `: ${raw.slice(0, 160)}`;
          }
          lastError = message;

          // Temporary overload or rate limit: wait briefly on attempt 0, else try next candidate model
          if (res.status === 503 || res.status === 429) {
            if (attempt === 0) {
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
            break;
          }

          // Model not found or invalid for this API version: skip to next model
          if (res.status === 404 || res.status === 400) {
            break;
          }

          throw new Error(message);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text === "string") return text;

        const finishReason = data.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== "STOP") {
          throw new Error(`Gemini response stopped (${finishReason})`);
        }
        return "";
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes("404") ||
            err.message.includes("503") ||
            err.message.includes("429") ||
            err.message.includes("not found"))
        ) {
          break;
        }
        throw err;
      }
    }
  }

  throw new Error(lastError || "Failed to get a response from Gemini.");
}

async function callMistral(
  system: string,
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  const cleanMessages = messages
    .filter((m) => (m.content || "").trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  if (!cleanMessages.length) {
    throw new Error("No messages to send to Mistral.");
  }

  const configuredModel = process.env.MISTRAL_MODEL?.trim();
  // codestral-latest and mistral-small-latest work on free/standard plans
  // whereas mistral-large-latest often returns 429 "Rate limit exceeded"
  const candidateModels = [
    configuredModel,
    "codestral-latest",
    "mistral-small-latest",
    "open-mistral-nemo",
    "mistral-large-latest",
  ].filter(Boolean) as string[];

  let lastError = "";

  for (const model of candidateModels) {
    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, ...cleanMessages],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        let message = `Mistral API error (${res.status})`;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.message) {
            message = parsed.message;
          }
        } catch {
          message += `: ${raw.slice(0, 160)}`;
        }
        lastError = message;

        // Fall back on Rate limit (429), model permission (403), or not found/unsupported (404/422)
        if (
          res.status === 429 ||
          res.status === 403 ||
          res.status === 404 ||
          res.status === 422
        ) {
          continue;
        }
        throw new Error(message);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (typeof text === "string") return text;
      return "";
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("429") ||
          err.message.includes("403") ||
          err.message.includes("404") ||
          err.message.includes("Rate limit"))
      ) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(lastError || "Failed to get a response from Mistral.");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in first." },
      { status: 401 }
    );
  }

  let body: { model?: SeptoModel; messages?: ChatMessage[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { model, messages } = body;
  if (!model || !MODELS[model]) {
    return NextResponse.json({ error: "Invalid model selected" }, { status: 400 });
  }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Messages array cannot be empty" },
      { status: 400 }
    );
  }

  const cfg = MODELS[model];

  // Resolve API key:
  // 1. Check user-specific connected token in DB (if available)
  // 2. Fall back to environment variable (GEMINI_API_KEY or MISTRAL_API_KEY)
  let apiKey = "";

  if (cfg.provider === "gemini") {
    try {
      const acc = await prisma.connectedAccount.findUnique({
        where: { userId_provider: { userId: session.userId, provider: "gemini" } },
      });
      if (acc?.token) apiKey = acc.token.trim();
    } catch {
      // Ignore database errors if DB is not initialized yet
    }

    if (!apiKey) {
      apiKey = (
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        ""
      ).trim();
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not set. Add GEMINI_API_KEY in your Vercel Environment Variables or connect it under Dashboard > Connectors.",
        },
        { status: 500 }
      );
    }
  } else if (cfg.provider === "mistral") {
    try {
      const acc = await prisma.connectedAccount.findUnique({
        where: { userId_provider: { userId: session.userId, provider: "mistral" } },
      });
      if (acc?.token) apiKey = acc.token.trim();
    } catch {
      // Ignore database errors if DB is not initialized yet
    }

    if (!apiKey) {
      apiKey = (
        process.env.MISTRAL_API_KEY ||
        process.env.MISTRAL_KEY ||
        ""
      ).trim();
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "MISTRAL_API_KEY is not set. Add MISTRAL_API_KEY in your Vercel Environment Variables or connect it under Dashboard > Connectors.",
        },
        { status: 500 }
      );
    }
  }

  try {
    const reply =
      cfg.provider === "mistral"
        ? await callMistral(cfg.systemPrompt, messages, apiKey)
        : await callGemini(cfg.systemPrompt, messages, apiKey);

    // Save message history to DB if database is connected
    try {
      await prisma.user.upsert({
        where: { id: session.userId },
        update: { email: session.email, name: session.name },
        create: {
          id: session.userId,
          email: session.email,
          name: session.name,
          passwordHash: "",
        },
      });

      const last = messages[messages.length - 1].content;
      await prisma.message.createMany({
        data: [
          { userId: session.userId, role: "user", model, content: last },
          { userId: session.userId, role: "assistant", model, content: reply },
        ],
      });
    } catch (dbErr) {
      console.warn("Could not persist message to database:", dbErr);
    }

    return NextResponse.json({ reply, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    console.error(`AI call to ${cfg.name} failed:`, message);
    return NextResponse.json(
      { error: `${cfg.name} encountered an error: ${message}` },
      { status: 502 }
    );
  }
}
