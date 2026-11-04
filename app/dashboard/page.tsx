"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { MODELS, SeptoModel } from "@/lib/brand";
import {
  Sparkles,
  Zap,
  Brain,
  Play,
  Code2,
  Eye,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  Send,
  Maximize2,
  Smartphone,
  Tablet,
  Monitor,
  Layers,
  ChevronRight,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { GithubIcon } from "@/components/icons";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: SeptoModel;
  appCode?: string | null;
  image?: { url: string; prompt: string } | null;
  timestamp: number;
}

interface RepoItem {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
}

const STARTER_PROMPTS = [
  {
    title: "SaaS Landing Page",
    desc: "Build a modern dark-mode AI SaaS landing page with pricing calculator and testimonials.",
    badge: "App Builder",
  },
  {
    title: "Crypto & Stock Dashboard",
    desc: "Build an interactive financial analytics dashboard with live market simulation charts.",
    badge: "App Builder",
  },
  {
    title: "Retro Arcade Game",
    desc: "Build a playable neon cyber snake or breakout game with score saving.",
    badge: "Interactive App",
  },
  {
    title: "Cyberpunk Logo",
    desc: "Create an image of a glowing cyberpunk holographic app icon.",
    badge: "Generate Image",
  },
];

function extractHtmlCode(text: string): string | null {
  if (!text) return null;
  // Match ```html ... ``` blocks
  const htmlMatch = text.match(/```(?:html|htm)\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim()) {
    return htmlMatch[1].trim();
  }
  // Generic code block containing html tags
  const codeMatch = text.match(/```\s*([\s\S]*?)```/i);
  if (codeMatch && (codeMatch[1].includes("<!DOCTYPE") || codeMatch[1].includes("<html") || codeMatch[1].includes("<body") || codeMatch[1].includes("<div"))) {
    return codeMatch[1].trim();
  }
  return null;
}

function wrapStandaloneHtml(code: string): string {
  if (code.toLowerCase().includes("<!doctype html") || code.toLowerCase().includes("<html")) {
    return code;
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Applux Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen antialiased">
  ${code}
  <script>
    if (window.lucide) { window.lucide.createIcons(); }
  </script>
</body>
</html>`;
}

export default function Workspace() {
  const [model, setModel] = useState<SeptoModel>("septo-1.8");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "github" | "assets">("preview");
  const [activeAppCode, setActiveAppCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "chat" | "preview">("split");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");

  // GitHub commit state
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [commitPath, setCommitPath] = useState("index.html");
  const [commitMessage, setCommitMessage] = useState("feat: update app from Applux Studio");
  const [githubConnected, setGithubConnected] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitResult, setCommitResult] = useState<{ url?: string; error?: string } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // Check GitHub connection and fetch repos
  useEffect(() => {
    async function loadRepos() {
      try {
        const res = await fetch("/api/github/repos");
        if (res.ok) {
          const data = await res.json();
          if (data.connected && Array.isArray(data.repos)) {
            setGithubConnected(true);
            setRepos(data.repos);
            if (data.repos.length > 0) {
              setSelectedRepo(data.repos[0].fullName);
            }
          }
        }
      } catch {
        // silent
      }
    }
    loadRepos();
  }, []);

  async function handleSendMessage(text: string) {
    if (!text.trim() || busy) return;

    // Check if user is asking for an image
    const isImageRequest =
      /\b(generate|create|draw|make)\b.*\b(image|picture|photo|illustration|logo|icon|avatar)\b/i.test(text);

    const userMsgId = "msg_" + Math.random().toString(36).slice(2, 9);
    const userMsg: Msg = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setBusy(true);

    if (isImageRequest) {
      setIsGeneratingImage(true);
      try {
        const res = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        const data = await res.json();

        if (res.ok && data.url) {
          setMessages((m) => [
            ...m,
            {
              id: "ai_" + Math.random().toString(36).slice(2, 9),
              role: "assistant",
              content: `Here is the visual asset I generated for: "${text}"`,
              model,
              image: { url: data.url, prompt: text },
              timestamp: Date.now(),
            },
          ]);
          setActiveTab("assets");
          setBusy(false);
          setIsGeneratingImage(false);
          return;
        }
      } catch (err) {
        console.warn("Direct image generation failed, falling back to chat model:", err);
      }
      setIsGeneratingImage(false);
    }

    // Call chat API
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: nextHistory.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();
      const replyText = data.reply || data.error || "No response received.";
      const extractedCode = extractHtmlCode(replyText);

      if (extractedCode) {
        setActiveAppCode(extractedCode);
        setActiveTab("preview");
      }

      setMessages((m) => [
        ...m,
        {
          id: "ai_" + Math.random().toString(36).slice(2, 9),
          role: "assistant",
          content: replyText,
          model,
          appCode: extractedCode,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: "ai_" + Math.random().toString(36).slice(2, 9),
          role: "assistant",
          content: "Network error occurred while connecting to Septo. Please try again.",
          model,
          timestamp: Date.now(),
        },
      ]);
    }
    setBusy(false);
  }

  function handleQuickGenerateImage() {
    if (!imagePrompt.trim()) return;
    setImageModalOpen(false);
    handleSendMessage(`Generate an image of ${imagePrompt.trim()}`);
    setImagePrompt("");
  }

  function copyCode() {
    if (!activeAppCode) return;
    navigator.clipboard.writeText(activeAppCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCode() {
    if (!activeAppCode) return;
    const blob = new Blob([wrapStandaloneHtml(activeAppCode)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applux-app.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openPreviewInNewTab() {
    if (!activeAppCode) return;
    const blob = new Blob([wrapStandaloneHtml(activeAppCode)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  async function handleCommitToGithub() {
    if (!selectedRepo || !activeAppCode) return;
    setCommitLoading(true);
    setCommitResult(null);

    try {
      const res = await fetch("/api/github/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: selectedRepo,
          path: commitPath,
          content: wrapStandaloneHtml(activeAppCode),
          message: commitMessage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCommitResult({ url: data.commitUrl });
      } else {
        setCommitResult({ error: data.error || "Failed to commit." });
      }
    } catch {
      setCommitResult({ error: "Network error during commit." });
    }
    setCommitLoading(false);
  }

  const activeModel = MODELS[model];
  const allImages = messages.filter((m) => m.image).map((m) => m.image!);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-surface overflow-hidden">
      {/* Studio Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-grid bg-white px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <div className="flex items-center rounded-sm border border-grid bg-surface/50 p-0.5">
            {(Object.keys(MODELS) as SeptoModel[]).map((id) => {
              const m = MODELS[id];
              const isSelected = id === model;
              return (
                <button
                  key={id}
                  onClick={() => setModel(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm transition-all ${
                    isSelected
                      ? "bg-ink text-white shadow-sm"
                      : "text-ink-soft hover:text-ink hover:bg-white"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
                  {m.name}
                  <span className={`text-[10px] font-mono ${isSelected ? "text-white/60" : "text-ink-faint"}`}>
                    {m.role}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setImageModalOpen(true)}
            className="flex items-center gap-1.5 rounded-sm border border-grid bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surface hover:text-ink transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5 text-purple-600" />
            <span>Generate Image</span>
          </button>
        </div>

        {/* View Controls & GitHub Indicator */}
        <div className="flex items-center gap-3">
          {githubConnected ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
              <GithubIcon className="h-3 w-3" />
              GitHub Ready
            </span>
          ) : (
            <a
              href="/dashboard/connectors"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-ink-soft hover:text-ink border border-grid px-2 py-0.5"
            >
              <GithubIcon className="h-3 w-3" />
              Connect GitHub
            </a>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border border-grid bg-white rounded-sm p-0.5">
            <button
              onClick={() => setViewMode("chat")}
              className={`px-2.5 py-1 text-xs font-medium rounded-sm ${
                viewMode === "chat" ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`hidden md:inline-block px-2.5 py-1 text-xs font-medium rounded-sm ${
                viewMode === "split" ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 text-xs font-medium rounded-sm ${
                viewMode === "preview" ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Chat Panel */}
        {(viewMode === "chat" || viewMode === "split") && (
          <div
            className={`flex flex-col border-r border-grid bg-white ${
              viewMode === "split" ? "w-full md:w-[45%] lg:w-[42%]" : "w-full"
            }`}
          >
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold tracking-tight text-ink">
                    What are we building today?
                  </h2>
                  <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-soft">
                    Describe a full-stack web application, interactive tool, or image.
                    Septo builds it in real time with live preview.
                  </p>

                  <div className="mt-6 grid w-full max-w-md gap-2">
                    {STARTER_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p.desc)}
                        className="group flex flex-col items-start border border-grid bg-surface/40 p-3 text-left transition-all hover:border-primary hover:bg-white"
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xs font-semibold text-ink group-hover:text-primary">
                            {p.title}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                            {p.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-ink-soft line-clamp-1">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-sm border p-4 text-xs leading-relaxed ${
                        m.role === "user"
                          ? "border-primary/20 bg-primary/5 text-ink"
                          : "border-grid bg-white shadow-xs text-ink"
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-grid/60 pb-1 font-mono text-[10px] text-ink-faint">
                        <span>{m.role === "user" ? "You" : m.model ? MODELS[m.model]?.name : "Septo"}</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      {/* Text content */}
                      <p className="whitespace-pre-wrap">{m.content}</p>

                      {/* In-chat App Artifact Card */}
                      {m.appCode && (
                        <div className="mt-3 flex items-center justify-between border border-primary/30 bg-primary/5 p-2.5 rounded-sm">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-semibold text-[11px] text-ink">Web App Built</p>
                              <p className="text-[10px] text-ink-soft">Ready for live preview and testing</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setActiveAppCode(m.appCode || null);
                              setActiveTab("preview");
                              if (viewMode === "chat") setViewMode("split");
                            }}
                            className="flex items-center gap-1 bg-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary-dark transition-colors"
                          >
                            <Play className="h-3 w-3" />
                            Preview
                          </button>
                        </div>
                      )}

                      {/* In-chat Image Card */}
                      {m.image && (
                        <div className="mt-3 overflow-hidden rounded-sm border border-grid bg-surface">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.image.url}
                            alt={m.image.prompt}
                            className="w-full max-h-64 object-cover"
                          />
                          <div className="flex items-center justify-between p-2">
                            <span className="text-[10px] text-ink-soft truncate max-w-[200px]">
                              {m.image.prompt}
                            </span>
                            <a
                              href={m.image.url}
                              download="applux-generated.jpg"
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                            >
                              <Download className="h-3 w-3" />
                              Save
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {busy && (
                <div className="flex items-center gap-2 text-xs text-ink-soft">
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span>{isGeneratingImage ? "Synthesizing visual asset…" : `${activeModel.name} is building…`}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Chat Input Area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="border-t border-grid bg-white p-3"
            >
              <div className="flex gap-2 border border-grid bg-white p-1 focus-within:border-primary">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask ${activeModel.name} to build an app, website, or asset…`}
                  className="flex-1 bg-transparent px-3 py-2 text-xs outline-none text-ink placeholder:text-ink-faint"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="flex items-center justify-center bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Right Side: Canvas / Live Preview & Inspector */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={`flex flex-col bg-surface overflow-hidden ${
              viewMode === "split" ? "hidden md:flex flex-1" : "w-full"
            }`}
          >
            {/* Canvas Header & Tabs */}
            <div className="flex items-center justify-between border-b border-grid bg-white px-4 py-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "preview"
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Live Preview
                </button>
                <button
                  onClick={() => setActiveTab("code")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "code"
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Code
                </button>
                <button
                  onClick={() => setActiveTab("github")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "github"
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  GitHub Sync
                </button>
                <button
                  onClick={() => setActiveTab("assets")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "assets"
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Assets ({allImages.length})
                </button>
              </div>

              {/* Viewport switchers for Live Preview */}
              {activeTab === "preview" && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-grid bg-surface/50 rounded-sm p-0.5">
                    <button
                      onClick={() => setViewport("desktop")}
                      title="Desktop View"
                      className={`p-1 rounded-sm ${viewport === "desktop" ? "bg-white shadow-xs text-ink" : "text-ink-soft"}`}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewport("tablet")}
                      title="Tablet View"
                      className={`p-1 rounded-sm ${viewport === "tablet" ? "bg-white shadow-xs text-ink" : "text-ink-soft"}`}
                    >
                      <Tablet className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewport("mobile")}
                      title="Mobile View"
                      className={`p-1 rounded-sm ${viewport === "mobile" ? "bg-white shadow-xs text-ink" : "text-ink-soft"}`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (iframeRef.current && activeAppCode) {
                        iframeRef.current.srcdoc = wrapStandaloneHtml(activeAppCode);
                      }
                    }}
                    title="Refresh Preview"
                    className="p-1 text-ink-soft hover:text-ink"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={openPreviewInNewTab}
                    title="Open in new window"
                    className="p-1 text-ink-soft hover:text-ink"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Canvas Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {/* Tab 1: Live Interactive Iframe Sandbox */}
              {activeTab === "preview" && (
                <div
                  className={`h-full transition-all duration-200 border border-grid bg-white shadow-sm overflow-hidden flex flex-col ${
                    viewport === "desktop"
                      ? "w-full"
                      : viewport === "tablet"
                        ? "w-[768px] max-w-full"
                        : "w-[375px] max-w-full"
                  }`}
                >
                  {activeAppCode ? (
                    <iframe
                      ref={iframeRef}
                      title="Applux Live Sandbox"
                      srcDoc={wrapStandaloneHtml(activeAppCode)}
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                      className="w-full flex-1 border-0"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-6 text-center text-ink-soft">
                      <Layers className="h-8 w-8 text-ink-faint" />
                      <p className="mt-3 text-xs font-semibold text-ink">No App Active in Preview</p>
                      <p className="mt-1 max-w-xs text-[11px] text-ink-soft">
                        Ask Septo to build a landing page, dashboard, or game to see it live here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Code Viewer */}
              {activeTab === "code" && (
                <div className="h-full w-full flex flex-col border border-grid bg-slate-950 text-slate-200 rounded-sm overflow-hidden font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
                    <span className="text-slate-400">index.html</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyCode}
                        className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-slate-700"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy Code"}
                      </button>
                      <button
                        onClick={downloadCode}
                        className="flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary-dark"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="flex-1 overflow-auto p-4 leading-relaxed whitespace-pre-wrap">
                    {activeAppCode || "// No code generated yet. Prompt Septo to build an app."}
                  </pre>
                </div>
              )}

              {/* Tab 3: GitHub Sync */}
              {activeTab === "github" && (
                <div className="h-full w-full max-w-xl flex flex-col justify-start border border-grid bg-white p-6 shadow-sm overflow-y-auto">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-ink text-white rounded-sm">
                      <GithubIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">Commit Code to GitHub</h3>
                      <p className="text-xs text-ink-soft">
                        Sync your generated app files directly into your GitHub repository.
                      </p>
                    </div>
                  </div>

                  {!githubConnected ? (
                    <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                      <p className="font-semibold">GitHub is not connected yet.</p>
                      <p className="mt-1">
                        Connect your GitHub account in the Connectors page to push code with one click.
                      </p>
                      <a
                        href="/dashboard/connectors"
                        className="mt-3 inline-block bg-ink px-4 py-2 font-semibold text-white hover:bg-ink-soft"
                      >
                        Go to Connectors →
                      </a>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {commitResult?.url && (
                        <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Pushed successfully!</span>
                          <a
                            href={commitResult.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold underline ml-auto flex items-center gap-1"
                          >
                            View Commit <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {commitResult?.error && (
                        <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                          <span>{commitResult.error}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-ink">Target Repository</label>
                        {repos.length > 0 ? (
                          <select
                            value={selectedRepo}
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            className="mt-1.5 w-full border border-grid bg-white p-2.5 text-xs outline-none focus:border-primary"
                          >
                            {repos.map((r) => (
                              <option key={r.id} value={r.fullName}>
                                {r.fullName} {r.private ? "(private)" : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={selectedRepo}
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            placeholder="owner/repo (e.g. dennybadmam/applux)"
                            className="mt-1.5 w-full border border-grid bg-white p-2.5 text-xs outline-none focus:border-primary"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">File Path in Repository</label>
                        <input
                          type="text"
                          value={commitPath}
                          onChange={(e) => setCommitPath(e.target.value)}
                          placeholder="index.html or public/app.html"
                          className="mt-1.5 w-full border border-grid bg-white p-2.5 text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Commit Message</label>
                        <input
                          type="text"
                          value={commitMessage}
                          onChange={(e) => setCommitMessage(e.target.value)}
                          className="mt-1.5 w-full border border-grid bg-white p-2.5 text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <button
                        onClick={handleCommitToGithub}
                        disabled={commitLoading || !selectedRepo || !activeAppCode}
                        className="w-full flex items-center justify-center gap-2 bg-ink py-2.5 text-xs font-semibold text-white hover:bg-ink-soft transition-colors disabled:opacity-40"
                      >
                        <FolderGit2 className="h-4 w-4" />
                        {commitLoading ? "Pushing to GitHub…" : "Commit to GitHub"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Assets Gallery */}
              {activeTab === "assets" && (
                <div className="h-full w-full overflow-y-auto p-4">
                  {allImages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-ink-soft">
                      <ImageIcon className="h-8 w-8 text-ink-faint" />
                      <p className="mt-3 text-xs font-semibold text-ink">No Visual Assets Created Yet</p>
                      <p className="mt-1 text-[11px] text-ink-soft max-w-xs">
                        Click &ldquo;Generate Image&rdquo; above or ask Septo in chat to create graphics.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {allImages.map((img, i) => (
                        <div key={i} className="border border-grid bg-white overflow-hidden shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.prompt} className="w-full h-48 object-cover" />
                          <div className="p-3">
                            <p className="text-xs font-semibold text-ink line-clamp-1">{img.prompt}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <a
                                href={img.url}
                                download="asset.jpg"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                              >
                                <Download className="h-3 w-3" />
                                Download Full-Res
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Quick Image Generator */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md border border-grid bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-bold text-ink">Generate Image with AI</h3>
              </div>
              <button onClick={() => setImageModalOpen(false)} className="text-ink-soft hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              Describe the image, icon, logo, or background you want to generate.
            </p>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="A futuristic 3D metallic icon of a glowing shield..."
              rows={3}
              className="mt-4 w-full border border-grid p-2.5 text-xs outline-none focus:border-primary"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setImageModalOpen(false)}
                className="border border-grid px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickGenerateImage}
                disabled={!imagePrompt.trim()}
                className="bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                Generate Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
