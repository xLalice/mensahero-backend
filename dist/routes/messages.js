"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const multer_1 = __importDefault(require("../middleware/multer"));
const prisma_1 = __importDefault(require("../config/prisma"));
const cloudinary_1 = require("../config/cloudinary");
const router = express_1.default.Router();
// Send a new message
router.post('/', auth_1.default, multer_1.default.single('image'), async (req, res) => {
    try {
        const { conversationId, senderId, content } = req.body;
        const conversation = await prisma_1.default.conversation.findUnique({
            where: { id: parseInt(conversationId) },
            include: { participants: true },
        });
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        const isParticipant = conversation.participants.some(participant => participant.userId === parseInt(senderId));
        if (!isParticipant) {
            return res.status(403).json({ message: 'User is not part of this conversation' });
        }
        let messageData = {
            conversationId: conversation.id,
            senderId: parseInt(senderId),
            content: content || '',
            messageType: 'text',
            timestamp: new Date(),
        };
        if (req.file) {
            try {
                const result = await (0, cloudinary_1.imageUploader)(req.file.buffer, `chat_images/${conversationId}`, ``);
                messageData.messageType = "image";
                messageData.content = result.secure_url;
            }
            catch (error) {
                console.error("Error uploading to Cloudinary: ", error);
                return res.status(500).json({ message: "Error uploading image" });
            }
        }
        else if (!content) {
            return res.status(400).json({ message: 'Message content is required for text messages' });
        }
        const newMessage = await prisma_1.default.message.create({
            data: messageData
        });
        await prisma_1.default.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageId: newMessage.id },
        });
        res.status(201).json(newMessage);
    }
    catch (error) {
        console.error('Detailed error in message creation:', error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
});
exports.default = router;
