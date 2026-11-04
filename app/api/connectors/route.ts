import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Save a connector token (Vercel, Cloudflare, Resend API keys)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, token } = await req.json();
  if (!provider || !token) {
    return NextResponse.json(
      { error: "Provider and token are required." },
      { status: 400 }
    );
  }

  await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: session.userId, provider } },
    update: { token },
    create: { userId: session.userId, provider, token },
  });

  return NextResponse.json({ ok: true });
}

// List the user's connected accounts
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.userId },
    select: { provider: true, createdAt: true },
  });

  return NextResponse.json({ accounts });
}

// Disconnect
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await req.json();
  await prisma.connectedAccount.deleteMany({
    where: { userId: session.userId, provider },
  });

  return NextResponse.json({ ok: true });
}
