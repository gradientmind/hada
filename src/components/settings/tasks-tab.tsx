"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScheduledTask } from "@/lib/types/database";

type DashboardTask = ScheduledTask & { next_run_at?: string | null };

type TasksResponse = {
  tasks?: DashboardTask[];
  error?: string;
};

function formatNextRun(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs < 0) return "overdue";
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays}d`;
}

export function TasksTab() {
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/tasks");
      if (!response.ok) {
        setError("Failed to load tasks.");
        return;
      }
      const data = (await response.json()) as TasksResponse | DashboardTask[];
      const list: DashboardTask[] = Array.isArray(data) ? data : (data?.tasks ?? []);
      setTasks(list);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleToggle = async (task: DashboardTask) => {
    const response = await fetch(`/api/dashboard/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !task.enabled }),
    });
    if (response.ok) void loadTasks();
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;
    const response = await fetch(`/api/dashboard/tasks/${taskId}`, { method: "DELETE" });
    if (response.ok) void loadTasks();
  };

  const handleRunNow = async (taskId: string) => {
    const response = await fetch(`/api/dashboard/tasks/${taskId}/run`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    void loadTasks();
    if (!response.ok) {
      window.alert(payload?.message || `Run failed with status ${response.status}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Scheduled Tasks</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Tasks Hada runs automatically on your behalf. Ask Hada in chat to create new ones.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-zinc-400">Loading tasks...</p>
      )}

      {error && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && tasks.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No scheduled tasks yet.</p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Ask Hada to schedule a task for you in chat.
            </p>
          </CardContent>
        </Card>
      )}

      {tasks.map((task) => (
        <Card key={task.id} className={task.enabled ? "" : "opacity-60"}>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-medium">{task.description}</CardTitle>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[11px]">
                    {task.type === "recurring" ? "Recurring" : "One-time"}
                  </Badge>
                  {task.cron_expression && (
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] dark:bg-zinc-800">
                      {task.cron_expression}
                    </code>
                  )}
                  {task.next_run_at && task.enabled && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Next: {formatNextRun(task.next_run_at)}
                    </span>
                  )}
                  {!task.enabled && (
                    <span className="text-xs text-zinc-400">Paused</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleRunNow(task.id)}
                >
                  Run now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleToggle(task)}
                >
                  {task.enabled ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 dark:text-red-400"
                  onClick={() => void handleDelete(task.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}

      {!loading && tasks.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => void loadTasks()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      )}
    </div>
  );
}
