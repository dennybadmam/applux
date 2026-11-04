import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MODELS, SeptoModel } from "@/lib/brand";

interface ChatMessage { role: "user" | "assistant"; content: string; }

async function callMistral(system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.MISTRAL_API_KEY },
    body: JSON.stringify({ model: "mistral-large-latest", messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!res.ok) throw new Error("Mistral API error (" + res.status + ")");
  const data = await res.json(); return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(system: string, messages: ChatMessage[]): Promise<string> {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.GEMINI_API_KEY;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents }) });
  if (!res.ok) throw new Error("Gemini API error (" + res.status + ")");
  const data = await res.json(); return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { model, messages } = (await req.json()) as { model: SeptoModel; messages: ChatMessage[] };
  const cfg = MODELS[model];
  if (!cfg) return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  if (!messages?.length) return NextResponse.json({ error: "No messages" }, { status: 400 });

  try {
    const reply = cfg.provider === "mistral" ? await callMistral(cfg.systemPrompt, messages) : await callGemini(cfg.systemPrompt, messages);
    try {
      await prisma.user.upsert({ where: { id: session.userId }, update: { email: session.email, name: session.name }, create: { id: session.userId, email: session.email, name: session.name, passwordHash: "" } });
      const last = messages[messages.length - 1].content;
      await prisma.message.createMany({ data: [{ userId: session.userId, role: "user", model, content: last }, { userId: session.userId, role: "assistant", model, content: reply }] });
    } catch (dbErr) { console.warn("Could not save message to database:", dbErr); }
    return NextResponse.json({ reply, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: cfg.name + " is unavailable: " + message }, { status: 502 });
  }
}
