const mongoose = require('mongoose');
const generateCode = require('../utils/generateCode');

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
  
  // Skip if token is already defined
  if (this.token) {
    return next();
  }
  
  
  
  // Try to create a unique token (retry if duplicate)
  let token = generateCode();
  let isUnique = false;
  
  while (!isUnique) {
    // Check if this token already exists in the database
    const existingDoc = await this.constructor.findOne({ token });
    
    if (!existingDoc) {
      isUnique = true;
    } else {
      token = generateCode(); // Generate a new token
    }
  }
  
  if (!isUnique) {
    return next(new Error('Could not generate a unique token after multiple attempts'));
  }
  
  this.token = token;
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
