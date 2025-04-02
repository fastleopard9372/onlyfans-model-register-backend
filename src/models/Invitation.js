const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Default expiration is 7 days from creation
      const now = new Date();
      return new Date(now.setDate(now.getDate() + 7));
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invitation', InvitationSchema);
