import * as React from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { resolveNextRoute } from "@/lib/goToAppOrOnboarding"

export default function AuthCallback() {
  const [msg, setMsg] = React.useState("Finishing sign in...")
  const navigate = useNavigate()

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      // 1) primer intento
      let { data, error } = await supabase.auth.getSession()
      if (cancelled) return

      if (error) {
        setMsg(error.message)
        return
      }

      // 2) si no hay sesión, reintento corto (edge común)
      if (!data.session) {
        await new Promise((r) => setTimeout(r, 250))
        ;({ data, error } = await supabase.auth.getSession())
        if (cancelled) return
        if (error) {
          setMsg(error.message)
          return
        }
      }

      if (!data.session) {
        setMsg("No session found. Please try again.")
        return
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