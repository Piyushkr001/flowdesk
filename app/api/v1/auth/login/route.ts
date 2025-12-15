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
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const remember = Boolean(body?.remember ?? true);

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const found = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = found[0];
    if (!user) return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });

    if (!user.passwordHash) {
      return NextResponse.json(
        { message: "This account uses Google sign-in. Please continue with Google." },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });

    const sessionUser = {
      id: String(user.id),
      name: String(user.name ?? "User"),
      email: String(user.email),
      image: user.image ?? null,
    };

    const token = await signSession(sessionUser, remember);

    // ✅ IMPORTANT: set cookie on the same response you return
    const res = NextResponse.json({ ok: true, user: sessionUser }, { status: 200 });
    setSessionCookie(res, token, remember);

    // optional: avoid caching surprises
    res.headers.set("Cache-Control", "no-store");

    return res;
  } catch {
    return NextResponse.json({ message: "Failed to login." }, { status: 500 });
  }
}
