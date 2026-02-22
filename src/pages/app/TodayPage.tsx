// src/pages/app/TodayPage.tsx
import * as React from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

type TodayTask = {
  task_instance_id: string
  title?: string | null
  name?: string | null
  status: string
  effort_points?: number | null
  due_at?: string | null
  occurrence_date?: string | null
  group_id?: string | null
  task_set_id?: string | null
}

function formatDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

export default function TodayPage() {
  const [tasks, setTasks] = React.useState<TodayTask[]>([])
  const [loading, setLoading] = React.useState(true)
  const [mutatingId, setMutatingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function load() {
    setError(null)
    setLoading(true)

    const { data, error } = await supabase
      .from("v_my_actionable_tasks_today")
      .select("*")
      .order("due_at", { ascending: true, nullsFirst: false })

    if (error) {
      setError(error.message)
      setTasks([])
    } else {
      setTasks((data ?? []) as TodayTask[])
    }

    setLoading(false)
  }

  React.useEffect(() => {
    load()
  }, [])

  async function claim(taskInstanceId: string) {
    setError(null)
    setMutatingId(taskInstanceId)
    try {
      const { error } = await supabase.rpc("claim_task_instance", {
        task_instance_id: taskInstanceId,
      })
      if (error) throw error
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setMutatingId(null)
    }
  }

  async function complete(taskInstanceId: string) {
    setError(null)
    setMutatingId(taskInstanceId)
    try {
      const { error } = await supabase.rpc("complete_task_instance", {
        task_instance_id: taskInstanceId,
      })
      if (error) throw error
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setMutatingId(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today</h1>
          <p className="text-sm text-muted-foreground">
            Your actionable tasks for today.
          </p>
        </div>

        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tasks</CardTitle>
            <CardDescription>
              Nothing actionable today. Create a routine or event to generate tasks.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((t) => {
            const label = t.title ?? t.name ?? "Task"
            const busy = mutatingId === t.task_instance_id

            return (
              <Card key={t.task_instance_id}>
                <CardHeader>
                  <CardTitle className="text-base">{label}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>Status: {t.status}</span>
                    {typeof t.effort_points === "number" ? (
                      <span>Effort: {t.effort_points}</span>
                    ) : null}
                    {t.due_at ? <span>Due: {formatDate(t.due_at)}</span> : null}
                    {t.occurrence_date ? (
                      <span>Date: {formatDate(t.occurrence_date)}</span>
                    ) : null}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => claim(t.task_instance_id)}
                    disabled={busy || t.status !== "OPEN"}
                  >
                    {busy ? "..." : "Claim"}
                  </Button>

                  <Button
                    onClick={() => complete(t.task_instance_id)}
                    disabled={busy || (t.status !== "CLAIMED" && t.status !== "ASSIGNED")}
                  >
                    {busy ? "..." : "Complete"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}