const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel',
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Lawyer'],
  },
  senderRole: {
    type: String,
    required: true,
    enum: ['user', 'lawyer'],
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
