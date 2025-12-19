"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCcw,
  User2,
  AlertTriangle,
  Save,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

const api = axios.create({
  baseURL: apiBase(),
  withCredentials: true,
});

type TeamUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

type TaskDetail = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;

  creator: TeamUser | null;
  assignee: TeamUser | null;
};

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusPill(s: TaskStatus) {
  if (s === "done")
    return (
      <Badge className="rounded-full" variant="secondary">
        Done
      </Badge>
    );
  if (s === "in_progress")
    return (
      <Badge className="rounded-full bg-linear-to-r from-sky-500 to-indigo-600 text-white">
        In Progress
      </Badge>
    );
  return (
    <Badge className="rounded-full" variant="outline">
      To do
    </Badge>
  );
}

function priorityPill(p: TaskPriority) {
  if (p === "high")
    return (
      <Badge className="rounded-full bg-linear-to-r from-rose-500 to-red-600 text-white">
        High
      </Badge>
    );
  if (p === "medium")
    return (
      <Badge className="rounded-full bg-linear-to-r from-sky-500 to-indigo-600 text-white">
        Medium
      </Badge>
    );
  return (
    <Badge className="rounded-full" variant="secondary">
      Low
    </Badge>
  );
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  // Normalize id to a string once
  const rawId = params?.id;
  const taskId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";

  const base = apiBase();

  /**
   * ✅ Critical fix:
   * If route is /dashboard/tasks/new, Next will render this [id] page with id="new".
   * Redirect to the real "new task" page and DO NOT call /api/v1/tasks/new
   */
  React.useEffect(() => {
    if (taskId === "new") {
      router.replace("/dashboard/tasks/new");
    }
  }, [taskId, router]);

  // If taskId is invalid or "new", we should skip network work.
  const canLoad = Boolean(taskId) && taskId !== "new";

  // realtime refresh
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!canLoad) return;

    const url = `${base}/api/v1/realtime/dashboard`;
    const es = new EventSource(url, { withCredentials: true } as any);
    es.onmessage = () => setTick((t) => t + 1);
    es.onerror = () => {};
    return () => es.close();
  }, [base, canLoad]);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const [task, setTask] = React.useState<TaskDetail | null>(null);
  const [team, setTeam] = React.useState<TeamUser[]>([]);

  // editable fields
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>("todo");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = React.useState(""); // YYYY-MM-DD
  const [assigneeId, setAssigneeId] = React.useState<string>("__none__");

  const hydrateForm = React.useCallback((t: TaskDetail) => {
    setTitle(t.title ?? "");
    setStatus(t.status);
    setPriority(t.priority);
    setDueDate(toDateInputValue(t.dueAt));
    setAssigneeId(t.assignee?.id ?? "__none__");
  }, []);

  const loadAll = React.useCallback(async () => {
    if (!canLoad) return;

    setLoading(true);
    try {
      const [taskRes, teamRes] = await Promise.all([
        api.get(`/api/v1/tasks/${taskId}`),
        api.get(`/api/v1/team`),
      ]);

      const t: TaskDetail | null = taskRes.data?.task ?? null;
      const members: TeamUser[] = Array.isArray(teamRes.data?.members)
        ? teamRes.data.members
        : [];

      setTask(t);
      setTeam(members);

      if (t) hydrateForm(t);
    } catch {
      setTask(null);
      setTeam([]);
    } finally {
      setLoading(false);
    }
  }, [taskId, hydrateForm, canLoad]);

  React.useEffect(() => {
    if (!canLoad) return;
    loadAll();
  }, [loadAll, tick, canLoad]);

  async function onRefresh() {
    if (!canLoad) return;
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) return toast.error("Title is required.");

    setSaving(true);
    const tId = toast.loading("Saving changes...");

    try {
      const payload = {
        title: cleanTitle,
        status,
        priority,
        assigneeId: assigneeId === "__none__" ? null : assigneeId,
        dueAt: dueDate ? new Date(dueDate).toISOString() : null, // API will validate
      };

      const { data } = await api.patch(`/api/v1/tasks/${task.id}`, payload);

      const updated: TaskDetail | null = data?.task ?? null;
      if (updated) {
        setTask(updated);
        hydrateForm(updated);
      }

      toast.dismiss(tId);
      toast.success("Task updated.");
      router.refresh();
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Failed to update task.");
    } finally {
      setSaving(false);
    }
  }

  async function markDone() {
    if (!task) return;
    setSaving(true);
    const tId = toast.loading("Marking as done...");

    try {
      const { data } = await api.patch(`/api/v1/tasks/${task.id}`, { status: "done" });
      const updated: TaskDetail | null = data?.task ?? null;
      if (updated) {
        setTask(updated);
        hydrateForm(updated);
      }
      toast.dismiss(tId);
      toast.success("Marked as done.");
      router.refresh();
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

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
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Task</h1>
              {task ? statusPill(task.status) : null}
              {task ? priorityPill(task.priority) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={onRefresh}
              disabled={refreshing || !canLoad}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/tasks">
                <ClipboardList className="mr-2 h-4 w-4" />
                All Tasks
              </Link>
            </Button>
          </div>
        </div>

        {/* Body */}
        {!canLoad ? (
          <Card className="mt-6 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
            <CardContent className="py-10 text-sm text-muted-foreground">
              Redirecting…
            </CardContent>
          </Card>
        ) : loading ? (
          <Card className="mt-6 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
            <CardContent className="py-10 text-sm text-muted-foreground">Loading task…</CardContent>
          </Card>
        ) : !task ? (
          <Card className="mt-6 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
            <CardContent className="py-10">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-r from-rose-500/15 to-red-500/15 ring-1 ring-red-500/20">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-50">Task not found</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    The task may be deleted, or you don’t have access.
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                      asChild
                      className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                    >
                      <Link href="/dashboard/tasks">Go to Tasks</Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>
                      Go Back
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: edit form */}
            <Card className="lg:col-span-2 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Details</CardTitle>
                <CardDescription>Edit task fields and assign to a teammate.</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={onSave} className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      className="h-11 rounded-xl"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Task title"
                      disabled={saving}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 grid gap-2">
                      <Label>Status</Label>
                      <Select
                        value={status}
                        onValueChange={(v: string) => setStatus(v as TaskStatus)}
                        disabled={saving}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To do</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 grid gap-2">
                      <Label>Priority</Label>
                      <Select
                        value={priority}
                        onValueChange={(v: string) => setPriority(v as TaskPriority)}
                        disabled={saving}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 grid gap-2">
                      <Label htmlFor="due">Due date</Label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="due"
                          type="date"
                          className="h-11 rounded-xl pl-9"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          disabled={saving}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optional. Leave empty for “no due date”.
                      </p>
                    </div>

                    <div className="flex-1 grid gap-2">
                      <Label>Assignee</Label>
                      <Select
                        value={assigneeId}
                        onValueChange={(v: string) => setAssigneeId(v)}
                        disabled={saving}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Unassigned</SelectItem>
                          {team.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} ({m.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      onClick={() => hydrateForm(task)}
                      disabled={saving}
                    >
                      Reset
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      onClick={markDone}
                      disabled={saving || task.status === "done"}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark Done
                    </Button>

                    <Button
                      type="submit"
                      className="h-11 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Right: meta */}
            <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Meta</CardTitle>
                <CardDescription>Quick information about this task.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <MetaRow
                  icon={<User2 className="h-4 w-4" />}
                  label="Assignee"
                  value={
                    task.assignee
                      ? `${task.assignee.name} (${task.assignee.email})`
                      : "Unassigned"
                  }
                />

                <MetaRow
                  icon={<User2 className="h-4 w-4" />}
                  label="Creator"
                  value={
                    task.creator ? `${task.creator.name} (${task.creator.email})` : "—"
                  }
                />

                <Separator />

                <MetaRow label="Created" value={fmtDate(task.createdAt)} />
                <MetaRow label="Updated" value={fmtDate(task.updatedAt)} />
                <MetaRow label="Due" value={task.dueAt ? fmtDate(task.dueAt) : "No due date"} />

                <Separator />

                <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-slate-950/30 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">Status</div>
                  <div className="mt-2 flex items-center gap-2">
                    {statusPill(task.status)}
                    {priorityPill(task.priority)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

function MetaRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon ? icon : null}
        <span>{label}</span>
      </div>
      <div className={cn("text-sm text-slate-900 dark:text-slate-50 text-right wrap-break-word")}>
        {value}
      </div>
    </div>
  );
}
