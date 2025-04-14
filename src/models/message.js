const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content cannot be empty'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String,
    default: []
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);
