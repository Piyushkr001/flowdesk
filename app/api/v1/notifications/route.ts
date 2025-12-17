import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { notifications } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);

  const q = url.searchParams.get("q")?.trim() || "";
  const readParam = url.searchParams.get("read"); // "true" | "false" | null

  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSizeRaw = Number(url.searchParams.get("pageSize") || 20);
  const pageSize = Math.min(50, Math.max(10, pageSizeRaw));

  const whereParts: any[] = [eq(notifications.userId, session.id)];

  if (q) {
    whereParts.push(
      or(
        ilike(notifications.title, `%${q}%`),
        ilike(notifications.body, `%${q}%`)
      )
    );
  }

  if (readParam === "true") whereParts.push(eq(notifications.read, true));
  if (readParam === "false") whereParts.push(eq(notifications.read, false));

  const where = and(...whereParts);

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(where);

  const total = Number(countRows?.[0]?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = await db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  const res = NextResponse.json(
    {
      notifications: rows,
      pagination: { page: safePage, pageSize, total, totalPages },
    },
    { status: 200 }
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
