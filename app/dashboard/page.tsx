"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { MODELS, SeptoModel } from "@/lib/brand";

interface Msg {
  role: "user" | "assistant";
  content: string;
  model?: SeptoModel;
}

const SUGGESTIONS = [
  "Build me a full-stack SaaS landing page with pricing",
  "Design the database schema for a booking app",
  "Review my Vercel deployment setup",
];

export default function Workspace() {
  const [model, setModel] = useState<SeptoModel>("septo-1.8");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply || data.error || "No response.",
          model,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error. Try again.", model },
      ]);
    }
    setBusy(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim() && !busy) send(input.trim());
  }

  const active = MODELS[model];

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-5xl flex-col px-6">
      {/* Model selector */}
      <div className="flex items-center gap-2 border-b border-grid bg-white py-3">
        {(Object.keys(MODELS) as SeptoModel[]).map((id) => {
          const m = MODELS[id];
          const selected = id === model;
          return (
            <button
              key={id}
              onClick={() => setModel(id)}
              className={
                "flex items-center gap-2 border px-4 py-2 text-sm font-semibold transition-colors " +
                (selected
                  ? "border-ink bg-ink text-white"
                  : "border-grid bg-white text-ink-soft hover:bg-surface")
              }
            >
              <span
                className="h-2 w-2"
                style={{ background: m.color }}
                aria-hidden
              />
              {m.name}
              <span
                className={
                  "font-mono text-[10px] uppercase " +
                  (selected ? "text-white/60" : "text-ink-faint")
                }
              >
                {m.role}
              </span>
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="section-label">{active.role} mode</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              {active.name} is ready.
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              {active.blurb}
            </p>
            <div className="mt-8 w-full max-w-lg space-y-px border border-grid bg-grid">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full bg-white px-5 py-4 text-left text-sm text-ink-soft hover:bg-surface hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  "card max-w-3xl px-5 py-4 " +
                  (m.role === "user" ? "ml-auto bg-surface" : "bg-white")
                }
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-2 w-2"
                    style={{
                      background:
                        m.role === "assistant" && m.model
                          ? MODELS[m.model].color
                          : "#0A0E1A",
                    }}
                    aria-hidden
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                    {m.role === "user"
                      ? "You"
                      : m.model
                        ? MODELS[m.model].name
                        : "Assistant"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {m.content}
                </p>
              </div>
            ))}
            {busy && (
              <div className="card max-w-3xl bg-white px-5 py-4">
                <span className="font-mono text-xs text-ink-faint">
                  {active.name} is working…
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="border-t border-grid bg-white py-4">
        <div className="flex gap-px border border-grid bg-grid">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Message " + active.name + "…"}
            className="flex-1 bg-white px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-40"
          >
            Send →
          </button>
        </div>
      </form>
    </div>
  );
}
