import { Server } from "socket.io";
import prisma from "../config/prisma";
require("dotenv").config();

const onlineUsers = new Map();
const conversationCache = new Map();

export function initializeWebSocket(server: any) {
  const io = new Server(server, {
    cors: {
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  const broadcastOnlineUsers = () => {
    const onlineUserMap: { [userId: number]: string } = {};
    for (const [userId, socketId] of onlineUsers.entries()) {
      onlineUserMap[userId] = socketId;
    }
    io.emit("update_online_users", onlineUserMap);
  };

  io.on("connection", (socket) => {

    socket.on("user_connected", async (userId) => {
      onlineUsers.set(userId, socket.id);

      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { lastActive: new Date() },
      });

      broadcastOnlineUsers();
    });

    socket.on("user_disconnect", async (userId) => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { lastActive: new Date() },
          });
          break;
        }
      }

      broadcastOnlineUsers();
    });

    socket.on("send_message", async (data, callback) => {
      const { conversationId, senderId, content, timestamp, messageType } =
        data;

      let participants;

      if (conversationCache.has(conversationId)) {
        participants = conversationCache.get(conversationId);
      } else {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { participants: true },
        });

        participants = conversation?.participants;
        conversationCache.set(conversationId, participants);
      }

      let messageSent = false;


      participants.forEach((participant: { userId: number }) => {
        if (participant.userId !== senderId) {
          const recipientSocketId = onlineUsers.get(participant.userId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("receive_message", {
              conversationId,
              senderId,
              content,
              timestamp,
              messageType,
            });
            messageSent = true;
          }
        }
      });

      if (callback) {
        callback({
          status: messageSent ? "success" : "failed",
          message: messageSent
            ? "Message successfully processed"
            : "Message failed to send",
        });
      }
    });
  });

  return io;
}
