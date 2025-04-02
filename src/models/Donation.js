const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    default: 25
  },
  photoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    // Can be null if it's a signup donation
  },
  donorEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripePaymentId: {
    type: String,
    required: true
  },
  stripeSessionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['photo_unlock', 'model_signup'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Donation', DonationSchema);
