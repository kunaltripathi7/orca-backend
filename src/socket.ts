import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "@clerk/clerk-sdk-node";
import { CLERK_SECRET_KEY } from "./secrets";
import { db } from "./clients/prismaClient";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  profileId?: string;
}

let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = await verifyToken(token, {
        secretKey: CLERK_SECRET_KEY,
      });

      if (!decoded || !decoded.sub) {
        return next(new Error("Invalid token"));
      }

      const profile = await db.profile.findUnique({
        where: { userId: decoded.sub },
      });

      if (!profile) {
        return next(new Error("Profile not found"));
      }

      socket.userId = decoded.sub;
      socket.profileId = profile.id;
      next();
    } catch (error: any) {
      console.error("Socket auth error:", error?.message || error);
      next(new Error("Authentication failed"));
    }
  });


  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.profileId}`);

    socket.on("join:channel", (channelId: string) => {
      socket.join(`channel:${channelId}`);
      console.log(`User ${socket.profileId} joined channel:${channelId}`);
    });

    socket.on("leave:channel", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      console.log(`User ${socket.profileId} left channel:${channelId}`);
    });

    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.profileId} joined conversation:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.profileId} left conversation:${conversationId}`);
    });

    socket.on("join:server", (serverId: string) => {
      socket.join(`server:${serverId}`);
      console.log(`User ${socket.profileId} joined server:${serverId}`);
    });

    socket.on("leave:server", (serverId: string) => {
      socket.leave(`server:${serverId}`);
      console.log(`User ${socket.profileId} left server:${serverId}`);
    });

    socket.on("typing:start", ({ channelId, conversationId, member }) => {
      const room = channelId ? `channel:${channelId}` : `conversation:${conversationId}`;
      socket.to(room).emit("user:typing", { member, isTyping: true });
    });

    socket.on("typing:stop", ({ channelId, conversationId, member }) => {
      const room = channelId ? `channel:${channelId}` : `conversation:${conversationId}`;
      socket.to(room).emit("user:typing", { member, isTyping: false });
    });

    socket.on("webrtc:join", ({ channelId, peerId }) => {
      socket.join(`voice:${channelId}`);
      socket.to(`voice:${channelId}`).emit("webrtc:user-joined", {
        peerId,
        profileId: socket.profileId,
      });
    });

    socket.on("webrtc:signal", ({ targetPeerId, signal }) => {
      io.to(targetPeerId).emit("webrtc:signal", {
        peerId: socket.id,
        signal,
      });
    });

    socket.on("webrtc:leave", ({ channelId }) => {
      socket.leave(`voice:${channelId}`);
      socket.to(`voice:${channelId}`).emit("webrtc:user-left", {
        peerId: socket.id,
        profileId: socket.profileId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.profileId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export const emitToChannel = (channelId: string, event: string, data: any) => {
  getIO().to(`channel:${channelId}`).emit(event, data);
};

export const emitToConversation = (conversationId: string, event: string, data: any) => {
  getIO().to(`conversation:${conversationId}`).emit(event, data);
};

export const emitToServer = (serverId: string, event: string, data: any) => {
  getIO().to(`server:${serverId}`).emit(event, data);
};
