import { NextResponse } from "next/server";
import { ilike, or, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { users, tasks } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);

  const q = url.searchParams.get("q")?.trim() || "";

  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSizeRaw = Number(url.searchParams.get("pageSize") || 12);
  const pageSize = Math.min(24, Math.max(6, pageSizeRaw));

  const whereClause = q
    ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
    : undefined;

  // Count total users
  let countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(users);

    //@ts-ignore
  if (whereClause) countQuery = countQuery.where(whereClause);

  const countRows = await countQuery;

  const total = Number(countRows?.[0]?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  // Members + correlated subqueries for stats (no schema changes required)
  let membersQuery = db
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
    .orderBy(users.createdAt)
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

    //@ts-ignore
  if (whereClause) membersQuery = membersQuery.where(whereClause);

  const members = await membersQuery;

  const res = NextResponse.json(
    {
      members,
      pagination: { page: safePage, pageSize, total, totalPages },
    },
    { status: 200 }
  );

  res.headers.set("Cache-Control", "no-store");
  return res;
}
