import * as React from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const ranRef = React.useRef(false)

  React.useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    let cancelled = false

    async function run() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      const session = data.session
      if (!session) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed, username, display_name")
        .eq("id", session.user.id)
        .maybeSingle()

      if (cancelled) return

      const completed =
        !!profile?.profile_completed ||
        (!!profile?.username && !!profile?.display_name)

      navigate(completed ? "/app/today" : "/onboarding/profile", { replace: true })
    }

    run()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return <>{children}</>
}