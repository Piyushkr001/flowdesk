// app/api/v1/dashboard/overview/route.ts
import { NextResponse } from "next/server";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { getSession } from "@/lib/auth";
import { tasks, notifications } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const RECENT_TASKS_LIMIT = 6;
const RECENT_NOTIFS_LIMIT = 6;

function noStoreJson(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET() {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const userId = session.id;
  const now = new Date();

  /**
   * Backward compatible: tolerate legacy "done" and new "completed".
   * Using ::text prevents enum casting issues in PG.
   */
  const statusText = sql<string>`${tasks.status}::text`;
  const isOpen = sql<boolean>`(${statusText} NOT IN ('done', 'completed'))`;
  const isCompleted = sql<boolean>`(${statusText} IN ('done', 'completed'))`;

  // Run counts in parallel for better latency
  const [
    assignedToMeQ,
    createdByMeQ,
    overdueQ,
    completedQ,
    unreadNotifQ,
    recentTasksRaw,
    recentNotifications,
  ] = await Promise.all([
    db
      .select({ v: sql<number>`count(*)` })
      .from(tasks)
      .where(and(eq(tasks.assigneeId, userId), isOpen)),

    db
      .select({ v: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.creatorId, userId)),

    db
      .select({ v: sql<number>`count(*)` })
      .from(tasks)
      .where(and(eq(tasks.assigneeId, userId), isOpen, lt(tasks.dueAt, now))),

    db
      .select({ v: sql<number>`count(*)` })
      .from(tasks)
      .where(and(eq(tasks.assigneeId, userId), isCompleted)),

    db
      .select({ v: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false))),

    // Recent tasks shown on dashboard:
    // ✅ recommended: include tasks you created OR are assigned to (more useful overview)
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueAt: tasks.dueAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(or(eq(tasks.assigneeId, userId), eq(tasks.creatorId, userId)))
      .orderBy(desc(tasks.updatedAt))
      .limit(RECENT_TASKS_LIMIT),

    db
      .select({
        id: notifications.id,
        title: notifications.title,
        body: notifications.body,
        createdAt: notifications.createdAt,
        read: notifications.read,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(RECENT_NOTIFS_LIMIT),
  ]);

  // Normalize status for frontend (optional, but avoids legacy "done" leaking)
  const recentTasks = recentTasksRaw.map((t) => ({
    ...t,
    status: String(t.status) === "done" ? "completed" : String(t.status),
  }));

  return noStoreJson({
    stats: {
      assignedToMe: assignedToMeQ[0]?.v ?? 0,
      createdByMe: createdByMeQ[0]?.v ?? 0,
      overdue: overdueQ[0]?.v ?? 0,
      completed: completedQ[0]?.v ?? 0,
      unreadNotifications: unreadNotifQ[0]?.v ?? 0,
    },
    recentTasks,
    recentNotifications,
  });
}
