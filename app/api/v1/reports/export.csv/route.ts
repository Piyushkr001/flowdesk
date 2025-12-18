import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { tasks, users } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function csvEscape(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: Record<string, unknown>[]) {
  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(","));
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }
  return lines.join("\n");
}

function parseDateParam(v: string | null) {
  if (!v) return null;
  const d = new Date(v); // accepts YYYY-MM-DD
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const from = parseDateParam(url.searchParams.get("from"));
  const to = parseDateParam(url.searchParams.get("to"));

  // Use dueAt for date range filtering (align with your reports semantics)
  const where = and(
    q
      ? or(ilike(tasks.title, `%${q}%`), ilike(tasks.description, `%${q}%`))
      : undefined,
    status ? eq(tasks.status, status as any) : undefined,
    priority ? eq(tasks.priority, priority as any) : undefined,
    from ? sql`${tasks.dueAt} >= ${from}` : undefined,
    to ? sql`${tasks.dueAt} <= ${to}` : undefined
  );

  // NOTE: This joins creator info. If you want assignee info too, add a users alias.
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.creatorId))
    .where(where)
    .orderBy(desc(tasks.updatedAt))
    .limit(5000); // guardrail

  const headers = [
    "id",
    "title",
    "description",
    "status",
    "priority",
    "dueAt",
    "createdAt",
    "updatedAt",
    "creatorName",
    "creatorEmail",
  ];

  const csv = toCsv(headers, rows as any);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reports.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
