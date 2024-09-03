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

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("user_connected", async (userId) => {
      console.log(`User ${userId} connected with socket ID ${socket.id}`);
      onlineUsers.set(userId, socket.id);
      console.log('Online Users after user connected:', onlineUsers);
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { lastActive: new Date() },
      });
      io.emit("user_status_change", { userId, status: "online" });
    });
    

    socket.on("disconnect", async () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { lastActive: new Date() },
          });
          io.emit("user_status_change", { userId, status: "offline" });
          break;
        }
      }
    });

    socket.on('send_message', async (data, callback) => {
      const { conversationId, senderId, content, timestamp, messageType } = data;
    
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

      console.log("Participants: ", participants);
    
      participants.forEach((participant: { userId: number }) => {
        console.log("ID: ", participant.userId)
        if (participant.userId !== senderId) {
          const recipientSocketId = onlineUsers.get(participant.userId);
          console.log(`Recipient ID: ${participant.userId}, Recipient Socket ID: ${recipientSocketId}`);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("receive_message", {
              conversationId,
              senderId,
              content,
              timestamp,
              messageType
            });
            messageSent = true;
          } else {
            console.log(`Recipient ${participant.userId} is not connected`);
          }
        }
      });
    
      if (callback) {
        callback({ status: messageSent ? 'success' : 'failed', message: messageSent ? 'Message successfully processed' : 'Message failed to send' });
      }
    });
    
  });

  return io;
}
