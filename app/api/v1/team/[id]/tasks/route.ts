import { NextResponse } from "next/server";
import { and, or, eq, ilike, sql, desc } from "drizzle-orm";

import { db } from "@/config/db";
import { tasks } from "@/config/schema";
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

type View = "assigned" | "created" | "all";

function safeView(v: string | null): View {
  const x = (v || "assigned").trim().toLowerCase();
  if (x === "assigned" || x === "created" || x === "all") return x;
  return "assigned";
}

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const id = String(ctx.params?.id || "").trim();
  if (!id) return noStoreJson({ message: "Missing user id." }, 400);

  const url = new URL(req.url);

  const view = safeView(url.searchParams.get("view"));
  const q = url.searchParams.get("q")?.trim() || "";

  const page = parseIntSafe(url.searchParams.get("page"), 1);
  const pageSizeRaw = parseIntSafe(url.searchParams.get("pageSize"), 10);
  const pageSize = Math.min(20, Math.max(5, pageSizeRaw));

  const who =
    view === "created"
      ? eq(tasks.creatorId, id)
      : view === "all"
      ? or(eq(tasks.creatorId, id), eq(tasks.assigneeId, id))
      : eq(tasks.assigneeId, id); // assigned

  const whereParts: any[] = [who];

  // ✅ Search (title + description if present)
  if (q) {
    whereParts.push(
      or(
        ilike(tasks.title, `%${q}%`),
        // If you don't have tasks.description in schema, remove the next line:
        ilike((tasks as any).description, `%${q}%`)
      )
    );
  }

  const whereClause = and(...whereParts);

  // count
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tasks)
    .where(whereClause);

  const total = Number(countRow?.count ?? 0);
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
    .where(whereClause)
    .orderBy(desc(tasks.createdAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return noStoreJson({
    tasks: rows,
    pagination: { page: safePage, pageSize, total, totalPages },
  });
}
