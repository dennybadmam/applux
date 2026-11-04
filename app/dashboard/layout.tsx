import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-grid bg-white">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center bg-ink font-mono text-xs font-medium text-white">
                A
              </span>
              <span className="font-bold tracking-tight">Applux</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/dashboard" className="px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-surface hover:text-ink">
                Workspace
              </Link>
              <Link href="/dashboard/connectors" className="px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-surface hover:text-ink">
                Connectors
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-ink-faint sm:block">{session?.name}</span>
            <LogoutButton />
          </div>
        </nav>
      </header>
      <main className="pt-14">{children}</main>
    </div>
  );
}
