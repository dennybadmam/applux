import Link from "next/link";
import { BRAND, MODELS, CONNECTORS } from "@/lib/brand";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-grid bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center bg-ink font-mono text-sm font-medium text-white">
              A
            </span>
            <span className="text-lg font-bold tracking-tight">
              {BRAND.name}
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-ink-soft hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="border border-primary-dark bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="gridiron relative overflow-hidden pt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-12 border-x border-grid">
            <div className="col-span-12 border-b border-grid px-6 py-10 lg:col-span-8 lg:border-r lg:py-24">
              <p className="section-label">Platform / v1.0</p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                Build at the speed
                <br />
                of intent.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-soft">
                {BRAND.description}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary">
                  Create free account →
                </Link>
                <Link href="/login" className="btn-secondary">
                  Sign in
                </Link>
              </div>
            </div>
            <div className="col-span-12 bg-ink px-6 py-10 lg:col-span-4 lg:py-24">
              <div className="gridiron-dark h-full">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                  Models online
                </p>
                <div className="mt-6 space-y-4">
                  {Object.entries(MODELS).map(([id, m]) => (
                    <div
                      key={id}
                      className="border border-white/15 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {m.name}
                        </span>
                        <span
                          className="font-mono text-xs"
                          style={{ color: m.color }}
                        >
                          {m.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/60">{m.blurb}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Connectors ──────────────────────────────────────── */}
      <section className="border-b border-grid">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="section-label">Connectors</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
            Your accounts. Your infrastructure. One platform.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-px border border-grid bg-grid md:grid-cols-2 lg:grid-cols-4">
            {CONNECTORS.map((c) => (
              <div key={c.id} className="bg-white p-8">
                <div className="flex h-10 w-10 items-center justify-center border border-ink font-mono text-sm font-medium">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{c.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ────────────────────────────────────────── */}
      <section className="bg-ink">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Workflow
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
            From idea to production in four moves.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-4">
            {[
              ["01", "Register", "Create your account in seconds."],
              ["02", "Connect", "Link GitHub, Vercel, Cloudflare, Resend."],
              ["03", "Instruct", "Describe the product. Septo 1.8 builds it."],
              ["04", "Ship", "Deploy to your own infrastructure."],
            ].map(([n, t, d]) => (
              <div key={n} className="bg-ink p-8">
                <span className="font-mono text-xs text-white/40">{n}</span>
                <h3 className="mt-4 text-lg font-semibold text-white">{t}</h3>
                <p className="mt-2 text-sm text-white/60">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="gridiron border-b border-grid">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Stop prompting. Start shipping.
          </h2>
          <div className="mt-10">
            <Link href="/register" className="btn-primary">
              Create your account →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-grid pt-8 sm:flex-row sm:items-center">
          <span className="text-sm text-ink-faint">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </span>
          <span className="font-mono text-xs text-ink-faint">
            Powered by Septo 1.8 + Septo 1.6
          </span>
        </div>
      </footer>
    </div>
  );
}
