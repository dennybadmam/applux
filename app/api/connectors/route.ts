import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Save a connector token (GitHub PAT, Supabase, Vercel, Cloudflare, Resend)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { provider?: string; token?: string; extra?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider, token, extra } = body;
  if (!provider || !token?.trim()) {
    return NextResponse.json(
      { error: "Provider and token are required." },
      { status: 400 }
    );
  }

  const trimmedToken = token.trim();
  const metaObj: Record<string, string> = {};
  if (extra) metaObj.extra = extra.trim();

  // If saving GitHub token, fetch username
  if (provider === "github") {
    try {
      const uRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${trimmedToken}`, "User-Agent": "Applux-App" },
      });
      if (uRes.ok) {
        const u = await uRes.json();
        if (u.login) metaObj.username = u.login;
      }
    } catch {
      // Non-blocking
    }
  }

  try {
    await prisma.user.upsert({
      where: { id: session.userId },
      update: { email: session.email, name: session.name },
      create: { id: session.userId, email: session.email, name: session.name, passwordHash: "" },
    });

    await prisma.connectedAccount.upsert({
      where: { userId_provider: { userId: session.userId, provider } },
      update: { token: trimmedToken, meta: JSON.stringify(metaObj) },
      create: { userId: session.userId, provider, token: trimmedToken, meta: JSON.stringify(metaObj) },
    });

    return NextResponse.json({ ok: true, meta: metaObj });
  } catch (err) {
    console.warn("Could not save to Prisma database, falling back:", err);
    return NextResponse.json(
      { error: "Database not connected. Please ensure DATABASE_URL is set in Vercel to save accounts." },
      { status: 500 }
    );
  }
}

// List user's connected external services
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts: { provider: string; username?: string; meta?: string }[] = [];

  // Check database accounts
  try {
    const dbAccounts = await prisma.connectedAccount.findMany({
      where: { userId: session.userId },
      select: { provider: true, meta: true },
    });
    for (const a of dbAccounts) {
      if (!accounts.some((acc) => acc.provider === a.provider)) {
        let username: string | undefined;
        if (a.meta) {
          try {
            const parsed = JSON.parse(a.meta);
            username = parsed.username;
          } catch {
            // silent
          }
        }
        accounts.push({ provider: a.provider, username, meta: a.meta || undefined });
      }
    }
  } catch (err) {
    console.warn("Could not read connected accounts from DB:", err);
  }

  // Check if OAuth is available for GitHub
  const oauthConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  );

  return NextResponse.json({
    accounts,
    oauth: {
      github: oauthConfigured,
    },
  });
}

// Disconnect a service
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
  } catch {
    // Non-blocking
  }

  return NextResponse.json({ ok: true });
}
