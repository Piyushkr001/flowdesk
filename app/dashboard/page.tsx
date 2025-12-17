"use client";

import * as React from "react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

const api = axios.create({
  baseURL: apiBase(),
  withCredentials: true,
});

/** ✅ New enums + tolerate legacy "done" */
type TaskStatus = "todo" | "in_progress" | "review" | "completed" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

type DashboardTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  updatedAt: string;
};

type DashboardNotif = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  read: boolean;
};

type DashboardOverview = {
  stats: {
    assignedToMe: number;
    createdByMe: number;
    overdue: number;
    completed: number;
    unreadNotifications: number;
  };
  recentTasks: DashboardTask[];
  recentNotifications: DashboardNotif[];
};

const RECENT_TASKS_LIMIT = 6;
const RECENT_NOTIFS_LIMIT = 6;

function normalizeStatus(s: any): Exclude<TaskStatus, "done"> {
  const v = typeof s === "string" ? s.trim().toLowerCase() : "todo";
  if (v === "done") return "completed";
  if (v === "todo" || v === "in_progress" || v === "review" || v === "completed") return v;
  return "todo";
}

function normalizePriority(p: any): TaskPriority {
  const v = typeof p === "string" ? p.trim().toLowerCase() : "medium";
  if (v === "low" || v === "medium" || v === "high" || v === "urgent") return v;
  return "medium";
}

function normalizeTask(raw: any): DashboardTask | null {
  if (!raw || typeof raw !== "object" || !raw.id) return null;
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    status: normalizeStatus(raw.status),
    priority: normalizePriority(raw.priority),
    dueAt: raw.dueAt ? String(raw.dueAt) : null,
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

function normalizeNotif(raw: any): DashboardNotif | null {
  if (!raw || typeof raw !== "object" || !raw.id) return null;
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    body: raw.body ?? null,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    read: Boolean(raw.read),
  };
}

