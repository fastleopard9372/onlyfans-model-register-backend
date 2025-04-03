// User Schema
const UserSchema = {
  name: String,
  email: String,
  password: String,
  role: String,
  profilePhoto: {
    url: String, // URL to profile photo
    filename: String // Filename of the photo
  },
  siteAddress: String,
  bio: String,
  isActive: Boolean,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date,
  updatedAt: Date
};

// Photo Schema
const PhotoSchema = {
  userId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  filename: String, // Filename of the original photo
  fileUrl: String, // URL for the original photo
  blurredFilename: String, // Filename of the blurred version
  blurredFileUrl: String, // URL for the blurred version
  isLocked: Boolean,
  price: Number,
  isActive: Boolean,
  donationCount: Number,
  createdAt: Date,
  updatedAt: Date
};

// UnlockedPhoto Schema
const UnlockedPhotoSchema = {
  photoId: mongoose.Schema.Types.ObjectId,
  donorEmail: String,
  amount: Number,
  createdAt: Date
};

// Donation Schema
const DonationSchema = {
  donorEmail: String,
  amount: Number,
  message: String,
  isAnonymous: Boolean,
  createdAt: Date
};

module.exports = {
  UserSchema,
  PhotoSchema,
  UnlockedPhotoSchema,
  DonationSchema
};
