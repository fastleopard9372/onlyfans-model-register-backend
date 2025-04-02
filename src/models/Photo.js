const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  s3Key: {
    type: String,
    required: true
  },
  s3Url: {
    type: String,
    required: true
  },
  blurredS3Key: {
    type: String,
    required: true
  },
  blurredS3Url: {
    type: String,
    required: true
  },
  isLocked: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    default: 25
  },
  isActive: {
    type: Boolean,
    default: true
  },
  donationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Photo', PhotoSchema);
