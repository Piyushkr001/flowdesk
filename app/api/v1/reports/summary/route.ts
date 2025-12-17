// app/api/v1/reports/summary/route.ts
import { NextResponse } from "next/server";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { tasks, users } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_VALUES = ["todo", "in_progress", "review", "completed"] as const;
const PRIORITY_VALUES = ["low", "medium", "high", "urgent"] as const;

type TaskStatus = (typeof STATUS_VALUES)[number];
type TaskPriority = (typeof PRIORITY_VALUES)[number];

function noStoreJson(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function norm(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function normalizeStatus(v: unknown): TaskStatus | "" {
  const s = norm(v).replace(/\s+/g, "_");
  if (s === "to_do") return "todo";
  if (s === "in_progress") return "in_progress";
  if (s === "review") return "review";
  if (s === "completed") return "completed";
  if (s === "done") return "completed"; // backward-compat input
  if ((STATUS_VALUES as readonly string[]).includes(s)) return s as TaskStatus;
  return "";
}

function normalizePriority(v: unknown): TaskPriority | "" {
  const p = norm(v);
  if ((PRIORITY_VALUES as readonly string[]).includes(p)) return p as TaskPriority;
  return "";
}

// Input: "YYYY-MM-DD" from <input type="date" />
function parseDateOnlyToStart(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function parseDateOnlyToEnd(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtYMD(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const url = new URL(req.url);

  const q = url.searchParams.get("q")?.trim() || "";
  const statusFilter = normalizeStatus(url.searchParams.get("status"));
  const priorityFilter = normalizePriority(url.searchParams.get("priority"));

  // Date range (defaults: last 30 days)
  const now = new Date();
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const defaultFrom = new Date(defaultTo);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 30);
  defaultFrom.setUTCHours(0, 0, 0, 0);

  const fromParam = url.searchParams.get("from") || "";
  const toParam = url.searchParams.get("to") || "";

  const from = parseDateOnlyToStart(fromParam) ?? defaultFrom;
  const to = parseDateOnlyToEnd(toParam) ?? defaultTo;

  if (from > to) {
    return noStoreJson({ message: "`from` cannot be after `to`." }, 400);
  }

  if (url.searchParams.get("status") && !statusFilter) {
    return noStoreJson(
      { message: `Invalid status. Allowed: ${STATUS_VALUES.join(", ")}` },
      400
    );
  }
  if (url.searchParams.get("priority") && !priorityFilter) {
    return noStoreJson(
      { message: `Invalid priority. Allowed: ${PRIORITY_VALUES.join(", ")}` },
      400
    );
  }

  // ✅ Visibility rule (consistent with your /api/v1/tasks)
  // Only tasks you created OR tasks assigned to you.
  const whereParts: any[] = [
    or(eq(tasks.creatorId, session.id), eq(tasks.assigneeId, session.id)),
    gte(tasks.dueAt, from),
    lte(tasks.dueAt, to),
  ];

  if (q) {
    whereParts.push(or(ilike(tasks.title, `%${q}%`), ilike(tasks.description, `%${q}%`)));
  }
  if (statusFilter) whereParts.push(eq(tasks.status, statusFilter as any));
  if (priorityFilter) whereParts.push(eq(tasks.priority, priorityFilter as any));

  const whereClause = and(...whereParts);

  // Backward-safe “open vs completed” checks (prevents enum crashes if old code/data ever appears)
  const statusText = sql<string>`${tasks.status}::text`;
  const isCompleted = sql<boolean>`(${statusText} IN ('done', 'completed'))`;
  const isOpen = sql<boolean>`NOT ${isCompleted}`;

  // 1) Totals (single query)
  const [totalsRow] = await db
    .select({
      all: sql<number>`count(*)::int`,
      completed: sql<number>`sum(case when ${isCompleted} then 1 else 0 end)::int`,
      open: sql<number>`sum(case when ${isOpen} then 1 else 0 end)::int`,
      overdue: sql<number>`sum(case when ${isOpen} and ${tasks.dueAt} < now() then 1 else 0 end)::int`,
    })
    .from(tasks)
    .where(whereClause);

  // 2) Breakdown by status
  const statusRows = await db
    .select({
      status: statusText,
      count: sql<number>`count(*)::int`,
    })
    .from(tasks)
    .where(whereClause)
    .groupBy(statusText);

  // 3) Breakdown by priority
  const priorityText = sql<string>`${tasks.priority}::text`;
  const priorityRows = await db
    .select({
      priority: priorityText,
      count: sql<number>`count(*)::int`,
    })
    .from(tasks)
    .where(whereClause)
    .groupBy(priorityText);

  // 4) Top creators
  const topCreatorsRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      count: sql<number>`count(*)::int`,
    })
    .from(tasks)
    .innerJoin(users, eq(users.id, tasks.creatorId))
    .where(whereClause)
    .groupBy(users.id, users.name, users.email)
    .orderBy(desc(sql`count(*)`))
    .limit(6);

  // Normalize breakdown objects (always include all keys)
  const byStatus: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    review: 0,
    completed: 0,
  };

  for (const r of statusRows) {
    const s = String(r.status || "").toLowerCase();
    if (s === "done") byStatus.completed += Number(r.count ?? 0);
    else if ((STATUS_VALUES as readonly string[]).includes(s)) byStatus[s as TaskStatus] = Number(r.count ?? 0);
  }

  const byPriority: Record<TaskPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  for (const r of priorityRows) {
    const p = String(r.priority || "").toLowerCase();
    if ((PRIORITY_VALUES as readonly string[]).includes(p)) byPriority[p as TaskPriority] = Number(r.count ?? 0);
  }

  return noStoreJson({
    range: { from: fmtYMD(from), to: fmtYMD(to) },
    totals: {
      all: Number(totalsRow?.all ?? 0),
      open: Number(totalsRow?.open ?? 0),
      completed: Number(totalsRow?.completed ?? 0),
      overdue: Number(totalsRow?.overdue ?? 0),
    },
    byStatus,
    byPriority,
    topCreators: topCreatorsRows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      count: Number(u.count ?? 0),
    })),
  });
}
