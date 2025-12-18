import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { users, tasks } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStoreJson(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const { id: rawId } = await ctx.params;
  const id = String(rawId || "").trim();
  if (!id) return noStoreJson({ message: "Missing user id." }, 400);

  // ✅ Enum-safe "open" status check (works for enum/text and legacy 'done')
  // Avoids: invalid input value for enum when comparing status <> 'done'
  const isOpen = sql<boolean>`(t.status::text NOT IN ('done','completed'))`;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,

      // total assigned tasks
      assignedCount: sql<number>`(
        select count(*)::int from ${tasks} t
        where t.assignee_id = ${users.id}
      )`,

      // total created tasks
      createdCount: sql<number>`(
        select count(*)::int from ${tasks} t
        where t.creator_id = ${users.id}
      )`,

      // ✅ open tasks (recommended: assigned-to user & not completed/done)
      openCount: sql<number>`(
        select count(*)::int from ${tasks} t
        where t.assignee_id = ${users.id}
          and ${isOpen}
      )`,

      // ✅ overdue tasks (recommended: assigned-to user & open & due_at < now)
      overdueCount: sql<number>`(
        select count(*)::int from ${tasks} t
        where t.assignee_id = ${users.id}
          and ${isOpen}
          and t.due_at is not null
          and t.due_at < now()
      )`,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const member = rows[0] ?? null;
  if (!member) return noStoreJson({ message: "User not found." }, 404);

  return noStoreJson({ member }, 200);
}
