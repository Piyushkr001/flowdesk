"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Bell,
  Search,
  RefreshCcw,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

const api = axios.create({
  baseURL: apiBase(),
  withCredentials: true,
});

type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: Notification[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type Prefs = {
  taskAssigned: boolean;
  taskUpdated: boolean;
  dueSoon: boolean;
  system: boolean;
};

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function NotificationsPage() {
  const base = apiBase();

  const [items, setItems] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [q, setQ] = React.useState("");
  const qDebounced = useDebounced(q, 350);

  const [filter, setFilter] = React.useState<"all" | "unread" | "read">("all");

  // pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [pagination, setPagination] = React.useState<NotificationsResponse["pagination"]>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  // settings
  const [prefsLoading, setPrefsLoading] = React.useState(true);
  const [prefsSaving, setPrefsSaving] = React.useState(false);
  const [prefs, setPrefs] = React.useState<Prefs>({
    taskAssigned: true,
    taskUpdated: true,
    dueSoon: true,
    system: true,
  });

  // ✅ realtime ping (reuse your SSE)
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const url = `${base}/api/v1/realtime/dashboard`;
    const es = new EventSource(url, { withCredentials: true } as any);
    es.onmessage = () => setTick((t) => t + 1);
    es.onerror = () => {};
    return () => es.close();
  }, [base]);

  const unreadCount = React.useMemo(() => items.filter((n) => !n.read).length, [items]);

  const loadNotifications = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (!silent) setLoading(true);

      try {
        const { data } = await api.get<NotificationsResponse>("/api/v1/notifications", {
          params: {
            q: qDebounced || undefined,
            read: filter === "all" ? undefined : filter === "read" ? true : false,
            page,
            pageSize,
          },
        });

        setItems(Array.isArray(data?.notifications) ? data.notifications : []);
        setPagination(
          data?.pagination ?? { page, pageSize, total: 0, totalPages: 1 }
        );
      } catch (err: any) {
        setItems([]);
        setPagination({ page, pageSize, total: 0, totalPages: 1 });
        if (!silent) toast.error(err?.response?.data?.message || "Failed to load notifications.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [qDebounced, filter, page, pageSize]
  );

  // when filter/search changes -> reset page to 1
  React.useEffect(() => {
    setPage(1);
  }, [filter, qDebounced]);

  React.useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadNotifications, tick]);

  async function loadPrefs() {
    setPrefsLoading(true);
    try {
      const { data } = await api.get("/api/v1/notifications/prefs");
      setPrefs(data?.prefs ?? prefs);
    } catch {
      // keep defaults
    } finally {
      setPrefsLoading(false);
    }
  }

  React.useEffect(() => {
    loadPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function savePrefs(next: Prefs) {
    setPrefs(next);
    setPrefsSaving(true);
    try {
      await api.patch("/api/v1/notifications/prefs", next);
      toast.success("Notification settings updated.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save settings.");
    } finally {
      setPrefsSaving(false);
    }
  }

  async function onManualRefresh() {
    setRefreshing(true);
    await loadNotifications({ silent: true });
    setRefreshing(false);
  }

  async function toggleRead(id: string, nextRead: boolean) {
    const tId = toast.loading(nextRead ? "Marking as read..." : "Marking as unread...");
    try {
      await api.patch(`/api/v1/notifications/${id}`, { read: nextRead });
      toast.dismiss(tId);
      toast.success(nextRead ? "Marked as read." : "Marked as unread.");
      await loadNotifications({ silent: true });
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Update failed.");
    }
  }

  async function markAllRead() {
    if (pagination.total === 0) return toast.success("No notifications.");
    const tId = toast.loading("Marking all as read...");
    try {
      await api.post("/api/v1/notifications/mark-all-read", {});
      toast.dismiss(tId);
      toast.success("All marked as read.");
      await loadNotifications({ silent: true });
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Failed to mark all as read.");
    }
  }

  async function clearAll() {
    if (pagination.total === 0) return toast.success("No notifications to clear.");
    const ok = window.confirm("Clear ALL notifications?");
    if (!ok) return;

    const tId = toast.loading("Clearing...");
    try {
      await api.delete("/api/v1/notifications/clear");
      toast.dismiss(tId);
      toast.success("Cleared.");
      setPage(1);
      await loadNotifications({ silent: true });
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Failed to clear.");
    }
  }

  async function onDelete(id: string) {
    const ok = window.confirm("Delete this notification?");
    if (!ok) return;

    const tId = toast.loading("Deleting...");
    try {
      await api.delete(`/api/v1/notifications/${id}`);
      toast.dismiss(tId);
      toast.success("Deleted.");
      await loadNotifications({ silent: true });
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Failed to delete.");
    }
  }

  const canPrev = pagination.page > 1;
  const canNext = pagination.page < pagination.totalPages;

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 ? (
                <Badge className="rounded-full bg-linear-to-r from-sky-500 to-indigo-600 text-white">
                  {unreadCount} unread
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full">
                  All caught up
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Updates and assignments. Auto-refreshes when realtime pings arrive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={onManualRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>

            <Button
              className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
              onClick={markAllRead}
              disabled={pagination.total === 0}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark all read
            </Button>

            <Button variant="outline" className="rounded-xl" onClick={clearAll} disabled={pagination.total === 0}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </div>
        </div>

        {/* Filter */}
        <Card className="mt-6 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter</CardTitle>
            <CardDescription>Search and filter by read state.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex-1 relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search notifications..."
                  className="h-11 rounded-xl pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl">
                      Show: {filter === "all" ? "All" : filter === "unread" ? "Unread" : "Read"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Read state</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as any)}>
                      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="unread">Unread</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="read">Read</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl">
                      Page size: {pageSize}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Items per page</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={String(pageSize)}
                      onValueChange={(v) => {
                        setPage(1);
                        setPageSize(Number(v));
                      }}
                    >
                      <DropdownMenuRadioItem value="10">10</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="20">20</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="50">50</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => {
                    setQ("");
                    setFilter("all");
                    setPage(1);
                    setPageSize(20);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="mt-4 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Notification Settings
            </CardTitle>
            <CardDescription>Control which events generate notifications for you.</CardDescription>
          </CardHeader>
          <CardContent>
            {prefsLoading ? (
              <div className="text-sm text-muted-foreground">Loading settings…</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Row
                  label="Task assigned"
                  desc="When a task is assigned to you."
                  checked={prefs.taskAssigned}
                  disabled={prefsSaving}
                  onChange={(v) => savePrefs({ ...prefs, taskAssigned: v })}
                />
                <Row
                  label="Task updated"
                  desc="Status/priority/assignee changes."
                  checked={prefs.taskUpdated}
                  disabled={prefsSaving}
                  onChange={(v) => savePrefs({ ...prefs, taskUpdated: v })}
                />
                <Row
                  label="Due soon"
                  desc="Due date reminders."
                  checked={prefs.dueSoon}
                  disabled={prefsSaving}
                  onChange={(v) => savePrefs({ ...prefs, dueSoon: v })}
                />
                <Row
                  label="System"
                  desc="Product and account alerts."
                  checked={prefs.system}
                  disabled={prefsSaving}
                  onChange={(v) => savePrefs({ ...prefs, system: v })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* List */}
        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading notifications…</div>
          ) : items.length === 0 ? (
            <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base">No notifications</CardTitle>
                <CardDescription>
                  Nothing here yet. When tasks are assigned/updated, you’ll see them here.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Tip: Try “Show: All” if you’re filtering by read state.
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Inbox</CardTitle>
                    <CardDescription>
                      {pagination.total} total • Page {pagination.page} of {pagination.totalPages}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={!canPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Prev
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={!canNext}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-380px)]">
                  <div className="divide-y divide-black/5 dark:divide-white/10">
                    {items.map((n) => (
                      <div key={n.id} className={cn("p-4", !n.read && "bg-sky-500/5")}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
                                <Bell className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="truncate font-semibold text-slate-900 dark:text-slate-50">
                                    {n.title}
                                  </div>
                                  {!n.read ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                                      <Circle className="h-2.5 w-2.5 fill-current" />
                                      Unread
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Read</span>
                                  )}
                                </div>

                                {n.body ? (
                                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    {n.body}
                                  </div>
                                ) : null}

                                <div className="mt-2 text-xs text-muted-foreground">
                                  {formatTime(n.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <Button
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => toggleRead(n.id, !n.read)}
                            >
                              {n.read ? "Mark unread" : "Mark read"}
                            </Button>

                            <Button
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => onDelete(n.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
      <div className="space-y-1">
        <div className="font-semibold">{label}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      <div className="pt-1">
        <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
        <Label className="sr-only">{label}</Label>
      </div>
    </div>
  );
}
