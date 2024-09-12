"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const passport_1 = __importDefault(require("./config/passport"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');
const index_1 = require("./socket/index");
const auth_1 = __importDefault(require("./routes/auth"));
const conversation_1 = __importDefault(require("./routes/conversation"));
const messages_1 = __importDefault(require("./routes/messages"));
const users_1 = __importDefault(require("./routes/users"));
require('dotenv').config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use((0, express_session_1.default)({
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'none',
    },
    secret: process.env.SECRET || "",
    store: new PrismaSessionStore(new PrismaClient(), {}),
    rolling: true
}));
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(express_1.default.urlencoded({ extended: false }));
app.use('/api/auth', auth_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/users', users_1.default);
app.use('/api/conversations', conversation_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
// 404 handler
app.use((req, res) => {
    res.status(404).send("Sorry, that route doesn't exist.");
});
(0, index_1.initializeWebSocket)(server);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
