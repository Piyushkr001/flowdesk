"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  RefreshCcw,
  Search,
  MoreVertical,
  CalendarClock,
  CheckCircle2,
  Circle,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

const api = axios.create({
  baseURL: apiBase(),
  withCredentials: true,
});

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;

  assigneeId: string | null;
  creatorId: string | null;

  createdAt: string;
  updatedAt: string;
};

type TasksResponse = {
  tasks: Task[];
};

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function statusLabel(s: TaskStatus) {
  if (s === "todo") return "To do";
  if (s === "in_progress") return "In progress";
  return "Done";
}

function priorityLabel(p: TaskPriority) {
  if (p === "low") return "Low";
  if (p === "medium") return "Medium";
  return "High";
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const cls =
    status === "done"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
      : status === "in_progress"
      ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
      : "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20";

  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>{statusLabel(status)}</span>;
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cls =
    priority === "high"
      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
      : priority === "medium"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20";

  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>{priorityLabel(priority)}</span>;
}

function formatDue(dueAt: string | null) {
  if (!dueAt) return "No due date";
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString();
}

type TaskDraft = {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string; // datetime-local value or ""
};

function emptyDraft(): TaskDraft {
  return { title: "", status: "todo", priority: "medium", dueAt: "" };
}

function toDraft(t: Task): TaskDraft {
  // Convert ISO -> datetime-local (best-effort)
  const dueAt = t.dueAt ? new Date(t.dueAt) : null;
  const local = dueAt && !Number.isNaN(dueAt.getTime())
    ? new Date(dueAt.getTime() - dueAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : "";
  return {
    title: t.title ?? "",
    status: t.status,
    priority: t.priority,
    dueAt: local,
  };
}

export default function TasksPage() {
  const base = apiBase();

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // filters
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = React.useState<"all" | TaskPriority>("all");
  const [sort, setSort] = React.useState<"updated" | "due">("updated");

  const qDebounced = useDebounced(q, 350);

  // realtime tick (SSE ping like your dashboard)
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const url = `${base}/api/v1/realtime/dashboard`; // reuse your existing SSE ping
    const es = new EventSource(url, { withCredentials: true } as any);

    es.onmessage = () => setTick((t) => t + 1);
    es.onerror = () => {
      // keep silent: SSE auto-retries
    };

    return () => es.close();
  }, [base]);

  const loadTasks = React.useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);

    if (!silent) setLoading(true);
    try {
      const { data } = await api.get<TasksResponse>("/api/v1/tasks", {
        params: {
          q: qDebounced || undefined,
          status: status === "all" ? undefined : status,
          priority: priority === "all" ? undefined : priority,
          sort, // "updated" | "due"
        },
      });

      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (err: any) {
      setTasks([]);
      // Show a helpful error only when not silent
      if (!silent) toast.error(err?.response?.data?.message || "Failed to load tasks.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [qDebounced, status, priority, sort]);

  React.useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTasks, tick]);

  async function onManualRefresh() {
    setRefreshing(true);
    await loadTasks({ silent: true });
    setRefreshing(false);
  }

  // stats
  const stats = React.useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    return { total, todo, inProgress, done };
  }, [tasks]);

  // create/edit sheet
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<TaskDraft>(emptyDraft());
  const [saving, setSaving] = React.useState(false);

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setDraft(emptyDraft());
    setSheetOpen(true);
  }

  function openEdit(task: Task) {
    setMode("edit");
    setEditingId(task.id);
    setDraft(toDraft(task));
    setSheetOpen(true);
  }

  async function onSave() {
    if (!draft.title.trim()) return toast.error("Title is required.");

    setSaving(true);
    const tId = toast.loading(mode === "create" ? "Creating task..." : "Updating task...");
    try {
      const payload = {
        title: draft.title.trim(),
        status: draft.status,
        priority: draft.priority,
        dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null,
      };

      if (mode === "create") {
        await api.post("/api/v1/tasks", payload);
      } else {
        if (!editingId) throw new Error("Missing task id");
        await api.patch(`/api/v1/tasks/${editingId}`, payload);
      }

      toast.dismiss(tId);
      toast.success(mode === "create" ? "Task created." : "Task updated.");
      setSheetOpen(false);
      await loadTasks({ silent: true });
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    const ok = window.confirm("Delete this task?");
    if (!ok) return;

    const tId = toast.loading("Deleting task...");
    try {
      await api.delete(`/api/v1/tasks/${id}`);
      toast.dismiss(tId);
      toast.success("Task deleted.");
      await loadTasks({ silent: true });
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Failed to delete task.");
    }
  }

  async function quickMarkDone(id: string) {
    const tId = toast.loading("Marking as done...");
    try {
      await api.patch(`/api/v1/tasks/${id}`, { status: "done" });
      toast.dismiss(tId);
      toast.success("Marked as done.");
      await loadTasks({ silent: true });
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Failed to update task.");
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Create, filter, and manage tasks. Auto-refreshes when realtime pings arrive.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={onManualRefresh}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                  onClick={openCreate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </SheetTrigger>

              {/* ✅ IMPORTANT: Include SheetHeader + SheetTitle to avoid Radix accessibility warning */}
              <SheetContent side="right" className="w-95 sm:w-110 p-0">
                <SheetHeader className="p-6 pb-3">
                  <SheetTitle className="text-lg">
                    {mode === "create" ? "Create task" : "Edit task"}
                  </SheetTitle>
                </SheetHeader>
                <Separator />

                <ScrollArea className="h-[calc(100vh-140px)]">
                  <div className="p-6 space-y-5">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        className="h-11 rounded-xl"
                        value={draft.title}
                        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                        placeholder="e.g., Review PR for notifications"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Status */}
                      <div className="grid gap-2">
                        <Label>Status</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-xl justify-between">
                              {statusLabel(draft.status)}
                              <span className="text-muted-foreground">▾</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup
                              value={draft.status}
                              onValueChange={(v) =>
                                setDraft((d) => ({ ...d, status: v as TaskStatus }))
                              }
                            >
                              <DropdownMenuRadioItem value="todo">To do</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="in_progress">In progress</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="done">Done</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Priority */}
                      <div className="grid gap-2">
                        <Label>Priority</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-xl justify-between">
                              {priorityLabel(draft.priority)}
                              <span className="text-muted-foreground">▾</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Priority</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup
                              value={draft.priority}
                              onValueChange={(v) =>
                                setDraft((d) => ({ ...d, priority: v as TaskPriority }))
                              }
                            >
                              <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="dueAt">Due date</Label>
                      <Input
                        id="dueAt"
                        type="datetime-local"
                        className="h-11 rounded-xl"
                        value={draft.dueAt}
                        onChange={(e) => setDraft((d) => ({ ...d, dueAt: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional. Leave empty for no due date.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl"
                        onClick={() => setSheetOpen(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="h-11 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                        onClick={onSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : mode === "create" ? "Create task" : "Save changes"}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total" value={stats.total} icon={<Circle className="h-4 w-4" />} />
          <StatCard title="To do" value={stats.todo} icon={<Circle className="h-4 w-4" />} />
          <StatCard title="In progress" value={stats.inProgress} icon={<CalendarClock className="h-4 w-4" />} />
          <StatCard title="Done" value={stats.done} icon={<CheckCircle2 className="h-4 w-4" />} />
        </div>

        {/* Filters */}
        <Card className="mt-6 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Search and narrow down tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex-1 relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search tasks by title..."
                  className="h-11 rounded-xl pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl">
                      Status: {status === "all" ? "All" : statusLabel(status)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={status}
                      onValueChange={(v) => setStatus(v as any)}
                    >
                      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="todo">To do</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="in_progress">In progress</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="done">Done</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Priority filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl">
                      Priority: {priority === "all" ? "All" : priorityLabel(priority)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Priority</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={priority}
                      onValueChange={(v) => setPriority(v as any)}
                    >
                      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl">
                      Sort: {sort === "updated" ? "Recently updated" : "Due date"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Sort</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={sort}
                      onValueChange={(v) => setSort(v as any)}
                    >
                      <DropdownMenuRadioItem value="updated">Recently updated</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="due">Due date</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => {
                    setQ("");
                    setStatus("all");
                    setPriority("all");
                    setSort("updated");
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base">No tasks found</CardTitle>
                <CardDescription>
                  Try changing filters, or create your first task.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Your workspace looks clean—add something to start tracking work.
                </div>
                <Button
                  className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                  onClick={openCreate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {tasks.map((t) => (
                <Card
                  key={t.id}
                  className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold text-slate-900 dark:text-slate-50">
                            {t.title}
                          </h3>
                          <StatusBadge status={t.status} />
                          <PriorityBadge priority={t.priority} />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatDue(t.dueAt)}
                          </span>
                          <span>•</span>
                          <span>Updated: {new Date(t.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        {t.status !== "done" ? (
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => quickMarkDone(t.id)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark done
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="rounded-full">
                            Completed
                          </Badge>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-xl">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEdit(t)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(t.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="text-2xl font-extrabold tracking-tight">{value}</div>
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
