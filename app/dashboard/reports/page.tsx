"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BarChart3,
  Download,
  Filter,
  RefreshCcw,
  Search,
  CalendarDays,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

const api = axios.create({
  baseURL: apiBase(),
  withCredentials: true,
});

type TaskStatus = "todo" | "in_progress" | "review" | "completed";
type TaskPriority = "low" | "medium" | "high" | "urgent";

type ReportSummary = {
  range: { from: string; to: string };
  totals: {
    all: number;
    open: number;
    completed: number;
    overdue: number;
  };
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  topCreators: { id: string; name: string; email: string; count: number }[];
};

function formatDateInput(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfThisMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function StatPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "warn" | "ok";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/40",
        tone === "warn" && "border-amber-500/30",
        tone === "ok" && "border-emerald-500/25"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "text-muted-foreground",
            tone === "warn" && "text-amber-600 dark:text-amber-400",
            tone === "ok" && "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {icon}
        </span>
        <span className="text-sm text-muted-foreground truncate">{label}</span>
      </div>
      <div
        className={cn(
          "text-lg font-bold tabular-nums",
          tone === "warn" && "text-amber-700 dark:text-amber-300",
          tone === "ok" && "text-emerald-700 dark:text-emerald-300"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground truncate">{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-black/20 dark:bg-white/20"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Filters
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus | "all">("all");
  const [priority, setPriority] = React.useState<TaskPriority | "all">("all");

  const [from, setFrom] = React.useState(formatDateInput(startOfThisMonth()));
  const [to, setTo] = React.useState(formatDateInput(endOfToday()));

  // Data
  const [summary, setSummary] = React.useState<ReportSummary | null>(null);

  const load = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (!silent) setLoading(true);

      try {
        const { data } = await api.get<ReportSummary>("/api/v1/reports/summary", {
          params: {
            q: q || undefined,
            status: status === "all" ? undefined : status,
            priority: priority === "all" ? undefined : priority,
            from,
            to,
          },
        });

        setSummary(data);
      } catch (err: any) {
        setSummary(null);
        toast.error(err?.response?.data?.message || "Failed to load reports.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [q, status, priority, from, to]
  );

  React.useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  }

  async function onExportCsv() {
    try {
      toast.loading("Preparing CSV...", { id: "csv" });

      const res = await api.get("/api/v1/reports/export.csv", {
        params: {
          q: q || undefined,
          status: status === "all" ? undefined : status,
          priority: priority === "all" ? undefined : priority,
          from,
          to,
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });

      const safeFrom = String(from).replaceAll(":", "-");
      const safeTo = String(to).replaceAll(":", "-");
      downloadBlob(`reports_${safeFrom}_to_${safeTo}.csv`, blob);

      toast.success("CSV downloaded.", { id: "csv" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "CSV export failed.", { id: "csv" });
    }
  }

  const totalAll = summary?.totals.all ?? 0;

  return (
    <main className="w-full pb-10">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Reports
              </h1>
              <Badge variant="secondary" className="rounded-full">
                Analytics & summaries
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Filter tasks and view workload and completion insights.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCcw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </Button>

            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={onExportCsv}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </CardTitle>
            <CardDescription>
              Use search, status/priority, and date range to refine reports.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title/description..."
                  className="h-11 rounded-xl pl-9"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="h-11 w-full sm:w-50 rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger className="h-11 w-full sm:w-50 rounded-xl">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-4 w-4" /> From
                </div>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-4 w-4" /> To
                </div>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button className="h-11 rounded-xl sm:self-end" onClick={() => load()}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : !summary ? (
          <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">No report data</CardTitle>
              <CardDescription>
                Try adjusting filters or check if the reports API is available.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex w-full flex-col gap-4 lg:w-105">
              <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Summary</CardTitle>
                  <CardDescription>
                    {summary.range.from} → {summary.range.to}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <StatPill
                      icon={<ListChecks className="h-4 w-4" />}
                      label="Total tasks"
                      value={summary.totals.all}
                    />
                    <StatPill
                      icon={<Clock3 className="h-4 w-4" />}
                      label="Open tasks"
                      value={summary.totals.open}
                    />
                    <StatPill
                      icon={<AlertTriangle className="h-4 w-4" />}
                      label="Overdue"
                      value={summary.totals.overdue}
                      tone={summary.totals.overdue > 0 ? "warn" : "default"}
                    />
                    <StatPill
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      label="Completed"
                      value={summary.totals.completed}
                      tone="ok"
                    />
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    Export uses the same filters and date range as this page.
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top creators</CardTitle>
                  <CardDescription>
                    Who created the most tasks in this range
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summary.topCreators?.length ? (
                    summary.topCreators.slice(0, 6).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/30"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {u.name || "User"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="rounded-full tabular-nums"
                        >
                          {u.count}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No creator data available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex w-full flex-1 flex-col gap-4">
              <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Breakdown</CardTitle>
                  <CardDescription>Status and priority distribution</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-semibold">By Status</div>
                    <div className="flex flex-col gap-3">
                      <MiniBar
                        label="To Do"
                        value={summary.byStatus.todo || 0}
                        total={totalAll}
                      />
                      <MiniBar
                        label="In Progress"
                        value={summary.byStatus.in_progress || 0}
                        total={totalAll}
                      />
                      <MiniBar
                        label="Review"
                        value={summary.byStatus.review || 0}
                        total={totalAll}
                      />
                      <MiniBar
                        label="Completed"
                        value={summary.byStatus.completed || 0}
                        total={totalAll}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-semibold">By Priority</div>
                    <div className="flex flex-col gap-3">
                      <MiniBar
                        label="Low"
                        value={summary.byPriority.low || 0}
                        total={totalAll}
                      />
                      <MiniBar
                        label="Medium"
                        value={summary.byPriority.medium || 0}
                        total={totalAll}
                      />
                      <MiniBar
                        label="High"
                        value={summary.byPriority.high || 0}
                        total={totalAll}
                      />
                      <MiniBar
                        label="Urgent"
                        value={summary.byPriority.urgent || 0}
                        total={totalAll}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
