const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MessageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    homeId: { type: String, required: true, index: true },
    tradeId: { type: String, default: '', index: true },
    taskId: { type: String, default: '', index: true },
    author: {
      email: { type: String, default: '' },
      fullName: { type: String, default: '' },
    },
    text: { type: String, required: true },
    attachments: [
      {
        _id: { type: String, default: uuidv4 },
        title: String,
        url: String,
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

MessageSchema.index({ homeId: 1, createdAt: -1 });
MessageSchema.index({ homeId: 1, tradeId: 1, createdAt: -1 });
MessageSchema.index({ homeId: 1, taskId: 1, createdAt: -1 });

const Message = mongoose.model('Message', MessageSchema);

module.exports = { Message };



