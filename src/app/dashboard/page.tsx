"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, CheckSquare, MessageSquare, Settings2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ScheduledTask } from "@/lib/types/database";

type DashboardTask = ScheduledTask & { next_run_at?: string | null };

interface RecentRun {
  id: string;
  source: "web" | "telegram" | "scheduled";
  status: "running" | "completed" | "failed" | "timeout";
  input_preview: string | null;
  started_at: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(iso: string): string {
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

function formatPastTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name?: string | null; email?: string | null } | null>(null);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;

      if (error || !data.user) {
        router.push("/auth/login");
        return;
      }

      const { data: dbUser } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", data.user.id)
        .single();

      if (!active) return;
      setUser({
        name: (dbUser as { name?: string | null } | null)?.name ?? data.user.user_metadata?.name ?? null,
        email: data.user.email ?? null,
      });

      await Promise.all([
        fetch("/api/dashboard/tasks")
          .then((r) => r.ok ? r.json() : null)
          .then((d) => {
            if (!active || !d) return;
            const list: DashboardTask[] = Array.isArray(d) ? d : (d?.tasks ?? []);
            setTasks(list.filter((t) => t.enabled));
          })
          .catch(() => null),
        fetch("/api/integrations/google")
          .then((r) => r.ok ? r.json() : null)
          .then((d) => { if (!active || !d) return; setGoogleConnected(Boolean(d?.connected)); })
          .catch(() => null),
        fetch("/api/integrations/telegram/link")
          .then((r) => r.ok ? r.json() : null)
          .then((d) => { if (!active || !d) return; setTelegramConnected(Boolean(d?.connected)); })
          .catch(() => null),
        fetch("/api/dashboard/activity?limit=3")
          .then((r) => r.ok ? r.json() : null)
          .then((d) => {
            if (!active || !d) return;
            const runs: RecentRun[] = Array.isArray(d?.runs) ? d.runs : [];
            setRecentRuns(runs);
          })
          .catch(() => null),
      ]);

