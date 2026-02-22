// src/pages/app/AppLayout.tsx
import * as React from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"

export default function AppLayout() {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (!data.session) {
        navigate("/", { replace: true })
        return
      }

      // Optional: enforce onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", data.session.user.id)
        .maybeSingle()

      if (cancelled) return

      if (!profile?.profile_completed) {
        navigate("/onboarding/profile", { replace: true })
        return
      }

      setLoading(false)
    }

    run()

    return () => {
      cancelled = true
    }
  }, [navigate])

  async function signOut() {
    await supabase.auth.signOut()
    navigate("/", { replace: true })
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b p-4">
        <div className="font-semibold">Juego de Vida</div>
        <button className="text-sm underline" onClick={signOut}>
          Sign out
        </button>
      </header>

      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}