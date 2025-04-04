const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Donation = require('../models/Donation');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const generateInvitationKey = ({ code, email }) => {
  // Generate a JWT token containing the invitation code and email
  return jwt.sign(
    { code, email },
    process.env.JWT_SECRET,
    { expiresIn: '0' }
  );
}

const getInvitationKey = (invitation_code) => {
  return jwt.verify(invitation_code, process.env.JWT_SECRET);
}

// @desc    Register a new model
// @route   POST /api/auth/register
// @access  Public (with invitation code)
exports.register = async (req, res, next) => {
  try {
    const { username, email, invitationCode, donationId } = req.body;
    
    if (donationId == "-1") {
      return res.status(400).json({
        success: false,
        message: "Donation ID is not valid"
      });
    }
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
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already registered'
      });
    }

    // Create new user
    const user = await User.create({ ...req.body,
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
        username: user.username,
        role: user.role,
        bio: user.bio,
        quote: user.quote,
        websiteUrl: user.websiteUrl,
        donationId: user.donationId,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Register a new model
// @route   POST /api/auth/admin_register
// @access  Public (with invitation code)
exports.admin_register = async (req, res, next) => {
  try {
    const { name, email, password, siteAddress} = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ role: 'admin', email  });
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
      role:'admin'
    });

    res.status(201).json({
      success: true,
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
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        bio: user.bio,
        quote: user.quote,
        websiteUrl: user.websiteUrl,
        profilePhoto: user.profilePhoto,
        donationId: user.donationId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/update_password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { password, confirm_password } = req.body;
    const user = await User.findById(req.user.id);
    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    user.password = password;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/update_profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try { 
    const user = await User.findById(req.user.id);
    user.name = req.body.name;
    // user.email = req.body.email;
    user.websiteUrl = req.body.websiteUrl;
    user.bio = req.body.bio;
    user.quote = req.body.quote;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        websiteUrl: user.websiteUrl,
        role: user.role,
        bio: user.bio,
        quote: user.quote,
        profilePhoto: user.profilePhoto,
        donationId: user.donationId
      }
    });
  } catch (error) {
    next(error);
  }
}
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
    const id = req.user.id;
    // Check if id exists and is valid
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }
  

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    //if email is my email check
    if (email === req.user.email) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send an invitation to yourself'
      });
    }

    // Check if user has already sent 3 invitations
    if (req.user.role != "admin") { 
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
      senderId: id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Update user's invitationsSent array
    await User.findByIdAndUpdate(id, {
      $push: { invitationsSent: invitation._id }
    });

    res.status(201).json({
      success: true,
      invitation: invitation,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invitations
// @route   Post /api/auth/invitations/:id
// @access  Private
exports.getInvitations = async (req, res, next) => {
  try {
    const invitations = await Invitation.find({ senderId: req.user.id });
    res.status(200).json({
      success: true,
      invitations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check invitation code validity and email match
// @route   GET /api/auth/check_invitation
// @access  Public
exports.checkInvitation = async (req, res, next) => {
  try {

    const { code, email } = req.params
    // const invitation_code = req.query.code;
    // if (!invitation_code || typeof invitation_code !== 'string') {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid Invitation Code format'
    //   });
    // }
    // const {code, email} = getInvitationKey(invitation_code)

    // Find invitation by code and email
    const invitation = await Invitation.findOne({
      code,
      email,
    });
    
    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation code, or email does not match'
      });
    }
    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been used'
      });
    }

    // Check if invitation has expired
    if (invitation.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'This invitation has expired'
      });
    }

    const donation = await Donation.findOne({
      donorEmail: email,
      status: 'succeeded',
      donorType: 'model'
    });
    let donationId = -1
    if (donation) { 
      donationId= donation._id
    }

    res.status(200).json({
      success: true,
      invitation,
      donationId
    });
  } catch (error) {
    next(error);
  }
};

