import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

/**
 * ✅ FIX #1: Use absolute API base in production so cookie auth works reliably
 * (especially when NEXT_PUBLIC_API_URL points to a separate API domain).
 */
function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

async function getRealtimeToken(): Promise<string> {
  const base = apiBase();

  const res = await fetch(`${base}/api/v1/realtime/token`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to get realtime token");
  }

  const data = await res.json().catch(() => ({}));
  if (!data?.token) throw new Error("Missing realtime token in response");

  return String(data.token);
}

/**
 * Returns a singleton Socket.io client.
 * - Uses short-lived token from /api/v1/realtime/token
 * - Auto-reconnects
 * - Re-auths on reconnect if token expired
 */
export async function getSocket(): Promise<Socket> {
  // Already connected
  if (socket && socket.connected) return socket;

  // In-flight connect (avoid multiple parallel connections)
  if (connecting) return connecting;

  connecting = (async () => {
    const url = process.env.NEXT_PUBLIC_REALTIME_URL?.replace(/\/$/, "");
    if (!url) throw new Error("NEXT_PUBLIC_REALTIME_URL is missing");

    const token = await getRealtimeToken();

    /**
     * ✅ FIX #2: Let Socket.IO fall back to polling if websocket is blocked.
     * Your server is Socket.IO; forcing websocket-only frequently fails on hosts.
     */
    const s = io(url, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 20000,
    });

    /**
     * ✅ FIX #3: Don’t call s.connect() repeatedly in a tight loop.
     * Use a small backoff + only refresh token on auth-related errors.
     */
    let refreshing = false;

    const refreshAuthAndReconnect = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const next = await getRealtimeToken();
        s.auth = { token: next };
        // Only reconnect if not currently connected/connecting
        if (!s.connected) s.connect();
      } catch {
        // silent; UI should still work without realtime
      } finally {
        refreshing = false;
      }
    };

    s.on("connect_error", async (err: any) => {
      const msg = String(err?.message || "").toLowerCase();
      // "unauthorized" is what your server sends in io.use() on auth failure
      if (msg.includes("unauthorized")) {
        await refreshAuthAndReconnect();
      }
    });

    s.on("disconnect", async (reason) => {
      // If server explicitly kicked us, refresh token and reconnect
      if (reason === "io server disconnect") {
        await refreshAuthAndReconnect();
      }
    });

    socket = s;
    return s;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

/**
 * Optional: call on logout to close the realtime connection.
 */
export function disconnectSocket() {
  try {
    socket?.disconnect();
  } catch {}
  socket = null;
  connecting = null;
}
