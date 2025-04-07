const mongoose = require('mongoose');
const crypto = require('crypto');

const InvitationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  token: {
    type: String,
    // required: true,
    unique: true
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

//generate unique token before saving if not set
InvitationSchema.pre('save', async function (next) {
  console.log("presave");
  
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Virtual field to check if the invitation is expired
InvitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

InvitationSchema.pre('find', function(next) {
  this.model.updateMany({
    status: 'pending',
    expiresAt: { $lt: new Date() }
  },
  {
    status: 'expired'
  }).exec();
  next();
});

module.exports = mongoose.model('Invitation', InvitationSchema);