      if (active) setIsLoading(false);
    }

    void initialize();
    return () => { active = false; };
  }, [router, supabase]);

  const firstName = user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const greeting = getGreeting();

  const upcomingTasks = tasks
    .filter((t) => t.next_run_at)
    .sort((a, b) => new Date(a.next_run_at!).getTime() - new Date(b.next_run_at!).getTime())
    .slice(0, 3);

  const connectedIntegrations = [
    googleConnected && { label: "Google Calendar", icon: "📅" },
    telegramConnected && { label: "Telegram", icon: "✈" },
  ].filter(Boolean) as { label: string; icon: string }[];

  const suggestions = buildSuggestions(googleConnected, telegramConnected);

  const subtitleText = upcomingTasks.length > 0
    ? `You have ${tasks.length} scheduled task${tasks.length !== 1 ? "s" : ""} this week.`
    : "Your assistant is ready.";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-zinc-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-md shadow-teal-500/20">
            <span className="text-sm font-bold text-white">H</span>
          </div>
          <span className="font-semibold">Hada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/settings">
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings2 className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="gap-1.5">
              Chat
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold sm:text-3xl">
          <span className="gradient-text">{greeting}</span>, {firstName}.
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitleText}</p>
      </motion.div>

      <div className="space-y-6">
        {/* Cards row */}
        {(upcomingTasks.length > 0 || connectedIntegrations.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {/* Upcoming Tasks Card */}
            {upcomingTasks.length > 0 ? (
              <Link href="/settings?tab=tasks" className="group rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-teal-500/30 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:hover:border-teal-500/30">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <CheckSquare className="h-4 w-4 text-teal-500" />
                    Scheduled Tasks
                  </div>
                  <span className="text-xs text-zinc-400">{tasks.length} active</span>
                </div>
                <div className="space-y-2">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{task.description}</p>
                      <span className="shrink-0 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-600 dark:text-teal-400">
                        {formatRelativeTime(task.next_run_at!)}
                      </span>
                    </div>
                  ))}
                </div>
              </Link>
            ) : (
              <Link href="/chat" className="group rounded-2xl border border-dashed border-zinc-200/80 p-4 transition-all hover:border-teal-500/40 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  <CheckSquare className="h-4 w-4" />
                  No tasks scheduled
                </div>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Ask Hada to set a reminder</p>
              </Link>
            )}

            {/* Integration Status / Calendar placeholder */}
            {googleConnected ? (
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/70">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  Google Calendar
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Connected. Ask Hada what&apos;s on your schedule.
                </p>
                <button
                  onClick={() => {
                    window.location.href = "/chat";
                  }}
                  className="mt-2 text-xs font-medium text-teal-600 hover:underline dark:text-teal-400"
                >
                  Check this week →
                </button>
              </div>
            ) : (
              <Link href="/settings" className="group rounded-2xl border border-dashed border-zinc-200/80 p-4 transition-all hover:border-teal-500/40 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </div>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Connect Google Calendar in settings</p>
              </Link>
            )}
          </motion.div>
        )}

        {/* Integration chips */}
        {connectedIntegrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs text-zinc-400">Connected:</span>
            {connectedIntegrations.map((integration) => (
              <Link
                key={integration.label}
                href="/settings"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-teal-500/40 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {integration.label}
              </Link>
            ))}
          </motion.div>
        )}

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 }}
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">Suggested</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((s) => (
              <Link
                key={s.prompt}
                href={`/chat`}
                className="group flex items-start gap-3 rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-left transition-all hover:border-teal-500/30 hover:shadow-sm hover:shadow-teal-500/5 dark:border-zinc-800/70 dark:bg-zinc-900/50"
              >
                <span className="mt-0.5 text-base leading-none">{s.icon}</span>
                <div>
                  <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">{s.title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{s.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        {recentRuns.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">Recent Activity</p>
              <Link href="/settings?tab=activity" className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                View all →
              </Link>
            </div>
            <div className="space-y-1.5">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/60 bg-white/60 px-3 py-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/40"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <RunSourceIcon source={run.source} />
                    <p className="truncate text-xs text-zinc-700 dark:text-zinc-300">
                      {run.input_preview ?? "Task ran"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <RunStatusDot status={run.status} />
                    <span className="text-[10px] text-zinc-400">{formatPastTime(run.started_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Go to chat CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="pt-2"
        >
          <Link href="/chat">
            <Button className="w-full gap-2 gradient-brand text-white border-0 shadow-md shadow-teal-500/20">
              <MessageSquare className="h-4 w-4" />
              Message Hada
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function RunSourceIcon({ source }: { source: RecentRun["source"] }) {
  if (source === "scheduled") return <Zap className="h-3 w-3 shrink-0 text-teal-500" />;
  if (source === "telegram") return <span className="text-[11px] leading-none">✈</span>;
  return <MessageSquare className="h-3 w-3 shrink-0 text-zinc-400" />;
}

function RunStatusDot({ status }: { status: RecentRun["status"] }) {
  return (
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        status === "completed" && "bg-green-500",
        status === "running" && "bg-yellow-500 animate-pulse",
        status === "failed" && "bg-red-500",
        status === "timeout" && "bg-zinc-400",
      )}
    />
  );
}

function buildSuggestions(
  googleConnected: boolean,
  telegramConnected: boolean,
): { icon: string; title: string; subtitle: string; prompt: string }[] {
  const suggestions = [];

  if (googleConnected) {
    suggestions.push({
      icon: "📅",
      title: "What's on my calendar?",
      subtitle: "Check this week's events",
      prompt: "What's on my calendar this week?",
    });
  }

  suggestions.push({
    icon: "☀️",
    title: "Today's briefing",
    subtitle: "Top tech and AI stories",
    prompt: "Give me a brief summary of the most important tech and AI news today.",
  });

  suggestions.push({
    icon: "🎯",
    title: "Prep for a meeting",
    subtitle: "Talking points & context",
    prompt: "Help me prepare for an upcoming meeting.",
  });

  if (!googleConnected) {
    suggestions.push({
      icon: "📝",
      title: "Set a reminder",
      subtitle: "Schedule something for later",
      prompt: "Set a reminder for me.",
    });
  }

  if (telegramConnected) {
    suggestions.push({
      icon: "🔍",
      title: "Research a topic",
      subtitle: "Get a thorough summary",
      prompt: "Research a topic for me.",
    });
  } else {
    suggestions.push({
      icon: "✈",
      title: "Connect Telegram",
      subtitle: "Chat with Hada on the go",
      prompt: "",
    });
  }

  return suggestions.slice(0, 4);
}
