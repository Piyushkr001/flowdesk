import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

async function getRealtimeToken(): Promise<string> {
  const res = await fetch("/api/v1/realtime/token", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
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
    const url = process.env.NEXT_PUBLIC_REALTIME_URL;
    if (!url) throw new Error("NEXT_PUBLIC_REALTIME_URL is missing");

    const token = await getRealtimeToken();

    const s = io(url, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 20000,
    });

    // If token expires (2m), refresh token and reconnect cleanly
    s.on("connect_error", async (err: any) => {
      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("unauthorized")) {
        try {
          const next = await getRealtimeToken();
          s.auth = { token: next };
          s.connect();
        } catch {
          // Keep silent; UI should still work without realtime
        }
      }
    });

    s.on("disconnect", async (reason) => {
      // If server explicitly rejected, refresh token and reconnect
      if (reason === "io server disconnect") {
        try {
          const next = await getRealtimeToken();
          s.auth = { token: next };
          s.connect();
        } catch {
          // silent
        }
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
