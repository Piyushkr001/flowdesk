import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { signSession, setSessionCookie } from "@/lib/auth";
import { db } from "@/config/db";
import { users } from "@/config/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const remember = Boolean(body?.remember ?? true); // ✅ optional, matches login behavior

    if (!name) {
      return NextResponse.json({ message: "Name is required." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length) {
      return NextResponse.json(
        { message: "Email is already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        emailVerified: false,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      });

    const createdUser = created[0];
    if (!createdUser?.id) {
      return NextResponse.json({ message: "Failed to create user." }, { status: 500 });
    }

    // ✅ create session payload (ensures correct types)
    const sessionUser = {
      id: String(createdUser.id),
      name: String(createdUser.name ?? "User"),
      email: String(createdUser.email),
      image: createdUser.image ?? null,
    };

    const token = await signSession(sessionUser, remember);

    // ✅ IMPORTANT: set cookie on the response that you return
    const res = NextResponse.json(
      { ok: true, user: sessionUser },
      { status: 201 }
    );

    setSessionCookie(res, token, remember);
    res.headers.set("Cache-Control", "no-store");

    return res;
  } catch {
    return NextResponse.json({ message: "Failed to register." }, { status: 500 });
  }
}
