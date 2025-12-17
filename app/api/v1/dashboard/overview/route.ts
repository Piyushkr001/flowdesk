import { NextResponse } from "next/server";
import { and, desc, eq, lt, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { getSession } from "@/lib/auth";
import { tasks, notifications } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // ✅ Backward compatible: "done" (old) OR "completed" (new)
  // Using ::text prevents enum casting errors.
  const statusText = sql<string>`${tasks.status}::text`;
  const isOpen = sql<boolean>`(${statusText} NOT IN ('done', 'completed'))`;
  const isCompleted = sql<boolean>`(${statusText} IN ('done', 'completed'))`;

  // Counts
  const assignedToMeQ = await db
    .select({ v: sql<number>`count(*)` })
    .from(tasks)
    .where(and(eq(tasks.assigneeId, userId), isOpen));

  const createdByMeQ = await db
    .select({ v: sql<number>`count(*)` })
    .from(tasks)
    .where(eq(tasks.creatorId, userId));

  const overdueQ = await db
    .select({ v: sql<number>`count(*)` })
    .from(tasks)
    .where(and(eq(tasks.assigneeId, userId), isOpen, lt(tasks.dueAt, now)));

  const completedQ = await db
    .select({ v: sql<number>`count(*)` })
    .from(tasks)
    .where(and(eq(tasks.assigneeId, userId), isCompleted));

  const unreadNotifQ = await db
    .select({ v: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  // Lists
  const recentTasksRaw = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .where(eq(tasks.assigneeId, userId))
    .orderBy(desc(tasks.updatedAt))
    .limit(6);

  // ✅ normalize status for frontend (optional but nice)
  const recentTasks = recentTasksRaw.map((t) => ({
    ...t,
    status: String(t.status) === "done" ? "completed" : String(t.status),
  }));

  const recentNotifications = await db
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
    .limit(5);

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
