import { NextResponse } from "next/server";
import { ilike, or, sql, asc } from "drizzle-orm";

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

function parseIntSafe(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";

    const page = parseIntSafe(url.searchParams.get("page"), 1);
    const pageSizeRaw = parseIntSafe(url.searchParams.get("pageSize"), 12);
    const pageSize = Math.min(24, Math.max(6, pageSizeRaw));

    // whereClause must always be valid SQL (Drizzle allows SQL here)
    const whereClause = q
      ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
      : sql`true`;

    // Count total users
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);

    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;

    // ✅ Important: cast enum -> text so old comparisons never crash.
    // Treat both 'done' (legacy) and 'completed' (current) as closed.
    const members = await db
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
            and (t.status::text not in ('done', 'completed'))
        )`,
        overdueCount: sql<number>`(
          select count(*) from ${tasks} t
          where (t.assignee_id = ${users.id} or t.creator_id = ${users.id})
            and (t.status::text not in ('done', 'completed'))
            and t.due_at < now()
        )`,
      })
      .from(users)
      .where(whereClause)
      .orderBy(asc(users.createdAt))
      .limit(pageSize)
      .offset(offset);

    return noStoreJson(
      {
        members,
        pagination: { page: safePage, pageSize, total, totalPages },
      },
      200
    );
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    return noStoreJson(
      {
        message: "Internal Server Error",
        ...(isProd ? {} : { detail: err?.message ?? String(err) }),
      },
      500
    );
  }
}
