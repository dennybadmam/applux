"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/dashboard"); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed."); setLoading(false);
    }
  }

  return (
    <div className="gridiron flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md border border-grid bg-white">
        <div className="border-b border-grid bg-ink px-8 py-6"><Link href="/" className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center bg-white font-mono text-sm font-medium text-ink">A</span><span className="text-lg font-bold text-white">Applux</span></Link></div>
        <form onSubmit={onSubmit} className="px-8 py-8">
          <p className="section-label">Sign in</p><h1 className="mt-2 text-2xl font-bold tracking-tight">Welcome back.</h1>
          {error && <div role="alert" className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="mt-6 space-y-5">
            <div><label className="label-field" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" className="input-field" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><label className="label-field" htmlFor="password">Password</label><input id="password" type="password" required autoComplete="current-password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-8 w-full disabled:opacity-50">{loading ? "Signing in…" : "Sign in →"}</button>
          <p className="mt-6 text-center text-sm text-ink-soft">No account? <Link href="/register" className="font-semibold text-primary">Create one</Link></p>
        </form>
      </div>
    </div>
  );
}
