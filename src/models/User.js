const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Please add a username'],
    // unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false  // This means password is not returned by default
  },
  role: {
    type: String,
    enum: ['model', 'visitor', 'admin', 'superadmin'],
    default: 'model'
  },
  profilePhoto: {
    type: String,
    default: null
  },
  siteAddress: {
    type: String,
    // unique: true,
    sparse: true
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  quote: {
    type: String,
    default: '',
    maxlength: [500, 'Quote cannot be more than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  age: {    
    type: Number,
    default: 0
  },
  zodiac: {
    type: String,
    default: ''
  },
  height: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    default: 0
  },
  eyes: {
    type: String,
    default: ''
  },
  hair: {
    type: String,
    default: ''
  },
  favoriteBook: {
    type: String,
    default: ''
  },
  futureGoals: {
    type: String,
    default: ''
  },
  donationId: {
    type: mongoose.Types.ObjectId,
    ref: 'Donation'
  },
  invitedBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    default: null
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
