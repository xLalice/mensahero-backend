const express = require('express');
const User = require('./src/models/User');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const passport = require('./src/config/passport');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS options
const io = new Server(server, {
  cors: {
    origin: [
      "https://mensahero-frontend.vercel.app",
      "https://mensahero-frontend-git-main-john-lorenzs-projects.vercel.app",
      "https://mensahero-frontend-2nazryrsr-john-lorenzs-projects.vercel.app"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure CORS for Express
app.use(cors({
  origin: [
    "https://mensahero-frontend.vercel.app",
    "https://mensahero-frontend-git-main-john-lorenzs-projects.vercel.app",
    "https://mensahero-frontend-2nazryrsr-john-lorenzs-projects.vercel.app"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const authRoutes = require('./src/routes/auth');
const messageRoutes = require('./src/routes/messages');
const userRoutes = require('./src/routes/users');
const conversationRoutes = require('./src/routes/conversation');

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Sorry, that route doesn't exist.");
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  socket.on('user_connected', async (userId) => {
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { lastActive: Date.now() });
    io.emit('user_status_change', { userId, status: 'online' });
  });

  socket.on('disconnect', async () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, { lastActive: Date.now() });
        io.emit('user_status_change', { userId, status: 'offline' });
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
