const { Server } = require("socket.io");

let io;

const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173,http://127.0.0.1:5173,http://0.0.0.0:5173,http://10.207.33.31:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (configuredOrigins.includes(origin) || configuredOrigins.includes("*")) return true;

  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.")
    );
  } catch {
    return false;
  }
}

function initSocket(server) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} is not allowed by Socket.IO CORS`));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join_room", ({ room }) => {
      if (room) socket.join(room);
    });

    socket.on("leave_room", ({ room }) => {
      if (room) socket.leave(room);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io has not been initialized.");
  }
  return io;
}

module.exports = { initSocket, getIO };