// src/lib/goToAppOrOnboarding.ts
import { supabase } from "@/lib/supabaseClient"

export async function resolveNextRoute(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) return "/"
  if (!data.session) return "/"

  const userId = data.session.user.id
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("profile_completed, username, display_name")
    .eq("id", userId)
    .maybeSingle()

  if (pErr) return "/onboarding/profile"

  const completed =
    !!profile?.profile_completed ||
    (!!profile?.username && !!profile?.display_name)

  return completed ? "/app/today" : "/onboarding/profile"
}