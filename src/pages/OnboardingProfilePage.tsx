import * as React from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

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

export default function OnboardingProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)

  const [username, setUsername] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")

  const usernameError = React.useMemo(() => validateUsername(username), [username])

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setError(null)
      setInfo(null)

      const { data, error } = await supabase.auth.getSession()
      if (cancelled) return

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data.session) {
        navigate("/", { replace: true })
        return
      }

      const userId = data.session.user.id

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("username, display_name, profile_completed")
        .eq("id", userId)
        .maybeSingle()

      if (cancelled) return

      if (pErr) {
        setError(pErr.message)
        setLoading(false)
        return
      }

      // If already completed, go to app
      if (profile?.profile_completed) {
        navigate("/app/today", { replace: true })
        return
      }

      setUsername(profile?.username ?? "")
      setDisplayName(profile?.display_name ?? "")
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [navigate])

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

    setSaving(true)
    try {
      const { error } = await supabase.rpc("set_my_profile", {
        p_username: normalizeUsername(username),
        p_display_name: displayName.trim(),
      })
      if (error) throw error

      setInfo("Profile saved! Redirecting...")
      navigate("/app/today", { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const suggestFix =
    username.startsWith("user_") || username.length === 0 || !displayName

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Complete your profile</CardTitle>
            <CardDescription>
              Choose your username and display name to continue.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={saving}
                    autoComplete="username"
                    required
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
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={saving}
                    autoComplete="name"
                    required
                  />
                  <FieldDescription>
                    This is how others will see you in groups.
                  </FieldDescription>
                </Field>

                {suggestFix ? (
                  <FieldDescription className="rounded-md border p-3 text-sm">
                    Tip: if you signed up with Google, we generated a temporary username.
                    You can change it now.
                  </FieldDescription>
                ) : null}

                <Field className="gap-2">
                  <Button type="submit" disabled={saving || !!usernameError}>
                    {saving ? "Saving..." : "Save and continue"}
                  </Button>

                  {error ? (
                    <FieldDescription className="text-center text-destructive">
                      {error}
                    </FieldDescription>
                  ) : null}

                  {info ? (
                    <FieldDescription className="text-center">
                      {info}
                    </FieldDescription>
                  ) : null}
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}