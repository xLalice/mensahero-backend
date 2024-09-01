import express from "express";
import auth from "../middleware/auth";
import upload from "../middleware/multer";
import prisma from "../config/prisma";
import {imageUploader} from "../config/cloudinary";
import { randomUUID } from "crypto";


const router = express.Router();

// Send a new message
router.post('/', auth, upload.single('image'), async (req, res) => {

    console.log('Received message request:', req.body);
    console.log('File:', req.file);

    try {
        const { conversationId, senderId, content } = req.body;

        const conversation = await prisma.conversation.findUnique({
            where: { id: parseInt(conversationId) },
            include: { participants: true },
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(participant => participant.id === parseInt(senderId));
        if (!isParticipant) {
            return res.status(403).json({ message: 'User is not part of this conversation' });
        }

        let messageData: any = {
            conversationId: conversation.id,
            senderId: parseInt(senderId),
            content: content || '',
            messageType: 'text',
            timestamp: new Date(),
        };

        if (req.file) {
            try {
                const result = await imageUploader(req.file.buffer, `chat_images/${conversationId}`, ``);

                messageData.messageType = "image";
                messageData.content = result.secure_url;
            } catch(error){
                console.error("Error uploading to Cloudinary: ", error);
                return res.status(500).json({message: "Error uploading image"})
            }
        } else if (!content) {
            return res.status(400).json({ message: 'Message content is required for text messages' });
        }

        const newMessage = await prisma.message.create({
            data: messageData
        });

        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageId: newMessage.id },
        });

        res.status(201).json(newMessage);
    } catch (error: any) {
        console.error('Detailed error in message creation:', error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
});

export default router;
