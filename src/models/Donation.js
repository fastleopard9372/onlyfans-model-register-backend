const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donorEmail: {
    type: String,
    required: [true, 'Please add a donor email']
  },
  donorType: {
    type: String,
    enum: ["model", "visitor"],
    default:"model"
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount']
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  photoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo'
  },
  status: {
    type: String,
    default: 'pending'
  },
  stripePaymentId: {
    type: String
  },
  stripeSessionId: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Donation', DonationSchema);
