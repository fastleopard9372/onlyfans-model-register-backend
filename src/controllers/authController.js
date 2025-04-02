const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register a new model
// @route   POST /api/auth/register
// @access  Public (with invitation code)
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, siteAddress, invitationCode } = req.body;

    // Validate invitation code
    const invitation = await Invitation.findOne({ 
      code: invitationCode,
      email: email,
      status: 'pending',
      expiresAt: { $gt: Date.now() }
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation code'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      siteAddress,
      invitedBy: invitation.senderId
    });

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        siteAddress: user.siteAddress,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        siteAddress: user.siteAddress,
        profilePhoto: user.profilePhoto,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        siteAddress: user.siteAddress,
        profilePhoto: user.profilePhoto,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate invitation code
// @route   POST /api/auth/invite
// @access  Private
exports.generateInvitation = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    // Check if user has already sent 3 invitations
    const invitationCount = await Invitation.countDocuments({ 
      senderId: req.user.id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (invitationCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You have already sent the maximum number of invitations (3)'
      });
    }

    // Check if email already has a pending invitation
    const existingInvitation = await Invitation.findOne({
      email,
      status: 'pending',
      expiresAt: { $gt: Date.now() }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'This email already has a pending invitation'
      });
    }

    // Generate unique invitation code
    const code = crypto.randomBytes(10).toString('hex');

    // Create invitation
    const invitation = await Invitation.create({
      code,
      email,
      senderId: req.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Update user's invitationsSent array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { invitationsSent: invitation._id }
    });

    res.status(201).json({
      success: true,
      invitation: {
        id: invitation._id,
        code: invitation.code,
        email: invitation.email,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};
