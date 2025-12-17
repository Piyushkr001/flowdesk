// /api/v1/realtime/token/route.ts
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return new TextEncoder().encode(secret);
}

const ISSUER = "flowdesk";
const AUDIENCE = "flowdesk-realtime";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const token = await new SignJWT({
    typ: "realtime",
    rt: true,
    email: session.email,
    name: session.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(session.id)
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(secretKey());

  const res = NextResponse.json({ token }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
