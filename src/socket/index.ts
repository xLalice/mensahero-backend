import { Server } from "socket.io";
import prisma from "../config/prisma";
require("dotenv").config();

const onlineUsers = new Map();

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
      onlineUsers.set(userId, socket.id);
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

    socket.on('send_message', (data) => {
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (recipientSocketId){
        io.to(recipientSocketId).emit("receive_message", data);
      }
    })
  });

  return io;
}
