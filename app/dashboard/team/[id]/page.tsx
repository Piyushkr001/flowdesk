"use client";

import * as React from "react";
import Link from "next/link";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Search,
  RefreshCcw,
  Loader2,
  Calendar,
  ListChecks,
  ClipboardPlus,
  AlertTriangle,
  BadgeCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

const api = axios.create({
  baseURL: apiBase(),
  withCredentials: true,
});

type TeamMember = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  assignedCount: number;
  createdCount: number;
  openCount: number;
  overdueCount: number;
};

type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueAt: string | null;
  createdAt: string;
  creatorId: string | null;
  assigneeId: string | null;
};

type TasksResponse = {
  tasks: Task[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

function initials(name?: string) {
  const n = (name || "User").trim();
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function statusBadge(status: Task["status"]) {
  if (status === "done") return <Badge className="rounded-full" variant="secondary">Done</Badge>;
  if (status === "in_progress") return <Badge className="rounded-full bg-linear-to-r from-sky-500 to-indigo-600 text-white">In Progress</Badge>;
  return <Badge className="rounded-full" variant="outline">To do</Badge>;
}

function priorityBadge(p: Task["priority"]) {
  if (p === "high") return <Badge className="rounded-full bg-linear-to-r from-rose-500 to-red-600 text-white">High</Badge>;
  if (p === "medium") return <Badge className="rounded-full bg-linear-to-r from-sky-500 to-indigo-600 text-white">Medium</Badge>;
  return <Badge className="rounded-full" variant="secondary">Low</Badge>;
}

export default function TeamMemberPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const memberId = params?.id;

  const base = apiBase();

  // realtime ping (optional — uses your existing SSE)
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const url = `${base}/api/v1/realtime/dashboard`;
    const es = new EventSource(url, { withCredentials: true } as any);
    es.onmessage = () => setTick((t) => t + 1);
    es.onerror = () => {};
    return () => es.close();
  }, [base]);

  const [member, setMember] = React.useState<TeamMember | null>(null);
  const [loadingMember, setLoadingMember] = React.useState(true);

  const [view, setView] = React.useState<"assigned" | "created" | "all">("assigned");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [tasksPg, setTasksPg] = React.useState<TasksResponse["pagination"]>({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 1,
  });

  React.useEffect(() => setPage(1), [view, q]);

  const loadMember = React.useCallback(async () => {
    setLoadingMember(true);
    try {
      const { data } = await api.get(`/api/v1/team/${memberId}`);
      setMember(data?.member ?? null);
    } catch {
      setMember(null);
    } finally {
      setLoadingMember(false);
    }
  }, [memberId]);

  const loadTasks = React.useCallback(async () => {
    setLoadingTasks(true);
    try {
      const { data } = await api.get<TasksResponse>(`/api/v1/team/${memberId}/tasks`, {
        params: { view, q: q.trim() || undefined, page, pageSize },
      });
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
      setTasksPg(data?.pagination ?? { page, pageSize, total: 0, totalPages: 1 });
    } catch {
      setTasks([]);
      setTasksPg({ page, pageSize, total: 0, totalPages: 1 });
    } finally {
      setLoadingTasks(false);
    }
  }, [memberId, view, q, page, pageSize]);

  React.useEffect(() => {
    if (!memberId) return;
    loadMember();
    loadTasks();
  }, [memberId, loadMember, loadTasks, tick]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadMember(), loadTasks()]);
    setRefreshing(false);
  }

  const canPrev = tasksPg.page > 1;
  const canNext = tasksPg.page < tasksPg.totalPages;

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Team Member</h1>
              <Badge variant="secondary" className="rounded-full">Details</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button asChild className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95">
              <Link href="/dashboard/team">
                <UsersIcon />
                Team List
              </Link>
            </Button>
          </div>
        </div>

        {/* Member card */}
        <Card className="mt-6 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Workload signals based on tasks.</CardDescription>
          </CardHeader>

          <CardContent>
            {loadingMember ? (
              <div className="text-sm text-muted-foreground">Loading member…</div>
            ) : !member ? (
              <div className="text-sm text-muted-foreground">
                Member not found or you don’t have access.
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={member.image || undefined} alt={member.name} />
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {member.name}
                      </div>
                      <Badge className="rounded-full bg-linear-to-r from-sky-500 to-indigo-600 text-white">
                        <BadgeCheck className="mr-1 h-4 w-4" />
                        Active
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground truncate">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
                  <Stat icon={<ListChecks className="h-4 w-4" />} label="Assigned" value={member.assignedCount} />
                  <Stat icon={<ClipboardPlus className="h-4 w-4" />} label="Created" value={member.createdCount} />
                  <Stat icon={<AlertTriangle className="h-4 w-4" />} label="Overdue" value={member.overdueCount} danger={member.overdueCount > 0} />
                  <Stat icon={<Users className="h-4 w-4" />} label="Open" value={member.openCount} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="mt-6 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasks</CardTitle>
            <CardDescription>Browse tasks assigned/created by this member.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList className="rounded-xl">
                  <TabsTrigger value="assigned">Assigned</TabsTrigger>
                  <TabsTrigger value="created">Created</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative w-full sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search tasks..."
                    className="h-11 rounded-xl pl-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    disabled={!canPrev || loadingTasks}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    disabled={!canNext || loadingTasks}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>

                  <Badge variant="outline" className="h-11 px-3 rounded-xl flex items-center">
                    Page {tasksPg.page} / {tasksPg.totalPages}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {loadingTasks ? (
              <div className="text-sm text-muted-foreground">Loading tasks…</div>
            ) : tasks.length === 0 ? (
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-slate-950/30 p-6">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">No tasks found</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {q.trim() ? "Try a different search term." : "This member has no tasks for this filter."}
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-slate-950/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900 dark:text-slate-50">
                        {t.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {statusBadge(t.status)}
                        {priorityBadge(t.priority)}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {t.dueAt ? `Due ${fmtDate(t.dueAt)}` : "No due date"}
                        </span>
                        <span>•</span>
                        <span>Created {fmtDate(t.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {view === "all" ? (
                        <>
                          {t.assigneeId === memberId ? <Badge className="rounded-full" variant="secondary">Assigned</Badge> : null}
                          {t.creatorId === memberId ? <Badge className="rounded-full" variant="outline">Created</Badge> : null}
                        </>
                      ) : null}

                      {/* Placeholder action (no task detail page yet) */}
                      <Button variant="outline" className="rounded-xl" disabled>
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-black/5 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/30",
        danger && "border-red-500/25"
      )}
    >
      <div className={cn("flex items-center gap-2 text-xs", danger ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn("mt-1 text-lg font-bold", danger ? "text-red-600 dark:text-red-400" : "")}>{value}</div>
    </div>
  );
}

function UsersIcon() {
  return <span className="mr-2 inline-flex h-4 w-4" />;
}
