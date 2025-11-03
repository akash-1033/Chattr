import cookie from "cookie";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";
import { uploadToS3 } from "../config/s3.js";
import { generateCloudUrl } from "../utils/cloudfront.js";

let onlineUsers = new Set();

export default function initSocket(io, JWT_SECRET) {
  // socket.io middleware runs before any client connects
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

    // for online presence check
    if (userId) {
      onlineUsers.add(userId);
      const userList = Array.from(onlineUsers);
      io.emit("update_online_users", userList);
    }

    // join private room
    socket.join(`user_${userId}`);

    // auto join all vailable conversations
    prisma.conversation
      .findMany({
        where: { users: { some: { id: userId } } },
        select: { id: true },
      })
      .then((convs) => {
        convs.forEach((c) => socket.join(`conversation_${c.id}`));
      })
      .catch((e) => {
        console.error("Failed to auto-join conversation rooms:", e);
      });

    // manual conversation join
    socket.on("joinConversation", ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
      }
    });

    socket.on("sendMessage", async ({ payload }, ack) => {
      try {
        const { toUserId, content, attachment } = payload;
        if (!toUserId || (!content && !attachment)) {
          return ack && ack({ ok: false, error: "Invalid payload" });
        }

        // get conversations
        let conversation = await prisma.conversation.findFirst({
          where: {
            users: { some: { id: userId } },
            AND: { users: { some: { id: toUserId } } },
          },
        });

        // create conversation if not present
        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: { users: { connect: [{ id: userId }, { id: toUserId }] } },
          });
        }

        let imageKey = null;
        let signedUrl = null;

        if (
          attachment?.fileBuffer &&
          attachment?.fileName &&
          attachment?.contentType
        ) {
          imageKey = `chatImages/${userId}-${Date.now()}-${
            attachment.fileName
          }`;
          await uploadToS3(
            attachment.fileBuffer,
            imageKey,
            attachment.contentType
          );

          signedUrl = await generateCloudUrl(imageKey);
          // console.log(signedUrl);
        }

        // save message to db
        const message = await prisma.message.create({
          data: {
            content: content || null,
            attachment: imageKey || null,
            senderId: userId,
            receiverId: toUserId,
            conversationId: conversation.id,
          },
        });

        const msgOut = {
          ...message,
          conversationId: conversation.id,
          imageUrl: signedUrl,
        };

        // ensure user has join conversation
        io.in(`user_${toUserId}`).socketsJoin(
          `conversation_${conversation.id}`
        );

        // emit message to all in conversation
        io.to(`conversation_${conversation.id}`).emit(
          "message:receive",
          msgOut
        );

        ack && ack({ ok: true, message: msgOut });
      } catch (err) {
        console.error("sendMessage error:", err);
        ack && ack({ ok: false, error: "Server error" });
      }
    });

    socket.on("disconnect", () => {
      if (userId) {
        onlineUsers.delete(userId);
        const userList = Array.from(onlineUsers);
        io.emit("update_online_users", userList);
      }
    });
  });
  return io;
}
