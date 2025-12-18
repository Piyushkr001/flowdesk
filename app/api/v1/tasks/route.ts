// app/api/v1/tasks/route.ts
import { NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, lt, or, sql, isNotNull } from "drizzle-orm";

import { db } from "@/config/db";
import { tasks, users, notifications, notificationPrefs } from "@/config/schema";
import { getSession } from "@/lib/auth";
import { emitUser, emitUsers, emitWorkspace } from "@/lib/realtime-emit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_VALUES = ["todo", "in_progress", "review", "completed"] as const;
const PRIORITY_VALUES = ["low", "medium", "high", "urgent"] as const;

type TaskStatus = (typeof STATUS_VALUES)[number];
type TaskPriority = (typeof PRIORITY_VALUES)[number];
type TaskView = "all" | "assigned" | "created" | "overdue";

function isTaskStatus(v: unknown): v is TaskStatus {
  return typeof v === "string" && (STATUS_VALUES as readonly string[]).includes(v);
}
function isTaskPriority(v: unknown): v is TaskPriority {
  return typeof v === "string" && (PRIORITY_VALUES as readonly string[]).includes(v);
}
function isTaskView(v: unknown): v is TaskView {
  return v === "all" || v === "assigned" || v === "created" || v === "overdue";
}

function parseIntSafe(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseDateSafe(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function noStoreJson(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function normEnum(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

async function getTaskAssignedPref(userId: string) {
  const [row] = await db
    .select({ taskAssigned: notificationPrefs.taskAssigned })
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);

  return row?.taskAssigned ?? true;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const url = new URL(req.url);

  const q = url.searchParams.get("q")?.trim() || "";
  const statusParam = url.searchParams.get("status")?.trim() || "";
  const priorityParam = url.searchParams.get("priority")?.trim() || "";
  const sort = url.searchParams.get("sort")?.trim() || "updated"; // updated | due | created
  const viewRaw = url.searchParams.get("view")?.trim() || "all";

  const view = normEnum(viewRaw) as TaskView;
  if (!isTaskView(view)) {
    return noStoreJson(
      { message: "Invalid view. Allowed: all, assigned, created, overdue" },
      400
    );
  }

  const pageRaw = parseIntSafe(url.searchParams.get("page"), 1);
  const pageSizeRaw = parseIntSafe(url.searchParams.get("pageSize"), 20);
  const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);

  const statusFilter = statusParam ? normEnum(statusParam) : "";
  const priorityFilter = priorityParam ? normEnum(priorityParam) : "";

  if (statusFilter && !isTaskStatus(statusFilter)) {
    return noStoreJson({ message: `Invalid status. Allowed: ${STATUS_VALUES.join(", ")}` }, 400);
  }
  if (priorityFilter && !isTaskPriority(priorityFilter)) {
    return noStoreJson({ message: `Invalid priority. Allowed: ${PRIORITY_VALUES.join(", ")}` }, 400);
  }

  const whereParts: any[] = [];

  // --- Personal Views ---
  if (view === "all") {
    whereParts.push(or(eq(tasks.creatorId, session.id), eq(tasks.assigneeId, session.id)));
  } else if (view === "assigned") {
    whereParts.push(eq(tasks.assigneeId, session.id));
  } else if (view === "created") {
    whereParts.push(eq(tasks.creatorId, session.id));
  } else if (view === "overdue") {
    const now = new Date();
    const statusText = sql<string>`${tasks.status}::text`;
    const isOpen = sql<boolean>`(${statusText} NOT IN ('done', 'completed'))`;

    // ✅ FIX: only overdue if dueAt exists
    whereParts.push(
      and(eq(tasks.assigneeId, session.id), isOpen, isNotNull(tasks.dueAt), lt(tasks.dueAt, now))
    );
  }

  // --- Search ---
  if (q) whereParts.push(or(ilike(tasks.title, `%${q}%`), ilike(tasks.description, `%${q}%`)));

  // --- Filters ---
  if (statusFilter) whereParts.push(eq(tasks.status, statusFilter as any));
  if (priorityFilter) whereParts.push(eq(tasks.priority, priorityFilter as any));

  // ✅ SAFETY: if empty, true
  const whereClause = whereParts.length ? and(...whereParts) : sql`true`;

  const orderBy =
    sort === "due"
      ? [asc(tasks.dueAt), desc(tasks.updatedAt)]
      : sort === "created"
      ? [desc(tasks.createdAt), desc(tasks.updatedAt)]
      : [desc(tasks.updatedAt)];

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(whereClause);

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ✅ FIX: clamp page
  const page = Math.min(pageRaw, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  return noStoreJson({ tasks: rows, pagination: { page, pageSize, total, totalPages } }, 200);
}

/**
 * ✅ neon-http driver does NOT support transactions.
 * So we do: create task -> (best effort) create notification -> emit events.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";

  const statusRaw = normEnum(body?.status || "todo");
  const priorityRaw = normEnum(body?.priority || "medium");

  const requestedAssignee =
    typeof body?.assignedToId === "string"
      ? body.assignedToId.trim()
      : typeof body?.assigneeId === "string"
      ? body.assigneeId.trim()
      : "";

  const assigneeId = requestedAssignee || session.id;
  const dueAt = parseDateSafe(body?.dueAt ?? body?.dueDate);

  if (!title) return noStoreJson({ message: "Title is required." }, 400);
  if (title.length > 100) return noStoreJson({ message: "Title must be at most 100 characters." }, 400);
  if (!dueAt) return noStoreJson({ message: "dueAt (dueDate) is required and must be a valid date." }, 400);

  if (!isTaskStatus(statusRaw)) {
    return noStoreJson({ message: `Invalid status. Allowed: ${STATUS_VALUES.join(", ")}` }, 400);
  }
  if (!isTaskPriority(priorityRaw)) {
    return noStoreJson({ message: `Invalid priority. Allowed: ${PRIORITY_VALUES.join(", ")}` }, 400);
  }

  const [assignee] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, assigneeId))
    .limit(1);

  if (!assignee) return noStoreJson({ message: "Invalid assignedToId/assigneeId (user not found)." }, 400);

  // 1) Create task
  const created = await db
    .insert(tasks)
    .values({
      title,
      description,
      status: statusRaw,
      priority: priorityRaw,
      dueAt,
      creatorId: session.id,
      assigneeId,
    })
    .returning();

  const task = created[0];
  if (!task) return noStoreJson({ message: "Failed to create task." }, 500);

  // 2) (Best-effort) notification insert
  let notif: any = null;
  if (assigneeId !== session.id) {
    try {
      const allow = await getTaskAssignedPref(assigneeId);
      if (allow) {
        const inserted = await db
          .insert(notifications)
          .values({
            userId: assigneeId,
            title: "Task assigned to you",
            body: `“${task.title}” was assigned to you.`,
            read: false,
          })
          .returning();

        notif = inserted[0] ?? null;
      }
    } catch {
      notif = null;
    }
  }

  // 3) Realtime emits (best-effort)
  try {
    await emitWorkspace("task:created", { task });
  } catch {}

  try {
    await emitUsers([session.id, assigneeId], "task:created", { task });
  } catch {}

  if (notif) {
    try {
      await emitUser(assigneeId, "notification:new", { notification: notif });
    } catch {}
  }

  return noStoreJson({ ok: true, task }, 201);
}
