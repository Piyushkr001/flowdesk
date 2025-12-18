import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { jwtVerify } from "jose";

const app = express();

// avoid accidental huge payloads
app.use(express.json({ limit: "1mb" }));

const ORIGIN_RAW = process.env.CORS_ORIGIN || "http://localhost:3000" || "https://flowdesk-72sm.vercel.app/";
const ORIGINS = ORIGIN_RAW.split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: ORIGINS.length ? ORIGINS : ["http://localhost:3000"],
    credentials: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: ORIGINS.length ? ORIGINS : ["http://localhost:3000"],
    credentials: true,
  },
});

// Rooms
const WORKSPACE_ROOM = "workspace:global";
const userRoom = (userId: string) => `user:${userId}`;

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return new TextEncoder().encode(secret);
}

async function verifySocketToken(token?: string) {
  if (!token) throw new Error("Missing token");
  const { payload } = await jwtVerify(token, secretKey());

  if (!payload.sub) throw new Error("Missing sub");
  if (payload.rt !== true) throw new Error("Not a realtime token");

  return { userId: String(payload.sub) };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function uniq(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter(Boolean))) as string[];
}

io.use(async (socket, next) => {
  try {
    const token = (socket.handshake.auth as any)?.token as string | undefined;
    const { userId } = await verifySocketToken(token);

    (socket.data as any).userId = userId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = (socket.data as any).userId as string;

  socket.join(WORKSPACE_ROOM);
  socket.join(userRoom(userId));

  socket.emit("ready", { ts: Date.now(), userId });
});

// Emit bridge (server-to-socket)
app.post("/emit", (req, res) => {
  const auth = req.header("authorization") || "";
  const secret = process.env.REALTIME_SERVER_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const body = req.body || {};
  const scope = body.scope as unknown;
  const event = body.event as unknown;
  const payload = body.payload;

  if (!isNonEmptyString(scope) || !isNonEmptyString(event)) {
    return res.status(400).json({ message: "Missing/invalid scope/event" });
  }

  if (scope === "workspace") {
    io.to(WORKSPACE_ROOM).emit(event, payload);
    return res.json({ ok: true });
  }

  if (scope === "user") {
    const userId = body.userId as unknown;
    if (!isNonEmptyString(userId)) {
      return res.status(400).json({ message: "Missing/invalid userId" });
    }
    io.to(userRoom(userId)).emit(event, payload);
    return res.json({ ok: true });
  }

  // ✅ NEW: batch emit for emitUsers([...])
  if (scope === "users") {
    const userIds = body.userIds as unknown;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Missing/invalid userIds" });
    }

    const ids = uniq(
      userIds.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
    );

    if (ids.length === 0) {
      return res.status(400).json({ message: "userIds must contain at least one valid id" });
    }

    const rooms = ids.map(userRoom);

    // emits to all those rooms; Socket.IO de-dupes sockets across rooms internally
    io.to(rooms).emit(event, payload);

    return res.json({ ok: true, recipients: ids.length });
  }

  return res.status(400).json({ message: "Invalid scope" });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 4001);
server.listen(port, () => {
  console.log(`Realtime server listening on :${port}`);
  console.log(`Allowed origins: ${ORIGINS.join(", ") || "(default localhost)"}`);
});
