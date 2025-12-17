"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Users,
  Search,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Mail,
  ListChecks,
  ClipboardPlus,
  AlertTriangle,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

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
  overdueCount: number;
  openCount: number;
};

type TeamResponse = {
  members: TeamMember[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

function initials(name?: string) {
  const n = (name || "User").trim();
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function TeamPage() {
  const base = apiBase();

  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [q, setQ] = React.useState("");
  const qDebounced = useDebounced(q, 350);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);
  const [pagination, setPagination] = React.useState<TeamResponse["pagination"]>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
  });

  React.useEffect(() => {
    setPage(1);
  }, [qDebounced]);

  const loadTeam = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (!silent) setLoading(true);

      try {
        const { data } = await api.get<TeamResponse>("/api/v1/team", {
          params: { q: qDebounced || undefined, page, pageSize },
        });

        setMembers(Array.isArray(data?.members) ? data.members : []);
        setPagination(data?.pagination ?? { page, pageSize, total: 0, totalPages: 1 });
      } catch (err: any) {
        setMembers([]);
        setPagination({ page, pageSize, total: 0, totalPages: 1 });
        if (!silent) toast.error(err?.response?.data?.message || "Failed to load team.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [qDebounced, page, pageSize]
  );

  // Initial load + reload when query/page/pagesize changes
  React.useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // ✅ SSE auto-refresh (throttled, no infinite loop)
  const loadTeamRef = React.useRef(loadTeam);
  React.useEffect(() => {
    loadTeamRef.current = loadTeam;
  }, [loadTeam]);

  const lastAutoRefreshRef = React.useRef(0);
  const autoRefreshInFlightRef = React.useRef(false);

  React.useEffect(() => {
    const url = `${base}/api/v1/realtime/dashboard`;
    const es = new EventSource(url, { withCredentials: true } as any);

    const maybeRefresh = () => {
      const now = Date.now();

      // throttle: at most once per 10 seconds
      if (now - lastAutoRefreshRef.current < 10_000) return;

      // avoid overlaps
      if (autoRefreshInFlightRef.current) return;

      lastAutoRefreshRef.current = now;
      autoRefreshInFlightRef.current = true;

      void loadTeamRef
        .current({ silent: true })
        .finally(() => {
          autoRefreshInFlightRef.current = false;
        });
    };

    // If server sends `event: ping`, `onmessage` won't fire, so listen to both.
    es.addEventListener("ping", maybeRefresh as any);
    es.addEventListener("message", maybeRefresh as any);

    es.onerror = () => {};
    return () => es.close();
  }, [base]);

  async function onRefresh() {
    setRefreshing(true);
    await loadTeam({ silent: true });
    setRefreshing(false);
  }

  const canPrev = pagination.page > 1;
  const canNext = pagination.page < pagination.totalPages;

  return (
    <main className="w-full pb-10">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Team
              </h1>
              <Badge variant="secondary" className="rounded-full">
                {pagination.total} members
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              View your workspace members and their workload signals.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>

            <Button variant="outline" className="h-11 rounded-xl" disabled>
              <Users className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Browse</CardTitle>
            <CardDescription>
              Search by name or email. Updates may refresh automatically.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative w-full lg:max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search team..."
                  className="h-11 rounded-xl pl-9"
                />
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:justify-end">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl px-3 sm:px-4"
                    disabled={!canPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Prev</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-11 rounded-xl px-3 sm:px-4"
                    disabled={!canNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4 sm:ml-2" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-11 rounded-xl px-3 flex items-center justify-center whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">
                      Page {pagination.page} / {pagination.totalPages}
                    </span>
                    <span className="sm:hidden">
                      {pagination.page}/{pagination.totalPages}
                    </span>
                  </Badge>

                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={() => {
                      setPage(1);
                      setPageSize((s) => (s === 12 ? 24 : 12));
                    }}
                  >
                    {pageSize === 12 ? "Show 24" : "Show 12"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card
                  key={i}
                  className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-black/10 dark:bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 rounded bg-black/10 dark:bg-white/10" />
                        <div className="h-3 w-1/2 rounded bg-black/10 dark:bg-white/10" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-24 rounded-xl bg-black/10 dark:bg-white/10" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : members.length === 0 ? (
            <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base">No team members found</CardTitle>
                <CardDescription>
                  {qDebounced ? "Try a different search term." : "Create users to see them here."}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Tip: Team list is based on your <code className="px-1">users</code> table.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {members.map((m) => (
                <Card
                  key={m.id}
                  className="h-full rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur flex flex-col overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    {/* ✅ FIX: prevent Active badge overflow */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                          <AvatarImage src={m.image || undefined} alt={m.name} />
                          <AvatarFallback>{initials(m.name)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-slate-900 dark:text-slate-50">
                            {m.name}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className="rounded-full shrink-0 max-w-24 truncate"
                        title="Active"
                      >
                        Active
                      </Badge>
                    </div>
                  </CardHeader>

                  <Separator />

                  <CardContent className="pt-4 flex-1">
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Stat icon={<ListChecks className="h-4 w-4" />} label="Assigned" value={m.assignedCount} />
                        <Stat icon={<ClipboardPlus className="h-4 w-4" />} label="Created" value={m.createdCount} />
                        <Stat
                          icon={<AlertTriangle className="h-4 w-4" />}
                          label="Overdue"
                          value={m.overdueCount}
                          danger={m.overdueCount > 0}
                        />
                        <Stat icon={<Users className="h-4 w-4" />} label="Open" value={m.openCount} />
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Badge
                          className={cn(
                            "rounded-full w-fit",
                            m.overdueCount > 0
                              ? "bg-linear-to-r from-rose-500 to-red-600 text-white"
                              : "bg-linear-to-r from-sky-500 to-indigo-600 text-white"
                          )}
                        >
                          {m.overdueCount > 0 ? "Needs attention" : "On track"}
                        </Badge>

                        <Button variant="outline" className="rounded-xl w-full sm:w-auto">
                         <Link href={`/dashboard/team/${m.id}`}>View</Link>
                        </Button>
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
        "rounded-xl border border-black/5 bg-white/60 p-2.5 sm:p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/30",
        danger && "border-red-500/25"
      )}
    >
      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
        <span className={cn(danger ? "text-red-600 dark:text-red-400" : "")}>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={cn("mt-1 text-base sm:text-lg font-bold", danger ? "text-red-600 dark:text-red-400" : "")}>
        {value}
      </div>
    </div>
  );
}
