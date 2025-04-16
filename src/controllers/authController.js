const User = require('../models/User');
const Invitation = require('../models/Invitation');
const generateToken = require('../utils/generateToken');
const emailService = require('../services/emailService');
// @desc    Register a new model
// @route   POST /api/auth/register
// @access  Public (with invitation code)
const register = async (req, res, next) => {
  try {
    const { name, username, email, token, role} = req.body;
    
    if(name.length < 3){
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 3 characters long'
      });
    }
    if (role === 'model') {
      // Validate invitation token
      const invitation = await Invitation.findOne({
        token,
        email,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });
    
      if (!invitation) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired invitation code'
        });
      }
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ email, role: role });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    if(role === 'model'){
      const existingUsername = await User.findOne({ username, role: role });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already registered'
        });
      }
      // Update invitation status
      invitation.status = 'accepted';
      await invitation.save();
    }

    // Create new user
    const user = await User.create({
      ...req.body,
      role: role,
      invitedBy: role === 'model' ? invitation.sender : null  
    });

    if (user.role === 'model') { 
      await emailService.sendRegistrationSuccessEmail(user);
    } else if (user.role === "visitor") {
      await emailService.sendVisitorRegistrationSuccessEmail({ ...user, password: req.body.password });
    }
    
    const jwtToken = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token : jwtToken,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Register a new model
// @route   POST /api/auth/admin-register
// @access  Public (with invitation code)
const admin_register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ role: 'admin', email , username });
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
      username,
      password,
      role:'admin'
    });
    const jwtToken = generateToken(user._id);
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      },
      token: jwtToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
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
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    next(error);
  }
};

const newGenerateModelId =async(req,res,next)=>{
  try {
      const modelIds = await User.find({role:'model'},'_id');
      let modelId = Math.floor(1000 + Math.random() * 9000).toString();
      const modelIdsArray = modelIds.map(model => model._id);
      while(modelIdsArray.includes(modelId)){
        modelId = Math.floor(1000 + Math.random() * 9000).toString();
      }
      res.status(200).json({
        success:true,
        modelId:modelId
      })
  } catch (error) {
    next(error);
  }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logout successful' });
};


module.exports = {
  register,
  admin_register,
  login,
  logout,
  newGenerateModelId
};
