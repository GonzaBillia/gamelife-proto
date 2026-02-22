import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"
import { getSiteUrl } from "@/lib/authRedirect"

type Props = React.ComponentProps<"div">

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

function validateUsername(value: string) {
  const v = normalizeUsername(value)
  if (v.length < 3) return "Username must be at least 3 characters."
  if (v.length > 20) return "Username must be at most 20 characters."
  if (!/^[a-z0-9_]+$/.test(v)) return "Use only lowercase letters, numbers, and underscore."
  return null
}

export function SignUpForm({ className, ...props }: Props) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)

  const usernameError = React.useMemo(() => validateUsername(username), [username])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    const uErr = validateUsername(username)
    if (uErr) {
      setError(uErr)
      return
    }
    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters.")
      return
    }

    setLoading(true)
    try {
      const redirectTo = `${getSiteUrl()}/auth/callback`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      })
      if (signUpError) throw signUpError

      // If your project requires email confirmation, session may be null here.
      // But you can still set profile if RLS allows, or you can show a message and finish onboarding later.

      const normalizedUsername = normalizeUsername(username)
      const trimmedDisplayName = displayName.trim()

      // ✅ Recommended: use RPC to set the profile atomically and securely
      const { error: rpcError } = await supabase.rpc("set_my_profile", {
        p_username: normalizedUsername,
        p_display_name: trimmedDisplayName,
      })

      if (rpcError) {
        // Common: unique violation (username taken)
        throw rpcError
      }

      setInfo(
        data.session
          ? "Account created. You're in!"
          : "Account created. Please confirm your email to continue."
      )
    } catch (err) {
      const message = (err as { message?: string }).message ?? "Something went wrong."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Enter your details below to sign up</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
                <FieldDescription>
                  {usernameError
                    ? usernameError
                    : "Lowercase, numbers, underscore. 3–20 chars."}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="displayName">Display name</FieldLabel>
                <Input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  autoComplete="name"
                />
              </Field>

              <Field className="gap-2">
                <Button type="submit" disabled={loading || !!usernameError}>
                  {loading ? "Creating..." : "Create account"}
                </Button>

                {error ? (
                  <FieldDescription className="text-center text-destructive">
                    {error}
                  </FieldDescription>
                ) : null}

                {info ? (
                  <FieldDescription className="text-center">{info}</FieldDescription>
                ) : (
                  <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <a href="/login" className="underline underline-offset-4">
                      Log in
                    </a>
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}