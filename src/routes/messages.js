const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');

// Get messages for a conversation
router.get('/:conversationId', auth, async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send a new message
router.post('/', auth, upload.single('image'), async (req, res) => {

    console.log('Received message request:', req.body);
    console.log('File:', req.file);
    try {
        const { conversationId, senderId, content } = req.body;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(senderId)) {
            return res.status(403).json({ message: 'User is not part of this conversation' });
        }

        let messageData = {
            conversationId,
            senderId,
            content: content || '',
            messageType: 'text'
        };

        if (req.file) {
            messageData.messageType = 'image';
            messageData.content = 'uploads/' + req.file.filename;
        } else if (!content) {
            return res.status(400).json({ message: 'Message content is required for text messages' });
        }

        const message = new Message(messageData);
        const newMessage = await message.save();

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: newMessage._id
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Detailed error in message creation:', error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
});

module.exports = router;