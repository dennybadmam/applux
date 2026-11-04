"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  async function onLogout() {
    const { error } = await createClient().auth.signOut();
    if (error) return;
    router.push("/login"); router.refresh();
  }
  return <button onClick={onLogout} className="border border-grid px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-surface hover:text-ink">Sign out</button>;
}
