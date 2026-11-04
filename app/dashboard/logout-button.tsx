"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="border border-grid px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-surface hover:text-ink"
    >
      Sign out
    </button>
  );
}
