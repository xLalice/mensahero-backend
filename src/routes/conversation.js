const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

router.get('/:conversationId', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/user/:currentUserId', auth, async (req, res) => {
  try {
      const conversations = await Conversation.find({ participants: req.params.currentUserId })
          .populate('lastMessage')
          .sort({ 'lastMessage.timestamp': -1 });
      res.json(conversations);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { participants } = req.body;  
  try {
      let conversation = await Conversation.findOne({
          participants: { $all: participants, $size: participants.length }
      });

      if (!conversation) {
          conversation = new Conversation({ participants });
          await conversation.save();
      }
      res.json(conversation);
  } catch (error) {
      console.error('Error creating conversation:', error);  
      res.status(500).json({ message: error.message });
  }
});

module.exports = router;