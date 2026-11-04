export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GitHub OAuth callback — exchanges the code for an access token.
export async function GET(req: NextRequest) {
  const session = await getSession();
  const code = req.nextUrl.searchParams.get("code");
  if (!session || !code) {
    return NextResponse.redirect(new URL("/dashboard/connectors", req.url));
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json();
  const token = data.access_token;
  if (!token) {
    return NextResponse.redirect(new URL("/dashboard/connectors", req.url));
  }

  await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: session.userId, provider: "github" } },
    update: { token },
    create: { userId: session.userId, provider: "github", token },
  });

  return NextResponse.redirect(new URL("/dashboard/connectors", req.url));
}
