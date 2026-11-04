"use client";

import { useEffect, useState } from "react";
import { CONNECTORS, ConnectorDef } from "@/lib/brand";
import {
  Database,
  Triangle,
  Cloud,
  Send,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Key,
  ShieldCheck,
  AlertCircle,
  X,
  ChevronDown,
} from "lucide-react";
import { GithubIcon } from "@/components/icons";

export default function ConnectorsPage() {
  const [connected, setConnected] = useState<{ provider: string; username?: string }[]>([]);
  const [oauthAvailable, setOauthAvailable] = useState<boolean>(true);
  const [tokenFor, setTokenFor] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [extra, setExtra] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPatForGithub, setShowPatForGithub] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/connectors");
      if (res.ok) {
        const data = await res.json();
        setConnected(data.accounts || []);
        if (data.oauth) {
          setOauthAvailable(data.oauth.github !== false);
        }
      }
    } catch {
      // Silent error on refresh
    }
  }

  useEffect(() => {
    refresh();

    // Check URL parameters for OAuth status
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "github_connected") {
      const user = params.get("github_user");
      setNotice({
        type: "success",
        text: `GitHub connected successfully${user ? ` as @${user}` : ""}!`,
      });
      window.history.replaceState({}, "", "/dashboard/connectors");
    } else if (params.get("error")) {
      const err = params.get("error");
      let msg = "GitHub connection failed.";
      if (err === "github_client_id_missing") {
        msg = "GitHub OAuth is not configured in Vercel. You can connect using a Personal Access Token below.";
        setShowPatForGithub(true);
      } else if (err === "github_credentials_missing") {
        msg = "GITHUB_CLIENT_SECRET is missing in environment variables.";
      }
      setNotice({ type: "error", text: msg });
      window.history.replaceState({}, "", "/dashboard/connectors");
    }
  }, []);

  async function save(provider: string) {
    if (!token.trim()) return;
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, token: token.trim(), extra }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken("");
        setExtra("");
        setTokenFor(null);
        setNotice({
          type: "success",
          text: `${provider.charAt(0).toUpperCase() + provider.slice(1)} connected successfully.`,
        });
        refresh();
      } else {
        setNotice({ type: "error", text: data.error || "Could not save that key." });
      }
    } catch {
      setNotice({ type: "error", text: "Network error saving connector." });
    }
    setLoading(false);
  }

  async function disconnect(provider: string) {
    try {
      await fetch("/api/connectors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      setNotice({
        type: "success",
        text: `Disconnected ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
      });
      refresh();
    } catch {
      // Silent error
    }
  }

  function startGithubOauth() {
    window.location.href = "/api/connectors/github/login";
  }

  function getIcon(id: string) {
    switch (id) {
      case "github":
        return <GithubIcon className="h-5 w-5 text-ink" />;
      case "supabase":
        return <Database className="h-5 w-5 text-emerald-600" />;
      case "vercel":
        return <Triangle className="h-5 w-5 text-ink fill-current" />;
      case "cloudflare":
        return <Cloud className="h-5 w-5 text-amber-500" />;
      case "resend":
        return <Send className="h-5 w-5 text-indigo-600" />;
      default:
        return <Key className="h-5 w-5 text-ink" />;
    }
  }

  const isConnected = (id: string) => connected.some((c) => c.provider === id);
  const getAccount = (id: string) => connected.find((c) => c.provider === id);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="section-label">Integrations & Connectors</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Connect your stack.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Link your developer accounts so Septo can commit to your GitHub repositories,
            manage data in Supabase, and automate deployments.
          </p>
        </div>
      </div>

      {/* Managed AI Badge */}
      <div className="mt-8 flex items-start gap-4 border border-primary/20 bg-primary/5 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">Built-in AI Intelligence</h3>
            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
              Managed
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            Applux provides high-performance Septo 1.8 (App Builder) and Septo 1.6 (Assistant)
            directly in your studio. You never have to bring, configure, or pay for separate raw AI model keys.
          </p>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`mt-6 flex items-center justify-between border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-ink-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Connectors List */}
      <div className="mt-8 space-y-4">
        {CONNECTORS.map((c) => {
          const on = isConnected(c.id);
          const acc = getAccount(c.id);
          const isGithub = c.id === "github";

          return (
            <div
              key={c.id}
              className={`border transition-all ${
                on ? "border-grid bg-white shadow-sm" : "border-grid bg-white"
              }`}
            >
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-grid bg-surface">
                    {getIcon(c.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-base font-semibold text-ink">{c.name}</h2>
                      {on ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Connected {acc?.username ? `@${acc.username}` : ""}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-ink-faint">
                          Not connected
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-ink-soft">
                      {c.desc}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {on ? (
                    <button
                      onClick={() => disconnect(c.id)}
                      className="border border-grid px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-surface hover:text-red-600"
                    >
                      Disconnect
                    </button>
                  ) : isGithub ? (
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={startGithubOauth}
                        className="flex items-center gap-2 bg-ink px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-ink-soft transition-colors"
                      >
                        <GithubIcon className="h-4 w-4" />
                        Connect with GitHub
                      </button>
                      <button
                        onClick={() => setShowPatForGithub(!showPatForGithub)}
                        className="text-[11px] text-ink-soft underline hover:text-ink"
                      >
                        {showPatForGithub ? "Hide token input" : "Or use Personal Access Token"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTokenFor(tokenFor === c.id ? null : c.id);
                        setToken("");
                        setExtra("");
                      }}
                      className="border border-ink px-4 py-2 text-xs font-semibold text-ink hover:bg-surface"
                    >
                      {tokenFor === c.id ? "Cancel" : "Connect"}
                    </button>
                  )}
                </div>
              </div>

              {/* GitHub PAT Input Dropdown */}
              {isGithub && !on && showPatForGithub && (
                <div className="border-t border-grid bg-surface/60 p-6">
                  <h4 className="text-xs font-semibold text-ink">Personal Access Token Fallback</h4>
                  <p className="mt-1 text-xs text-ink-soft">
                    Generate a token on GitHub with <code>repo</code> permissions and paste it here.
                  </p>
                  <div className="mt-3 flex max-w-lg gap-2">
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_... or github_pat_..."
                      className="flex-1 border border-grid bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => save("github")}
                      disabled={loading || !token.trim()}
                      className="bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                    >
                      Save Token
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Token Input Drawer for Supabase, Vercel, Cloudflare, Resend */}
              {tokenFor === c.id && !on && (
                <div className="border-t border-grid bg-surface/60 p-6">
                  <div className="max-w-md space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink">
                        {c.fieldLabel || "API Key / Token"}
                      </label>
                      <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder={c.placeholder || "Paste your key here"}
                        className="mt-1.5 w-full border border-grid bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    {c.id === "supabase" && (
                      <div>
                        <label className="block text-xs font-semibold text-ink">
                          Supabase Project URL
                        </label>
                        <input
                          type="text"
                          value={extra}
                          onChange={(e) => setExtra(e.target.value)}
                          placeholder="https://xyz.supabase.co"
                          className="mt-1.5 w-full border border-grid bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => save(c.id)}
                        disabled={loading || !token.trim()}
                        className="bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                      >
                        {loading ? "Connecting…" : "Save Connection"}
                      </button>
                      <button
                        onClick={() => setTokenFor(null)}
                        className="border border-grid bg-white px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-surface"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
