// lib/realtime-emit.ts
type EmitBody =
  | { scope: "workspace"; event: string; payload: any }
  | { scope: "user"; userId: string; event: string; payload: any }
  | { scope: "users"; userIds: string[]; event: string; payload: any };

export async function emitWorkspace(event: string, payload: any) {
  return emit({ scope: "workspace", event, payload });
}

export async function emitUser(userId: string, event: string, payload: any) {
  if (!userId) return;
  return emit({ scope: "user", userId, event, payload });
}

export async function emitUsers(userIds: string[], event: string, payload: any) {
  const ids = Array.from(new Set((userIds ?? []).filter(Boolean)));
  if (!ids.length) return;
  return emit({ scope: "users", userIds: ids, event, payload });
}

async function emit(body: EmitBody) {
  const url = process.env.REALTIME_SERVER_URL;
  const secret = process.env.REALTIME_SERVER_SECRET;
  if (!url || !secret) return;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[realtime-emit] failed", res.status, text);
    }
  } catch (err) {
    console.error("[realtime-emit] error", err);
  }
}
