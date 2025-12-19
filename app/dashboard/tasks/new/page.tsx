"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Calendar, Loader2, Plus, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

type TaskStatus = "todo" | "in_progress" | "review" | "completed" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NewTaskPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [team, setTeam] = React.useState<TeamUser[]>([]);

  // fields
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>("todo");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = React.useState(""); // YYYY-MM-DD
  const [assigneeId, setAssigneeId] = React.useState<string>("__none__");

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Load members for assignee dropdown
        const teamRes = await api.get("/api/v1/team");
        const members: TeamUser[] = Array.isArray(teamRes.data?.members) ? teamRes.data.members : [];
        if (!mounted) return;
        setTeam(members);
      } catch {
        if (!mounted) return;
        setTeam([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle) return toast.error("Title is required.");

    setSaving(true);
    const tId = toast.loading("Creating task...");

    try {
      const payload = {
        title: cleanTitle,
        status, // backend should normalize; if it only supports some values, it will validate
        priority,
        assigneeId: assigneeId === "__none__" ? null : assigneeId,
        dueAt: dueDate ? new Date(dueDate).toISOString() : null,
      };

      // Typical create route (adjust if your API uses POST /api/v1/tasks)
      const { data } = await api.post("/api/v1/tasks", payload);

      // Accept both { task } or direct task response
      const task = data?.task ?? data;
      const id = task?.id ? String(task.id) : "";

      toast.dismiss(tId);
      toast.success("Task created.");

      // Redirect to detail page if id exists; otherwise go to tasks list
      if (id) router.replace(`/dashboard/tasks/${id}`);
      else router.replace("/dashboard/tasks");
      router.refresh();
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Failed to create task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href="/dashboard/tasks">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tasks
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">New Task</h1>
              <Badge className="rounded-full" variant="secondary">
                Create
              </Badge>
            </div>
          </div>
        </div>

        <Card className="mt-6 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create task</CardTitle>
            <CardDescription>Fill in details and assign to a teammate.</CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-8 text-sm text-muted-foreground">Loading…</div>
            ) : (
              <form onSubmit={onCreate} className="flex flex-col gap-5">
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
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
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
                        <SelectItem value="urgent">Urgent</SelectItem>
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
                    <p className="text-xs text-muted-foreground">Optional.</p>
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
                    onClick={() => {
                      setTitle("");
                      setStatus("todo");
                      setPriority("medium");
                      setDueDate("");
                      setAssigneeId("__none__");
                    }}
                    disabled={saving}
                  >
                    Reset
                  </Button>

                  <Button
                    type="submit"
                    className="h-11 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Task
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
