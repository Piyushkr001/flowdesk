import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { notifications } from "@/config/schema";
import { getSession } from "@/lib/auth";
import { emitUser } from "@/lib/realtime-emit";

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

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  if (typeof body?.read !== "boolean") {
    return noStoreJson({ message: "read must be boolean." }, 400);
  }

  const updated = await db
    .update(notifications)
    .set({ read: body.read, createdAt: notifications.createdAt }) // keep createdAt unchanged
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.id)))
    .returning();

  const notif = updated[0];
  if (!notif) return noStoreJson({ message: "Notification not found." }, 404);

  await emitUser(session.id, "notification:updated", { notification: notif });

  return noStoreJson({ ok: true, notification: notif }, 200);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const { id } = await ctx.params;

  const deleted = await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.id)))
    .returning({ id: notifications.id });

  if (!deleted.length) {
    return noStoreJson({ message: "Notification not found." }, 404);
  }

  await emitUser(session.id, "notification:deleted", { id });

  return noStoreJson({ ok: true }, 200);
}
