import { NextResponse } from "next/server";
import { and, eq, or, sql } from "drizzle-orm";

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
function parseDateSafe(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function getTaskIfAllowed(taskId: string, userId: string) {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), or(eq(tasks.creatorId, userId), eq(tasks.assigneeId, userId))))
    .limit(1);

  return rows[0] ?? null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await Promise.resolve(ctx.params as any);

  const task = await getTaskIfAllowed(id, session.id);
  if (!task) {
    const res404 = NextResponse.json({ message: "Task not found." }, { status: 404 });
    res404.headers.set("Cache-Control", "no-store");
    return res404;
  }

  const res = NextResponse.json({ task }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await Promise.resolve(ctx.params as any);
  const body = await req.json().catch(() => ({}));

  // Load task first (also ensures authorization)
  const existing = await getTaskIfAllowed(id, session.id);
  if (!existing) {
    const res404 = NextResponse.json({ message: "Task not found." }, { status: 404 });
    res404.headers.set("Cache-Control", "no-store");
    return res404;
  }

  const patch: any = {};

  // title (max 100)
  if (typeof body?.title === "string") {
    const t = body.title.trim();
    if (!t) return NextResponse.json({ message: "Title is required." }, { status: 400 });
    if (t.length > 100)
      return NextResponse.json({ message: "Title must be at most 100 characters." }, { status: 400 });
    patch.title = t;
  }

  // description (multi-line text)
  if (typeof body?.description === "string") {
    patch.description = body.description.trim();
  }

  // status enum
  if (typeof body?.status === "string") {
    if (!isTaskStatus(body.status)) {
      return NextResponse.json(
        { message: `Invalid status. Allowed: ${STATUS_VALUES.join(", ")}` },
        { status: 400 }
      );
    }
    patch.status = body.status;
  }

  // priority enum
  if (typeof body?.priority === "string") {
    if (!isTaskPriority(body.priority)) {
      return NextResponse.json(
        { message: `Invalid priority. Allowed: ${PRIORITY_VALUES.join(", ")}` },
        { status: 400 }
      );
    }
    patch.priority = body.priority;
  }

  // dueAt (required by spec) – allow change but do NOT allow null
  if ("dueAt" in body) {
    const d = parseDateSafe(body?.dueAt);
    if (!d) {
      return NextResponse.json(
        { message: "dueAt is required and must be a valid date." },
        { status: 400 }
      );
    }
    patch.dueAt = d;
  }

  // assigneeId (only creator can reassign – recommended)
  if (typeof body?.assigneeId === "string") {
    const nextAssigneeId = body.assigneeId.trim();
    if (!nextAssigneeId) {
      return NextResponse.json({ message: "assigneeId cannot be empty." }, { status: 400 });
    }

    if (existing.creatorId !== session.id) {
      return NextResponse.json(
        { message: "Only the task creator can reassign the task." },
        { status: 403 }
      );
    }

    const [assignee] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, nextAssigneeId))
      .limit(1);

    if (!assignee) {
      return NextResponse.json({ message: "Invalid assigneeId (user not found)." }, { status: 400 });
    }

    patch.assigneeId = nextAssigneeId;
  }

  // nothing to update
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "Nothing to update." }, { status: 400 });
  }

  patch.updatedAt = sql`now()`;

  const updated = await db
    .update(tasks)
    .set(patch)
    .where(and(eq(tasks.id, id), or(eq(tasks.creatorId, session.id), eq(tasks.assigneeId, session.id))))
    .returning();

  const task = updated[0];
  if (!task) {
    const res404 = NextResponse.json({ message: "Task not found." }, { status: 404 });
    res404.headers.set("Cache-Control", "no-store");
    return res404;
  }

  const res = NextResponse.json({ ok: true, task }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await Promise.resolve(ctx.params as any);

  // (Recommended) only creator can delete
  const deleted = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.creatorId, session.id)))
    .returning({ id: tasks.id });

  if (!deleted.length) {
    const res404 = NextResponse.json({ message: "Task not found." }, { status: 404 });
    res404.headers.set("Cache-Control", "no-store");
    return res404;
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
