"use client";

import { useEffect, useState } from "react";
import { CONNECTORS } from "@/lib/brand";

export default function ConnectorsPage() {
  const [connected, setConnected] = useState<string[]>([]);
  const [tokenFor, setTokenFor] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/connectors");
      const data = await res.json();
      setConnected((data.accounts || []).map((a: { provider: string }) => a.provider));
    } catch {
      // Silent error on refresh
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save(provider: string) {
    setNotice(null);
    try {
      const res = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, token }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken("");
        setTokenFor(null);
        setNotice(provider + " connected successfully.");
        refresh();
      } else {
        setNotice(data.error || "Could not save that key.");
      }
    } catch {
      setNotice("Network error saving connector.");
    }
  }

  async function disconnect(provider: string) {
    try {
      await fetch("/api/connectors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      refresh();
    } catch {
      // Silent error
    }
  }

  function githubOauth() {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      setTokenFor("github");
      return;
    }
    const redirect = window.location.origin + "/api/connectors/github/callback";
    window.location.href =
      "https://github.com/login/oauth/authorize?client_id=" +
      clientId +
      "&redirect_uri=" +
      encodeURIComponent(redirect) +
      "&scope=repo";
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="section-label">Connectors</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        Connect your stack.
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Link your AI keys and accounts so Septo can work directly on your infrastructure —
        chat models, repos, deployments, domains, and email.
      </p>

      {notice && (
        <div className="mt-6 border border-primary-soft bg-primary-soft px-4 py-3 text-sm text-primary-dark">
          {notice}
        </div>
      )}

      <div className="mt-8 space-y-px border border-grid bg-grid">
        {CONNECTORS.map((c) => {
          const isOn = connected.includes(c.id);
          const isApiKey = c.id === "gemini" || c.id === "mistral";
          return (
            <div
              key={c.id}
              className="flex flex-col gap-4 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center border border-ink font-mono text-xs font-medium">
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <h2 className="font-semibold">{c.name}</h2>
                  <span
                    className={
                      "font-mono text-[10px] uppercase tracking-widest " +
                      (isOn ? "text-ok" : "text-ink-faint")
                    }
                  >
                    {isOn ? "● Connected" : "○ Not connected"}
                  </span>
                </div>
                <p className="mt-2 max-w-md text-sm text-ink-soft">{c.desc}</p>
              </div>

              <div className="flex items-center gap-2">
                {tokenFor === c.id ? (
                  <>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder={isApiKey ? `${c.name} API key` : `${c.name} token`}
                      className="w-52 border border-grid px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => save(c.id)}
                      className="bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setTokenFor(null)}
                      className="border border-grid px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-surface"
                    >
                      Cancel
                    </button>
                  </>
                ) : isOn ? (
                  <button
                    onClick={() => disconnect(c.id)}
                    className="border border-grid px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-surface"
                  >
                    Disconnect
                  </button>
                ) : c.oauth ? (
                  <button
                    onClick={githubOauth}
                    className="bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
                  >
                    Connect with OAuth
                  </button>
                ) : (
                  <button
                    onClick={() => setTokenFor(c.id)}
                    className="border border-ink px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
                  >
                    {isApiKey ? "Add API key" : "Add token"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
