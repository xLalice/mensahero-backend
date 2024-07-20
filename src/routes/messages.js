const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const auth = require('../middleware/auth');

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
router.post('/', auth, async (req, res) => {
    const message = new Message({
        conversationId: req.body.conversationId,
        senderId: req.body.senderId,
        content: req.body.content
    });

    if (!message.conversationId || !message.senderId || !message.content) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const newMessage = await message.save();
        const conversation = await Conversation.findByIdAndUpdate(req.body.conversationId, {
            lastMessage: newMessage._id
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;