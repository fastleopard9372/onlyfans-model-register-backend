// User Schema
const UserSchema = {
  _id: ObjectId, // MongoDB auto-generated ID
  name: String, // Model's name
  email: String, // Model's email (unique)
  password: String, // Hashed password
  siteAddress: String, // Model's website or social media link
  profilePhoto: {
    url: String, // S3 URL to profile photo
    key: String, // S3 key for the photo
  },
  isActive: Boolean, // Account status
  role: String, // "model" or "admin"
  invitedBy: ObjectId, // Reference to the user who sent the invitation
  invitationsSent: [ObjectId], // Array of invitation IDs sent by this user
  createdAt: Date,
  updatedAt: Date
}

// Photo Schema
const PhotoSchema = {
  _id: ObjectId, // MongoDB auto-generated ID
  userId: ObjectId, // Reference to the user who uploaded the photo
  title: String, // Optional title for the photo
  description: String, // Optional description
  s3Key: String, // S3 key for the original photo
  s3Url: String, // S3 URL for the original photo
  blurredS3Key: String, // S3 key for the blurred version
  blurredS3Url: String, // S3 URL for the blurred version
  isLocked: Boolean, // Whether the photo requires donation to unlock
  price: Number, // Donation amount required to unlock (default $25)
  isActive: Boolean, // Whether the photo is displayed on the site
  donationCount: Number, // Number of donations received for this photo
  createdAt: Date,
  updatedAt: Date
}

// Invitation Schema
const InvitationSchema = {
  _id: ObjectId, // MongoDB auto-generated ID
  code: String, // Unique invitation code
  email: String, // Email of the invited model
  senderId: ObjectId, // Reference to the user who sent the invitation
  status: String, // "pending", "accepted", "expired"
  expiresAt: Date, // Expiration date for the invitation
  createdAt: Date
}

// Donation Schema
const DonationSchema = {
  _id: ObjectId, // MongoDB auto-generated ID
  amount: Number, // Donation amount (typically $25)
  photoId: ObjectId, // Reference to the photo being unlocked (null if signup donation)
  donorEmail: String, // Email of the donor (may not be a registered user)
  modelId: ObjectId, // Reference to the model receiving the donation
  stripePaymentId: String, // Stripe payment ID for reference
  stripeSessionId: String, // Stripe session ID
  status: String, // "pending", "completed", "failed"
  type: String, // "photo_unlock" or "model_signup"
  createdAt: Date
}

// UnlockedPhoto Schema (tracks which photos are unlocked for which donors)
const UnlockedPhotoSchema = {
  _id: ObjectId, // MongoDB auto-generated ID
  photoId: ObjectId, // Reference to the unlocked photo
  donorEmail: String, // Email of the donor who unlocked the photo
  donationId: ObjectId, // Reference to the donation that unlocked the photo
  expiresAt: Date, // Optional expiration date (if access is temporary)
  createdAt: Date
}

// Relationships:
// - User has many Photos (one-to-many)
// - User has many Invitations sent (one-to-many)
// - User has one Invitation received (one-to-one)
// - Photo belongs to one User (many-to-one)
// - Photo has many Donations (one-to-many)
// - Photo has many UnlockedPhotos (one-to-many)
// - Donation belongs to one Photo (many-to-one)
// - Donation belongs to one User/Model (many-to-one)
// - UnlockedPhoto belongs to one Photo (many-to-one)
// - UnlockedPhoto belongs to one Donation (one-to-one)
