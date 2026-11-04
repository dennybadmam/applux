import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Retrieve token from cookie or DB
  let token: string | undefined;
  {
    try {
      const acc = await prisma.connectedAccount.findUnique({
        where: { userId_provider: { userId: session.userId, provider: "github" } },
      });
      token = acc?.token;
    } catch {
      // non-blocking
    }
  }

  if (!token) {
    return NextResponse.json({ error: "GitHub not connected", connected: false }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Applux-Studio",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch repositories from GitHub" },
        { status: res.status }
      );
    }

    const repos = await res.json();
    const formatted = Array.isArray(repos)
      ? repos.map((r: { id: number; name: string; full_name: string; private: boolean; default_branch: string; html_url: string }) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          defaultBranch: r.default_branch || "main",
          url: r.html_url,
        }))
      : [];

    return NextResponse.json({ repos: formatted, connected: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GitHub request failed" },
      { status: 500 }
    );
  }
}
