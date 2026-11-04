export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get("applux_github_oauth_state")?.value;
  const redirectTarget = new URL("/dashboard/connectors", req.url);

  if (!code) {
    redirectTarget.searchParams.set("error", "no_code_provided");
    return NextResponse.redirect(redirectTarget);
  }
  if (!state || !expectedState || state !== expectedState) {
    redirectTarget.searchParams.set("error", "invalid_oauth_state");
    const response = NextResponse.redirect(redirectTarget);
    response.cookies.delete("applux_github_oauth_state");
    return response;
  }

  const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    redirectTarget.searchParams.set("error", "github_credentials_missing");
    return NextResponse.redirect(redirectTarget);
  }

  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await res.json();
    const token = data.access_token;

    if (!token) {
      redirectTarget.searchParams.set("error", data.error_description || "token_exchange_failed");
      return NextResponse.redirect(redirectTarget);
    }

    // Fetch user info from GitHub to get username
    let githubUsername = "";
    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "Applux-App",
        },
      });
      if (userRes.ok) {
        const u = await userRes.json();
        githubUsername = u.login || "";
      }
    } catch {
      // Non-blocking
    }

    // GitHub access tokens stay server-side in the database, never in a browser cookie.
    if (session?.userId) {
      try {
        await prisma.user.upsert({
          where: { id: session.userId },
          update: { email: session.email, name: session.name },
          create: { id: session.userId, email: session.email, name: session.name, passwordHash: "" },
        });

        await prisma.connectedAccount.upsert({
          where: { userId_provider: { userId: session.userId, provider: "github" } },
          update: { token, meta: JSON.stringify({ username: githubUsername }) },
          create: { userId: session.userId, provider: "github", token, meta: JSON.stringify({ username: githubUsername }) },
        });
      } catch (dbErr) {
        console.error("Could not persist GitHub account in DB:", dbErr);
        redirectTarget.searchParams.set("error", "database_save_failed");
        const response = NextResponse.redirect(redirectTarget);
        response.cookies.delete("applux_github_oauth_state");
        return response;
      }
    } else {
      redirectTarget.searchParams.set("error", "sign_in_required");
      const response = NextResponse.redirect(redirectTarget);
      response.cookies.delete("applux_github_oauth_state");
      return response;
    }

    redirectTarget.searchParams.set("success", "github_connected");
    if (githubUsername) {
      redirectTarget.searchParams.set("github_user", githubUsername);
    }

    const response = NextResponse.redirect(redirectTarget);
    response.cookies.delete("applux_github_oauth_state");
    return response;
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    redirectTarget.searchParams.set("error", "oauth_exception");
    return NextResponse.redirect(redirectTarget);
  }
}
