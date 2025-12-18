// app/api/v1/tasks/[id]/route.ts
import { NextResponse } from "next/server";
import { and, eq, or, sql, inArray } from "drizzle-orm";

import { db } from "@/config/db";
import { notifications, tasks, users, notificationPrefs } from "@/config/schema";
import { getSession } from "@/lib/auth";
import { emitUser, emitUsers } from "@/lib/realtime-emit";

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

function uniq(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter(Boolean))) as string[];
}

function norm(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

/** legacy: done -> completed */
function normalizeStatus(v: unknown): TaskStatus | "" {
  const s = norm(v).replace(/-/g, "_").replace(/\s+/g, "_");
  if (!s) return "";
  if (s === "done" || s === "complete" || s === "completed") return "completed";
  if (s === "to_do" || s === "todo") return "todo";
  if (s === "in_progress" || s === "inprogress") return "in_progress";
  if (s === "review") return "review";
  return (STATUS_VALUES as readonly string[]).includes(s) ? (s as TaskStatus) : "";
}

function normalizePriority(v: unknown): TaskPriority | "" {
  const p = norm(v).replace(/-/g, "_").replace(/\s+/g, "_");
  if (!p) return "";
  if (p === "urgent") return "urgent";
  if (p === "high") return "high";
  if (p === "medium" || p === "normal") return "medium";
  if (p === "low") return "low";
  return (PRIORITY_VALUES as readonly string[]).includes(p) ? (p as TaskPriority) : "";
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

async function getPrefsMap(userIds: string[]) {
  if (!userIds.length) return new Map<string, { taskAssigned: boolean; taskUpdated: boolean }>();

  const rows = await db
    .select({
      userId: notificationPrefs.userId,
      taskAssigned: notificationPrefs.taskAssigned,
      taskUpdated: notificationPrefs.taskUpdated,
    })
    .from(notificationPrefs)
    .where(inArray(notificationPrefs.userId, userIds));

  const m = new Map<string, { taskAssigned: boolean; taskUpdated: boolean }>();
  for (const r of rows) m.set(r.userId, { taskAssigned: r.taskAssigned, taskUpdated: r.taskUpdated });
  return m;
}

/** ✅ FIX: params is a Promise in Next.js route handlers */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const { id } = await ctx.params;
  if (!id) return noStoreJson({ message: "Missing task id." }, 400);

  const task = await getTaskIfAllowed(id, session.id);
  if (!task) return noStoreJson({ message: "Task not found." }, 404);

  return noStoreJson({ task }, 200);
}

/**
 * ✅ FIXES:
 * 1) params Promise -> await ctx.params
 * 2) neon-http has NO transactions -> update first, then best-effort notifications
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const { id } = await ctx.params;
  if (!id) return noStoreJson({ message: "Missing task id." }, 400);

  const body = await req.json().catch(() => ({}));

  const existing = await getTaskIfAllowed(id, session.id);
  if (!existing) return noStoreJson({ message: "Task not found." }, 404);

  const oldAssigneeId = existing.assigneeId;

  const patch: any = {};
  let statusChanged = false;
  let priorityChanged = false;
  let assigneeChanged = false;

  if (typeof body?.title === "string") {
    const t = body.title.trim();
    if (!t) return noStoreJson({ message: "Title is required." }, 400);
    if (t.length > 100) return noStoreJson({ message: "Title must be at most 100 characters." }, 400);
    patch.title = t;
  }

  if (typeof body?.description === "string") {
    patch.description = body.description;
  }

  if (typeof body?.status === "string") {
    const s = normalizeStatus(body.status);
    if (!s) {
      return noStoreJson(
        { message: `Invalid status. Allowed: ${STATUS_VALUES.join(", ")} (legacy 'done' accepted)` },
        400
      );
    }
    statusChanged = s !== existing.status;
    patch.status = s;
  }

  if (typeof body?.priority === "string") {
    const p = normalizePriority(body.priority);
    if (!p) {
      return noStoreJson({ message: `Invalid priority. Allowed: ${PRIORITY_VALUES.join(", ")}` }, 400);
    }
    priorityChanged = p !== existing.priority;
    patch.priority = p;
  }

  if ("dueAt" in body || "dueDate" in body) {
    const d = parseDateSafe(body?.dueAt ?? body?.dueDate);
    if (!d) return noStoreJson({ message: "dueAt/dueDate is required and must be a valid date." }, 400);
    patch.dueAt = d;
  }

  const requestedAssignee =
    typeof body?.assignedToId === "string"
      ? body.assignedToId.trim()
      : typeof body?.assigneeId === "string"
      ? body.assigneeId.trim()
      : "";

  const willReassign = Boolean(requestedAssignee) && requestedAssignee !== existing.assigneeId;

  if (willReassign) {
    if (existing.creatorId !== session.id) {
      return noStoreJson({ message: "Only the task creator can reassign the task." }, 403);
    }

    const [assignee] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, requestedAssignee))
      .limit(1);

    if (!assignee) return noStoreJson({ message: "Invalid assignedToId/assigneeId (user not found)." }, 400);

    assigneeChanged = true;
    patch.assigneeId = requestedAssignee;
  }

  if (Object.keys(patch).length === 0) {
    return noStoreJson({ message: "Nothing to update." }, 400);
  }

  patch.updatedAt = sql`now()`;

  // ✅ 1) Update task (no transaction)
  const updatedRows = await db
    .update(tasks)
    .set(patch)
    .where(and(eq(tasks.id, id), or(eq(tasks.creatorId, session.id), eq(tasks.assigneeId, session.id))))
    .returning();

  const task = updatedRows[0];
  if (!task) return noStoreJson({ message: "Task not found." }, 404);

  // ✅ 2) Build recipients + prefs
  const recipients = uniq([task.creatorId, task.assigneeId, oldAssigneeId, session.id]);
  const prefUsers = uniq([task.creatorId, task.assigneeId, oldAssigneeId]);
  const prefsMap = await getPrefsMap(prefUsers);
  const prefsOf = (uid: string) => prefsMap.get(uid) ?? { taskAssigned: true, taskUpdated: true };

  // ✅ 3) Best-effort notifications
  const createdNotifs: Array<{ userId: string; notification: any }> = [];

  // assignment notif (respect prefs OR always? you wanted mandatory-safe; keeping mandatory)
  if (willReassign && patch.assigneeId) {
    const newAssigneeId = patch.assigneeId as string;
    try {
      // If you want to respect taskAssigned pref, wrap in if (prefsOf(newAssigneeId).taskAssigned)
      const [notif] = await db
        .insert(notifications)
        .values({
          userId: newAssigneeId,
          title: "Task assigned to you",
          body: `“${task.title}” was assigned to you.`,
          read: false,
        })
        .returning();

      if (notif) createdNotifs.push({ userId: newAssigneeId, notification: notif });
    } catch {}
  }

  // update notif (prefs-respecting)
  if ((statusChanged || priorityChanged) && task.assigneeId && task.assigneeId !== session.id) {
    try {
      if (prefsOf(task.assigneeId).taskUpdated) {
        const what =
          statusChanged && priorityChanged ? "Status and priority" : statusChanged ? "Status" : "Priority";

        const [notif] = await db
          .insert(notifications)
          .values({
            userId: task.assigneeId,
            title: "Task updated",
            body: `${what} updated for “${task.title}”.`,
            read: false,
          })
          .returning();

        if (notif) createdNotifs.push({ userId: task.assigneeId, notification: notif });
      }
    } catch {}
  }

  // ✅ 4) Realtime emits (best-effort)
  try {
    await emitUsers(recipients, "task:updated", {
      task,
      meta: {
        previousAssigneeId: oldAssigneeId,
        changed: { status: statusChanged, priority: priorityChanged, assignee: assigneeChanged },
      },
    });
  } catch {}

  for (const n of createdNotifs) {
    try {
      await emitUser(n.userId, "notification:new", { notification: n.notification });
    } catch {}
  }

  return noStoreJson({ ok: true, task }, 200);
}

/** ✅ FIX: params Promise */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const { id } = await ctx.params;
  if (!id) return noStoreJson({ message: "Missing task id." }, 400);

  const existing = await getTaskIfAllowed(id, session.id);
  if (!existing) return noStoreJson({ message: "Task not found." }, 404);

  if (existing.creatorId !== session.id) {
    return noStoreJson({ message: "Only the task creator can delete this task." }, 403);
  }

  const deleted = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.creatorId, session.id)))
    .returning({ id: tasks.id });

  if (!deleted.length) return noStoreJson({ message: "Task not found." }, 404);

  const recipients = uniq([existing.creatorId, existing.assigneeId, session.id]);

  try {
    await emitUsers(recipients, "task:deleted", { id });
  } catch {}

  return noStoreJson({ ok: true }, 200);
}
