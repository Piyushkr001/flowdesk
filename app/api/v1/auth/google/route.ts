import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { eq, and } from "drizzle-orm";

import { signSession, setSessionCookie } from "@/lib/auth";
import { db } from "@/config/db";
import { accounts, users } from "@/config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const code = String(body?.code ?? "");
    const remember = Boolean(body?.remember ?? true);

    if (!code) {
      return NextResponse.json({ message: "Missing Google code." }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // ✅ Server-only secret (recommended)
    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          message:
            "Google OAuth env is missing. Required: NEXT_PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        },
        { status: 500 }
      );
    }

    // ✅ For @react-oauth/google auth-code flow
    const oauth = new OAuth2Client(clientId, clientSecret, "postmessage");

    const { tokens } = await oauth.getToken(code);

    if (!tokens?.id_token) {
      return NextResponse.json(
        { message: "Google login failed (missing id_token)." },
        { status: 401 }
      );
    }

    const ticket = await oauth.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload?.sub) {
      return NextResponse.json(
        { message: "Google login failed (missing profile)." },
        { status: 401 }
      );
    }

    const email = payload.email.toLowerCase();
    const name = payload.name ?? "User";
    const image = payload.picture ?? null;

    const provider = "google";
    const providerAccountId = payload.sub;

    // 1) Find existing user by email
    const existingUser = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user = existingUser[0];

    // 2) Create user if not exists
    if (!user) {
      const created = await db
        .insert(users)
        .values({
          name,
          email,
          image,
          emailVerified: true,
          passwordHash: null,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        });

      user = created[0];
    }

    // 3) Ensure account mapping exists
    const existingAccount = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId)
        )
      )
      .limit(1);

    if (!existingAccount.length) {
      await db.insert(accounts).values({
        userId: user.id,
        provider,
        providerAccountId,
      });
    }

    // 4) Issue session cookie
    const sessionUser = {
      id: String(user.id),
      email: String(user.email),
      name: String(user.name ?? "User"),
      image: user.image ?? null,
    };

    const token = await signSession(sessionUser, remember);

    const res = NextResponse.json({ ok: true, user: sessionUser }, { status: 200 });
    // ✅ FIX: your lib/auth.ts sets cookies via next/headers cookies()
    await setSessionCookie(res, token, remember);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("[GOOGLE_AUTH_ERROR]", err);
    const message = err instanceof Error ? err.message : "Google login failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
