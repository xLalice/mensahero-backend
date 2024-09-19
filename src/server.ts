import express, {Request, Response, NextFunction} from "express";
import http from "http";
import passport from "./config/passport";
import cors from "cors";
import path from "path";
import expressSession from "express-session";
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');
import {initializeWebSocket} from "./socket/index";
import authRoutes from "./routes/auth";
import conversationRoutes from "./routes/conversation";
import messageRoutes from "./routes/messages";
import userRoutes from "./routes/users";
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

console.log(process.env.FRONTEND_URL)
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(expressSession({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, 
    sameSite: 'none',
    secure: true
  },
  secret: process.env.SECRET || "",
  store: new PrismaSessionStore(
    new PrismaClient(),
    {

    }
  ),
  rolling: true
}))

app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Sorry, that route doesn't exist.");
});

initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
