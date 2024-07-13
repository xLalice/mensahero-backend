const express = require('express');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
    try {
        const { senderId, recipientId, content } = req.body;
        const message = new Message({ senderId, recipientId, content });
        await message.save();
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/conversation/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.params.userId },
                { recipientId: req.params.userId }
            ]
        }).sort('timestamp');
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

router.get('/conversations', auth, async (req, res) => {
    try {
      const messages = await Message.find({
        $or: [{ sender: req.user.id }, { recipient: req.user.id }]
      }).sort('-timestamp');
  
      const conversations = messages.reduce((acc, message) => {
        const conversationPartnerId = message.sender.toString() === req.user.id ? 
          message.recipient.toString() : message.sender.toString();
        
        if (!acc[conversationPartnerId]) {
          acc[conversationPartnerId] = message;
        }
        return acc;
      }, {});
  
      res.json(Object.values(conversations));
    } catch (error) {
      res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
  });

module.exports = router;