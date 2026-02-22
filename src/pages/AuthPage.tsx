import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signUp() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      alert('Check your email to confirm the account (if email confirmations are enabled).')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function signIn() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', display: 'grid', gap: 12 }}>
      <h1>Life Prototype</h1>

      {sessionEmail ? (
        <>
          <p>Signed in as: {sessionEmail}</p>
          <button onClick={signOut}>Logout</button>
        </>
      ) : (
        <>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={loading} onClick={signIn}>Login</button>
            <button disabled={loading} onClick={signUp}>Register</button>
          </div>
        </>
      )}
    </div>
  )
}