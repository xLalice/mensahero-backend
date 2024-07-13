const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    content: { type: String, required: true },
    timestamp : { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema)