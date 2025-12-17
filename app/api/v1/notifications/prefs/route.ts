import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/config/db";
import { notificationPrefs } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const row = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, session.id))
    .limit(1);

  // fallback defaults if not created yet
  const prefs =
    row[0] ?? {
      userId: session.id,
      taskAssigned: true,
      taskUpdated: true,
      dueSoon: true,
      system: true,
    };

  const res = NextResponse.json({ prefs }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const next = {
    taskAssigned: Boolean(body?.taskAssigned),
    taskUpdated: Boolean(body?.taskUpdated),
    dueSoon: Boolean(body?.dueSoon),
    system: Boolean(body?.system),
  };

  const existing = await db
    .select({ userId: notificationPrefs.userId })
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, session.id))
    .limit(1);

  if (existing.length) {
    await db
      .update(notificationPrefs)
      .set({ ...next, updatedAt: new Date() })
      .where(eq(notificationPrefs.userId, session.id));
  } else {
    await db.insert(notificationPrefs).values({ userId: session.id, ...next });
  }

  const res = NextResponse.json({ ok: true, prefs: { userId: session.id, ...next } }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
