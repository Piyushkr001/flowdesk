import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "flowdesk_session";

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

export async function signSession(user: SessionUser, remember: boolean) {
  const exp = remember ? "30d" : "1d";

  return new SignJWT({
    email: user.email,
    name: user.name,
    image: user.image ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secretKey());
}

export function setSessionCookie(res: NextResponse, token: string, remember: boolean) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(res: NextResponse) {
  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || !payload.email || !payload.name) return null;

    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      image: payload.image ? String(payload.image) : null,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}
