import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

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

export async function POST() {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, session.id));

  await emitUser(session.id, "notification:bulkUpdated", { read: true });

  return noStoreJson({ ok: true }, 200);
}
