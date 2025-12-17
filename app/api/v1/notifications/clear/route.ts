import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/config/db";
import { notifications } from "@/config/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await db.delete(notifications).where(eq(notifications.userId, session.id));

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
