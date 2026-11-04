import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Save a connector token (Gemini, Mistral, Vercel, Cloudflare, Resend)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { provider?: string; token?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider, token } = body;
  if (!provider || !token?.trim()) {
    return NextResponse.json(
      { error: "Provider and token/API key are required." },
      { status: 400 }
    );
  }

  try {
    await prisma.connectedAccount.upsert({
      where: { userId_provider: { userId: session.userId, provider } },
      update: { token: token.trim() },
      create: { userId: session.userId, provider, token: token.trim() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to persist connector token:", err);
    return NextResponse.json(
      {
        error:
          "Database not connected. Please ensure DATABASE_URL is set in Vercel to save custom keys, or set GEMINI_API_KEY / MISTRAL_API_KEY in your environment variables.",
      },
      { status: 500 }
    );
  }
}

// List the user's connected accounts
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = new Set<string>();

  // Check if system environment variables are set for Gemini and Mistral
  if (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ) {
    providers.add("gemini");
  }
  if (process.env.MISTRAL_API_KEY || process.env.MISTRAL_KEY) {
    providers.add("mistral");
  }

  // Check user-specific saved connections in Prisma database
  try {
    const dbAccounts = await prisma.connectedAccount.findMany({
      where: { userId: session.userId },
      select: { provider: true, createdAt: true },
    });
    dbAccounts.forEach((a) => providers.add(a.provider));
  } catch (err) {
    console.warn("Could not load user connected accounts from DB:", err);
  }

  return NextResponse.json({
    accounts: Array.from(providers).map((p) => ({ provider: p })),
  });
}

// Disconnect
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { provider?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider } = body;
  if (!provider) {
    return NextResponse.json({ error: "Provider is required" }, { status: 400 });
  }

  try {
    await prisma.connectedAccount.deleteMany({
      where: { userId: session.userId, provider },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("Could not delete connected account from DB:", err);
    return NextResponse.json({ ok: true });
  }
}
