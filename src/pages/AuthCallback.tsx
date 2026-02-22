import * as React from "react"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallback() {
  const [msg, setMsg] = React.useState("Finishing sign in...")

  React.useEffect(() => {
    // Al entrar acá, Supabase debería tomar el code y guardar la sesión.
    // Aun así, chequeamos sesión para feedback.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMsg(error.message)
        return
      }

      if (data.session) {
        setMsg("Signed in! You can close this tab or go to the app.")
        // Si usás router, redirigí:
        window.location.href = "/"
      } else {
        setMsg("No session found. Please try again.")
      }
    })
  }, [])

  return <div style={{ padding: 24 }}>{msg}</div>
}