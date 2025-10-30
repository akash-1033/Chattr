import cookie from "cookie";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

const socketUserMap = new Map();
const userSocketMap = new Map();

export default function initSocket(io, JWT_SECRET) {
  io.use((socket, next) => {
    try {
      const raw = socket.request.headers.cookie || "";
      const parsed = cookie.parse(raw || "");
      const token = parsed.token;
      if (!token) {
        return next(new Error("Authentication error: no token"));
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log("Socket connected:", socket.id, "User: ", userId);

    socketUserMap.set(socket.id, userId);
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId).add(socket.id);

    socket.join(`user_${userId}`);
    socket.broadcast.emit("user:online", { userId });

    socket.on("joinConversation", ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
      }
    });

    socket.on("sendMessage", async ({ payload, ack }) => {
      try {
        const { toUserId, content, attachment } = payload;
        if (!toUserId || (!content && !attachment)) {
          return ack && ack({ ok: false, error: "Invalid payload" });
        }

        let conversation = await prisma.conversation.findFirst({
          where: {
            user: {
              some: { id: userId },
            },
            AND: {
              users: { some: { id: toUserId } },
            },
          },
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              users: { connect: [{ id: userId }, { id: toUserId }] },
            },
          });
        }

        const message = await prisma.message.create({
          data: {
            content: content || null,
            attachment: attachment || null,
            senderId: userId,
            receiverId: toUserId,
            conversationId: conversation.id,
          },
        });

        const msgOut = {
          ...message,
          conversationId: conversation.id,
        };

        io.to(`conversation_${conversation.id}`).emit(
          "message:receive",
          msgOut
        );
        ack && ack({ ok: true, message: msgOut });
      } catch (err) {
        console.error("sendMessage error: ", err);
        ack && ack({ ok: false, error: "Server error" });
      }
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`conversation_${conversationId}`).emit("typing", {
        from: userId,
        isTyping,
      });
    });

    socket.on("markRead", async ({ messageId }) => {
      try {
        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { read: true },
        });
        io.to(`user_${updated.senderId}`).emit("message:read", {
          messageId: updated.id,
          by: userId,
        });
      } catch (err) {
        console.error("markRead error:", err);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", socket.id, reason);
      socketUserMap.delete(socket.id);

      const sockets = userSocketsMap.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSocketsMap.delete(userId);
          socket.broadcast.emit("user:offline", { userId });
        }
      }
    });
  });

  return io;
}
