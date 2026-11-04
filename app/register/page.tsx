"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registration failed.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="gridiron flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md border border-grid bg-white">
        <div className="border-b border-grid bg-ink px-8 py-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center bg-white font-mono text-sm font-medium text-ink">
              A
            </span>
            <span className="text-lg font-bold text-white">Applux</span>
          </Link>
        </div>
        <form onSubmit={onSubmit} className="px-8 py-8">
          <p className="section-label">Create account</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Start building.
          </h1>
          {error && (
            <div className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="mt-6 space-y-5">
            <div>
              <label className="label-field" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                className="input-field"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                className="input-field"
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-8 w-full disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account →"}
          </button>
          <p className="mt-6 text-center text-sm text-ink-soft">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
