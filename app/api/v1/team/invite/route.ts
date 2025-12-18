import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/config/db";
import { users } from "@/config/schema";
import { getSession } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStoreJson(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return noStoreJson({ message: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!name) return noStoreJson({ message: "Name is required." }, 400);
  if (!email || !isEmail(email)) return noStoreJson({ message: "Valid email is required." }, 400);

  // already exists?
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return noStoreJson({ message: "User with this email already exists." }, 400);

  // ✅ Insert user (adjust if your schema requires role/isActive/etc.)
  const inserted = await db
    .insert(users)
    .values({
      name,
      email,
      image: null,
    } as any)
    .returning({ id: users.id, name: users.name, email: users.email });

  const user = inserted[0];
  if (!user) return noStoreJson({ message: "Failed to create user." }, 500);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/auth/login?email=${encodeURIComponent(email)}`;

  // ✅ Send email (requires Gmail App Password)
  try {
    await sendInviteEmail({
      to: email,
      name,
      inviteUrl,
    });
  } catch (e: any) {
    return noStoreJson(
      {
        message: "User created, but invite email failed. Check SMTP credentials (Gmail App Password).",
        error: e?.message,
      },
      500
    );
  }

  return noStoreJson({ ok: true, userId: user.id }, 201);
}
