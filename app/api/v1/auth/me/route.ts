import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getSession();

  const res = NextResponse.json({ user: session ?? null }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
