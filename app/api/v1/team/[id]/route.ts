import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { users, tasks } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,

      assignedCount: sql<number>`(
        select count(*) from ${tasks} t
        where t.assignee_id = ${users.id}
      )`,
      createdCount: sql<number>`(
        select count(*) from ${tasks} t
        where t.creator_id = ${users.id}
      )`,
      openCount: sql<number>`(
        select count(*) from ${tasks} t
        where (t.assignee_id = ${users.id} or t.creator_id = ${users.id})
          and t.status <> 'done'
      )`,
      overdueCount: sql<number>`(
        select count(*) from ${tasks} t
        where (t.assignee_id = ${users.id} or t.creator_id = ${users.id})
          and t.status <> 'done'
          and t.due_at is not null
          and t.due_at < now()
      )`,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const member = rows[0] ?? null;

  const res = NextResponse.json({ member }, { status: member ? 200 : 404 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
