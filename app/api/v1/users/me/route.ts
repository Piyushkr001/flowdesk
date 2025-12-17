import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/config/db";
import { users } from "@/config/schema";
import { getSession, signSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  // helps avoid any shared cache returning another user's response
  res.headers.set("Vary", "Cookie");
  return res;
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    const res = NextResponse.json({ user: null }, { status: 200 });
    return noStore(res);
  }

  const row = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  const res = NextResponse.json({ user: row[0] ?? session }, { status: 200 });
  return noStore(res);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    return noStore(res);
  }

  const body = await req.json().catch(() => ({}));

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const image = typeof body?.image === "string" ? body.image.trim() : "";
  const remember = Boolean(body?.remember ?? true);

  if (!name) {
    const res = NextResponse.json({ message: "Name is required." }, { status: 400 });
    return noStore(res);
  }
  if (name.length > 60) {
    const res = NextResponse.json({ message: "Name is too long." }, { status: 400 });
    return noStore(res);
  }

  let imageValue: string | null = null;
  if (image) {
    try {
      new URL(image);
      imageValue = image;
    } catch {
      const res = NextResponse.json({ message: "Invalid image URL." }, { status: 400 });
      return noStore(res);
    }
  }

  const updated = await db
    .update(users)
    .set({ name, image: imageValue })
    .where(eq(users.id, session.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    });

  const user = updated[0];

  // ✅ Refresh JWT so Navbar shows updated name/image immediately
  const token = await signSession(
    { id: user.id, email: user.email, name: user.name, image: user.image },
    remember
  );

  const res = NextResponse.json({ ok: true, user }, { status: 200 });
  setSessionCookie(res, token, remember);

  return noStore(res);
}
