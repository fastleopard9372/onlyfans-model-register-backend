const mongoose = require('mongoose');

const UnlockedPhotoSchema = new mongoose.Schema({
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  expiresAt: {
    type: Date,
    // Optional expiration date, null means permanent access
  }
}, {
  timestamps: true
});

// Compound index to ensure a donor can only unlock a photo once
UnlockedPhotoSchema.index({ photoId: 1, donorEmail: 1 }, { unique: true });

module.exports = mongoose.model('UnlockedPhoto', UnlockedPhotoSchema);