function sortByUpdatedDesc(list: DashboardTask[]) {
  return list
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function sortByCreatedDesc(list: DashboardNotif[]) {
  return list
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function upsertRecentTask(prev: DashboardTask[], t: DashboardTask) {
  const i = prev.findIndex((x) => x.id === t.id);
  const next = i === -1 ? [t, ...prev] : prev.map((x) => (x.id === t.id ? { ...x, ...t } : x));
  return sortByUpdatedDesc(next).slice(0, RECENT_TASKS_LIMIT);
}

function upsertRecentNotif(prev: DashboardNotif[], n: DashboardNotif) {
  const i = prev.findIndex((x) => x.id === n.id);
  const next = i === -1 ? [n, ...prev] : prev.map((x) => (x.id === n.id ? { ...x, ...n } : x));
  return sortByCreatedDesc(next).slice(0, RECENT_NOTIFS_LIMIT);
}

function formatDue(dueAt: string | null) {
  if (!dueAt) return "No due date";
  const d = new Date(dueAt);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function statusBadge(status: TaskStatus) {
  const s = normalizeStatus(status);
  if (s === "completed") return <Badge className="rounded-full">Completed</Badge>;
  if (s === "review") return <Badge variant="secondary" className="rounded-full">Review</Badge>;
  if (s === "in_progress") return <Badge variant="secondary" className="rounded-full">In progress</Badge>;
  return <Badge variant="outline" className="rounded-full">To do</Badge>;
}

function priorityBadge(p: TaskPriority) {
  const v = normalizePriority(p);
  if (v === "urgent") return <Badge className="rounded-full bg-fuchsia-600 text-white">Urgent</Badge>;
  if (v === "high") return <Badge className="rounded-full bg-red-600 text-white">High</Badge>;
  if (v === "medium") return <Badge className="rounded-full bg-amber-500 text-white">Medium</Badge>;
  return <Badge className="rounded-full bg-emerald-600 text-white">Low</Badge>;
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchOverview = React.useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);

    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get<DashboardOverview>("/api/v1/dashboard/overview");
      setData(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load dashboard.";
      toast.error(msg);
      setData(null);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Keep latest ref for realtime handlers
  const fetchRef = React.useRef(fetchOverview);
  React.useEffect(() => {
    fetchRef.current = fetchOverview;
  }, [fetchOverview]);

  // ✅ Socket.io realtime: instant UI update + debounced reconcile refetch
  const reconcileTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReconcile = React.useCallback(() => {
    if (reconcileTimerRef.current) clearTimeout(reconcileTimerRef.current);
    reconcileTimerRef.current = setTimeout(() => {
      fetchRef.current({ silent: true });
    }, 400);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const s = await getSocket();
        if (!mounted) return;

        const onReady = () => {
          // sync after connect/reconnect
          scheduleReconcile();
        };

        // Handles BOTH created + updated
        const onTaskUpsert = (payload: any) => {
          const t = normalizeTask(payload?.task ?? payload);
          if (!t) return;

          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              recentTasks: upsertRecentTask(prev.recentTasks ?? [], t),
            };
          });

          scheduleReconcile();
        };

        const onTaskDeleted = (payload: any) => {
          const id = String(payload?.id ?? payload ?? "");
          if (!id) return;

          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              recentTasks: (prev.recentTasks ?? []).filter((x) => x.id !== id),
            };
          });

          scheduleReconcile();
        };

        // ✅ Correct unread count deltas (prevents drift/double increments)
        const onNotificationUpsert = (payload: any) => {
          const n = normalizeNotif(payload?.notification ?? payload);
          if (!n) return;

          setData((prev) => {
            if (!prev) return prev;

            const prevList = prev.recentNotifications ?? [];
            const existing = prevList.find((x) => x.id === n.id);

            const prevUnread = existing ? !existing.read : false;
            const nextUnread = !n.read;

            const delta =
              existing == null
                ? nextUnread
                  ? 1
                  : 0
                : prevUnread === nextUnread
                ? 0
                : nextUnread
                ? 1
                : -1;

            return {
              ...prev,
              stats: {
                ...prev.stats,
                unreadNotifications: Math.max(0, (prev.stats?.unreadNotifications ?? 0) + delta),
              },
              recentNotifications: upsertRecentNotif(prevList, n),
            };
          });

          scheduleReconcile();
        };

        const onNotificationDeleted = (payload: any) => {
          const id = String(payload?.id ?? payload ?? "");
          if (!id) return;

          setData((prev) => {
            if (!prev) return prev;

            const prevList = prev.recentNotifications ?? [];
            const existing = prevList.find((x) => x.id === id);
            const delta = existing && !existing.read ? -1 : 0;

            return {
              ...prev,
              stats: {
                ...prev.stats,
                unreadNotifications: Math.max(0, (prev.stats?.unreadNotifications ?? 0) + delta),
              },
              recentNotifications: prevList.filter((x) => x.id !== id),
            };
          });

          scheduleReconcile();
        };

        const onNotificationCleared = () => {
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              stats: { ...prev.stats, unreadNotifications: 0 },
              recentNotifications: [],
            };
          });

          scheduleReconcile();
        };

        const onNotificationBulkUpdated = () => {
          // Bulk operations: best to reconcile from server truth
          scheduleReconcile();
        };

        // Safer: handle both your custom event and socket.io built-in connect
        s.on("ready", onReady);
        s.on("connect", onReady);

        // Tasks
        s.on("task:updated", onTaskUpsert);
        s.on("task:created", onTaskUpsert); // ✅ support create
        s.on("task:deleted", onTaskDeleted);

        // Notifications
        s.on("notification:new", onNotificationUpsert);
        s.on("notification:updated", onNotificationUpsert);
        s.on("notification:deleted", onNotificationDeleted);
        s.on("notification:cleared", onNotificationCleared);
        s.on("notification:bulkUpdated", onNotificationBulkUpdated);

        cleanup = () => {
          s.off("ready", onReady);
          s.off("connect", onReady);

          s.off("task:updated", onTaskUpsert);
          s.off("task:created", onTaskUpsert);
          s.off("task:deleted", onTaskDeleted);

          s.off("notification:new", onNotificationUpsert);
          s.off("notification:updated", onNotificationUpsert);
          s.off("notification:deleted", onNotificationDeleted);
          s.off("notification:cleared", onNotificationCleared);
          s.off("notification:bulkUpdated", onNotificationBulkUpdated);
        };
      } catch {
        // If realtime is unavailable, dashboard still works via manual refresh
      }
    })();

    return () => {
      mounted = false;
      if (reconcileTimerRef.current) clearTimeout(reconcileTimerRef.current);
      if (cleanup) cleanup();
    };
  }, [scheduleReconcile]);

  const empty =
    !loading &&
    (data?.recentTasks?.length ?? 0) === 0 &&
    (data?.recentNotifications?.length ?? 0) === 0 &&
    (data?.stats?.assignedToMe ?? 0) === 0 &&
    (data?.stats?.createdByMe ?? 0) === 0 &&
    (data?.stats?.overdue ?? 0) === 0 &&
    (data?.stats?.completed ?? 0) === 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs text-slate-700 backdrop-blur dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
            <ShieldCheck className="h-4 w-4" />
            Secure dashboard
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Track tasks, deadlines, and notifications in real time (Socket.io).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => fetchOverview({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>

          <Button
            asChild
            className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
          >
            <Link href="/dashboard/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <DashboardSkeleton />
      ) : empty ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard
              title="Assigned to me"
              value={data?.stats.assignedToMe ?? 0}
              icon={<ListChecks className="h-5 w-5" />}
            />
            <StatCard
              title="Created by me"
              value={data?.stats.createdByMe ?? 0}
              icon={<ArrowRight className="h-5 w-5" />}
            />
            <StatCard
              title="Overdue"
              value={data?.stats.overdue ?? 0}
              icon={<CalendarClock className="h-5 w-5" />}
              danger
            />
            <StatCard
              title="Completed"
              value={data?.stats.completed ?? 0}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              title="Unread alerts"
              value={data?.stats.unreadNotifications ?? 0}
              icon={<Bell className="h-5 w-5" />}
            />
          </div>

          {/* Two-column section */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Recent Tasks */}
            <Card className="flex-1 rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">Recent tasks</CardTitle>
                <CardDescription>Live updates via Socket.io.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.recentTasks ?? []).length === 0 ? (
                  <MiniEmpty
                    icon={<ListChecks className="h-5 w-5" />}
                    title="No tasks yet"
                    desc="Create your first task to start tracking work."
                    actionHref="/dashboard/tasks/new"
                    actionLabel="Create task"
                  />
                ) : (
                  <div className="grid gap-3">
                    {(data?.recentTasks ?? []).map((t) => (
                      <Link key={t.id} href={`/dashboard/tasks/${t.id}`} className="block">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-black/5 bg-white dark:bg-slate-950 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900 dark:text-slate-50">
                              {t.title}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <span className="inline-flex items-center gap-1">
                                <CalendarClock className="h-3.5 w-3.5" />
                                {formatDue(t.dueAt)}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span>Updated {new Date(t.updatedAt).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {priorityBadge(t.priority)}
                            {statusBadge(t.status)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="flex justify-end">
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/dashboard/tasks">View all tasks</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="w-full xl:w-105 rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
                <CardDescription>New assignments appear instantly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.recentNotifications ?? []).length === 0 ? (
                  <MiniEmpty
                    icon={<Bell className="h-5 w-5" />}
                    title="No notifications"
                    desc="You're all caught up."
                    actionHref="/dashboard"
                    actionLabel="Back to overview"
                  />
                ) : (
                  <div className="grid gap-3">
                    {(data?.recentNotifications ?? []).map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 p-4",
                          !n.read &&
                            "ring-1 ring-sky-500/25 bg-linear-to-r from-sky-500/5 to-indigo-500/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900 dark:text-slate-50">
                              {n.title}
                            </div>
                            {n.body ? (
                              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {n.body}
                              </div>
                            ) : null}
                            <div className="mt-2 text-xs text-muted-foreground">
                              {new Date(n.createdAt).toLocaleString()}
                            </div>
                          </div>
                          {!n.read ? (
                            <Badge className="rounded-full">New</Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-full">
                              Read
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="flex justify-end">
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/dashboard/notifications">View all</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  danger,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Card className="rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">{title}</div>
            <div
              className={cn(
                "mt-2 text-3xl font-extrabold",
                danger ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-50"
              )}
            >
              {value}
            </div>
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniEmpty({
  icon,
  title,
  desc,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 dark:text-slate-50">{title}</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{desc}</div>
          <div className="mt-4">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="rounded-3xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
      <CardContent className="p-8 sm:p-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/80 px-3 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
              <ListChecks className="h-4 w-4" />
              Empty workspace
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              No tasks yet. Let’s create your first workflow.
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Start by creating a task, assigning an owner, and setting a due date. This dashboard updates live.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
              >
                <Link href="/dashboard/tasks/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first task
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/dashboard/tasks">Browse tasks</Link>
              </Button>
            </div>
          </div>

          <div className="w-full lg:w-105">
            <div className="rounded-2xl border border-sky-500/20 bg-linear-to-r from-sky-500/10 to-indigo-500/10 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <div className="text-sm text-slate-700 dark:text-slate-200">
                  Tip: create tasks with <span className="font-semibold">priority + due date</span> for clean reporting.
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">Live updates are powered by Socket.io.</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card
            key={i}
            className="rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40"
          >
            <CardContent className="p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-3 h-10 w-10 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <Card className="flex-1 rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-3 w-52" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 p-4"
              >
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="w-full xl:w-105 rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-52" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 p-4"
              >
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
