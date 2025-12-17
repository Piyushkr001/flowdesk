import { NextResponse } from "next/server";
import { and, or, eq, ilike, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { tasks } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const url = new URL(req.url);
  const view = (url.searchParams.get("view") || "assigned") as "assigned" | "created" | "all";
  const q = url.searchParams.get("q")?.trim() || "";

  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(20, Math.max(5, Number(url.searchParams.get("pageSize") || 10)));

  const who =
    view === "created"
      ? eq(tasks.creatorId, id)
      : view === "all"
      ? or(eq(tasks.creatorId, id), eq(tasks.assigneeId, id))
      : eq(tasks.assigneeId, id); // assigned

  const where = and(
    who,
    q ? ilike(tasks.title, `%${q}%`) : sql`true`
  );

  // count
  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(where);

  const total = Number(countRows?.[0]?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      createdAt: tasks.createdAt,
      creatorId: tasks.creatorId,
      assigneeId: tasks.assigneeId,
    })
    .from(tasks)
    .where(where)
    .orderBy(sql`${tasks.createdAt} desc`)
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  const res = NextResponse.json(
    {
      tasks: rows,
      pagination: { page: safePage, pageSize, total, totalPages },
    },
    { status: 200 }
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
