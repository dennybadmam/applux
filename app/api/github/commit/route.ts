import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Retrieve GitHub token
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
    return NextResponse.json({ error: "GitHub not connected. Please connect your GitHub first." }, { status: 400 });
  }

  let body: { repo?: string; path?: string; content?: string; message?: string; branch?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { repo, path, content, message, branch = "main" } = body;
  if (!repo || !path || !content) {
    return NextResponse.json({ error: "repo, path, and content are required." }, { status: 400 });
  }

  // Clean repo format (in case user pasted full URL like https://github.com/owner/repo)
  let cleanRepo = repo.trim();
  cleanRepo = cleanRepo.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");

  const cleanPath = path.trim().replace(/^\//, "");
  const commitMessage = message?.trim() || `feat: update ${cleanPath} from Applux Studio`;

  try {
    // Check if file already exists on GitHub to get SHA for updating
    let sha: string | undefined;
    const getFileUrl = `https://api.github.com/repos/${cleanRepo}/contents/${cleanPath}?ref=${branch}`;
    const fileRes = await fetch(getFileUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Applux-Studio",
      },
    });

    if (fileRes.ok) {
      const existing = await fileRes.json();
      sha = existing.sha;
    }

    // Put file contents (base64 encoded)
    const base64Content = Buffer.from(content, "utf-8").toString("base64");
    const putUrl = `https://api.github.com/repos/${cleanRepo}/contents/${cleanPath}`;
    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "Applux-Studio",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      return NextResponse.json(
        { error: errData.message || "Failed to commit file to GitHub" },
        { status: putRes.status }
      );
    }

    const commitData = await putRes.json();
    return NextResponse.json({
      ok: true,
      commitUrl: commitData.commit?.html_url || `https://github.com/${cleanRepo}`,
      contentUrl: commitData.content?.html_url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GitHub commit failed" },
      { status: 500 }
    );
  }
}
