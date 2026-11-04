import { createClient } from "@/lib/supabase/server";

export type Session = { userId: string; email: string; name: string };

export async function getSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    userId: user.id,
    email: user.email || "",
    name: (user.user_metadata?.name as string) || user.email?.split("@")[0] || "User",
  };
}
