import { NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

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

function isTaskStatus(v: unknown): v is TaskStatus {
  return typeof v === "string" && (STATUS_VALUES as readonly string[]).includes(v);
}

function isTaskPriority(v: unknown): v is TaskPriority {
  return typeof v === "string" && (PRIORITY_VALUES as readonly string[]).includes(v);
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

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const url = new URL(req.url);

  const q = url.searchParams.get("q")?.trim() || "";
  const statusParam = url.searchParams.get("status")?.trim() || "";
  const priorityParam = url.searchParams.get("priority")?.trim() || "";
  const sort = url.searchParams.get("sort")?.trim() || "updated"; // updated | due | created

  const page = parseIntSafe(url.searchParams.get("page"), 1);
  const pageSizeRaw = parseIntSafe(url.searchParams.get("pageSize"), 20);
  const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);
  const offset = (page - 1) * pageSize;

  const statusFilter = statusParam ? normEnum(statusParam) : "";
  const priorityFilter = priorityParam ? normEnum(priorityParam) : "";

  if (statusFilter && !isTaskStatus(statusFilter)) {
    return noStoreJson(
      { message: `Invalid status. Allowed: ${STATUS_VALUES.join(", ")}` },
      400
    );
  }
  if (priorityFilter && !isTaskPriority(priorityFilter)) {
    return noStoreJson(
      { message: `Invalid priority. Allowed: ${PRIORITY_VALUES.join(", ")}` },
      400
    );
  }

  const whereParts: any[] = [];

  // ✅ Security: only tasks you created or are assigned to
  whereParts.push(or(eq(tasks.creatorId, session.id), eq(tasks.assigneeId, session.id)));

  // ✅ Search (title + description)
  if (q) {
    whereParts.push(or(ilike(tasks.title, `%${q}%`), ilike(tasks.description, `%${q}%`)));
  }

  // ✅ Filters
  if (statusFilter) whereParts.push(eq(tasks.status, statusFilter as any));
  if (priorityFilter) whereParts.push(eq(tasks.priority, priorityFilter as any));

  const whereClause = and(...whereParts);

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

  const rows = await db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return noStoreJson(
    {
      tasks: rows,
      pagination: { page, pageSize, total, totalPages },
    },
    200
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";

  const statusRaw = normEnum(body?.status || "todo");
  const priorityRaw = normEnum(body?.priority || "medium");

  // ✅ Accept both spec name and your internal name
  const requestedAssignee =
    typeof body?.assignedToId === "string"
      ? body.assignedToId.trim()
      : typeof body?.assigneeId === "string"
      ? body.assigneeId.trim()
      : "";

  const assigneeId = requestedAssignee || session.id;

  // Spec: dueDate required
  const dueAt = parseDateSafe(body?.dueAt ?? body?.dueDate);

  if (!title) return noStoreJson({ message: "Title is required." }, 400);
  if (title.length > 100) return noStoreJson({ message: "Title must be at most 100 characters." }, 400);

  if (!dueAt) {
    return noStoreJson({ message: "dueAt (dueDate) is required and must be a valid date." }, 400);
  }

  if (!isTaskStatus(statusRaw)) {
    return noStoreJson(
      { message: `Invalid status. Allowed: ${STATUS_VALUES.join(", ")}` },
      400
    );
  }

  if (!isTaskPriority(priorityRaw)) {
    return noStoreJson(
      { message: `Invalid priority. Allowed: ${PRIORITY_VALUES.join(", ")}` },
      400
    );
  }

  // Ensure assignee exists (friendlier than FK error)
  const [assignee] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, assigneeId))
    .limit(1);

  if (!assignee) {
    return noStoreJson({ message: "Invalid assignedToId/assigneeId (user not found)." }, 400);
  }

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

  return noStoreJson({ ok: true, task: created[0] }, 201);
}
