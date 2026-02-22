import * as React from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"

async function resolveNextRoute(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  if (!data.session) return "/"

  const userId = data.session.user.id
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, username, display_name")
    .eq("id", userId)
    .maybeSingle()

  const completed =
    !!profile?.profile_completed ||
    (!!profile?.username && !!profile?.display_name)

  return completed ? "/app/today" : "/onboarding/profile"
}

export default function AuthCallback() {
  const [msg, setMsg] = React.useState("Finishing sign in...")
  const navigate = useNavigate()

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get("code")
        const hasAccessTokenInHash = window.location.hash.includes("access_token=")

        // ✅ PKCE: si viene ?code=..., intercambiamos por sesión
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        // ✅ Implicit: si viene #access_token=..., detectSessionInUrl debería capturarlo
        // Le damos un micro delay por si el SDK tarda en persistir
        if (hasAccessTokenInHash) {
          await new Promise((r) => setTimeout(r, 150))
        }

        const { data, error } = await supabase.auth.getSession()
        if (cancelled) return
        if (error) throw error

        if (!data.session) {
          setMsg("No session found. Please try again.")
          return
        }

        const next = await resolveNextRoute()
        setMsg("Signed in! Redirecting...")
        navigate(next, { replace: true })
      } catch (e) {
        if (cancelled) return
        setMsg((e as Error).message)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return <div style={{ padding: 24 }}>{msg}</div>
}