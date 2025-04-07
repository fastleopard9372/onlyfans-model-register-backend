const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donorEmail: {
    type: String,
    required: [true, 'Please add a donor email']
  },
  donorName: {
    type: String,
    required: [true, 'Please add a donor name']
  },
  donorType: {
    type: String,
    enum: ["model", "visitor"],
    default:"model"
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: 1,
    max: 1000,
    default: 25
  },
  message: {
    type: String,
    default: '',
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  photo: {
    type: mongoose.Types.ObjectId,
    ref: 'Photo',
    required: true
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'succeeded', 'failed']
  },
  stripePaymentId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Donation', DonationSchema);
