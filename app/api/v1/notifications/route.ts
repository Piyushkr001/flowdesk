import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { notifications } from "@/config/schema";
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
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";

  // read can be "true"/"false"
  const readParam = url.searchParams.get("read");
  const read =
    readParam === null ? null : readParam === "true" ? true : readParam === "false" ? false : null;

  const page = parseIntSafe(url.searchParams.get("page"), 1);
  const pageSizeRaw = parseIntSafe(url.searchParams.get("pageSize"), 20);
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
  const offset = (page - 1) * pageSize;

  const whereParts: any[] = [eq(notifications.userId, session.id)];

  if (typeof read === "boolean") whereParts.push(eq(notifications.read, read));

  if (q) {
    whereParts.push(
      or(
        ilike(notifications.title, `%${q}%`),
        ilike(sql`coalesce(${notifications.body}, '')`, `%${q}%`)
      )
    );
  }

  const whereClause = and(...whereParts);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(whereClause);

  const rows = await db
    .select()
    .from(notifications)
    .where(whereClause)
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset(offset);

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return noStoreJson(
    {
      notifications: rows,
      pagination: { page, pageSize, total, totalPages },
    },
    200
  );
}
