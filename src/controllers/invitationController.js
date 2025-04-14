const Invitation = require('../models/Invitation');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Send invitation
const sendInvitation = async (req, res, next) => {
  try {
    const { email } = req.body;
    const {id} = req.params;
    const user = req.user;
    
    if(user.role !== 'model' || user.role !== 'admin' || user.role !== 'superadmin'){
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send invitations'
      });
    }
    if(user._id.toString() !== id){
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send invitations'
      });
    }
    

    // Check if user is allowed to send invitations
    if (user.role === 'model' && user.invitationsSent >= 3) {
      return res.status(400).json({ message: 'Maximum number of invitations (3) already sent' });
    }
    
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }
    
    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({ 
      email, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }
    
    // Create invitation
    const invitation = new Invitation({
      sender: user._id,
      email
    });
    await invitation.save();
       
    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: invitation
    });
  } catch (error) {
    next(error);
  }
};

// Get user's sent invitations
const getInvitations = async (req, res, next) => {
  try {
    const {id} = req.params;
    const user = req.user;
    
    if(user.role !== 'model' || user.role !== 'admin' || user.role !== 'superadmin'){
      return res.status(403).json({
        success: false,
        message: 'Not authorized to get invitations'
      });
    }
    if(user._id.toString() !== id){
      return res.status(403).json({
        success: false,
        message: 'Not authorized to get invitations'
      });
    }    
    const invitations = await Invitation.find({ sender: user._id })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: invitations.length,
      invitations: invitations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify invitation token
// @route   GET /api/invitation/verify_invitation?token=token&email=email
// @access  Public
const verifyInvitation = async (req, res, next) => {
  try {
    let { token } = req.query;
    //TDX-233 TDX233
    if(!token.includes('-') && token.length === 6){
      token = token.slice(0, 3) + '-' + token.slice(3);
    }
    const invitation = await Invitation.findOne({ 
      token, 
      expiresAt: { $gt: new Date() }
    });
    if (!invitation) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }
    if(invitation.status === 'accepted'){
      return res.status(400).json({ message: 'Invitation already accepted' });
    }
    if(invitation.status === 'expired'){
      return res.status(400).json({ message: 'Invitation expired' });
    }

    res.status(200).json({ 
      success: true,
      message: 'Valid invitation',
      invitation: invitation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendInvitation,
  getInvitations,
  verifyInvitation
};