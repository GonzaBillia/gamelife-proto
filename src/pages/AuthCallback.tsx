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
      // Give Supabase a moment to parse hash/code and persist session
      await new Promise((r) => setTimeout(r, 150))

      const { data, error } = await supabase.auth.getSession()
      if (cancelled) return

      if (error) {
        setMsg(error.message)
        return
      }

      if (!data.session) {
        // Retry once (common on slow loads)
        await new Promise((r) => setTimeout(r, 250))
        const retry = await supabase.auth.getSession()
        if (cancelled) return
        if (!retry.data.session) {
          setMsg("No session found. Please try again.")
          return
        }
      }

      const next = await resolveNextRoute()
      setMsg("Signed in! Redirecting...")
      navigate(next, { replace: true })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return <div style={{ padding: 24 }}>{msg}</div>
}