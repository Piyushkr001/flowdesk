import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { notificationPrefs } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStoreJson(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

async function ensurePrefs(userId: string) {
  const rows = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);

  if (rows[0]) return rows[0];

  const [created] = await db
    .insert(notificationPrefs)
    .values({ userId })
    .returning();

  return created;
}

export async function GET() {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const prefs = await ensurePrefs(session.id);
  return noStoreJson({ prefs }, 200);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  await ensurePrefs(session.id);

  const body = await req.json().catch(() => ({}));
  const patch: any = {};

  for (const k of ["taskAssigned", "taskUpdated", "dueSoon", "system"] as const) {
    if (typeof body?.[k] === "boolean") patch[k] = body[k];
  }

  if (Object.keys(patch).length === 0) {
    return noStoreJson({ message: "Nothing to update." }, 400);
  }

  patch.updatedAt = sql`now()`;

  const [updated] = await db
    .update(notificationPrefs)
    .set(patch)
    .where(eq(notificationPrefs.userId, session.id))
    .returning();

  return noStoreJson({ ok: true, prefs: updated }, 200);
}
