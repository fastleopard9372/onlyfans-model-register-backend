const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Donation = require('../models/Donation');
const Photo = require('../models/Photo');
const emailService = require('../services/emailService');
const fs = require('fs').promises;
const path = require('path');

// Get all models for admin
const getAllModels = async (req, res) => {
    try {
        if(req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
      const models = await User.find({ role: 'model' })
        .select('_id name username email profilePhoto invitedBy createdAt')
          .populate('invitedBy', 'name email username');
      
    
    return res.status(200).json({
      success: true,
      count: models.length,
      models: models
    });
  } catch (error) {
    next(error);
  }
};

// Get all donations for admin
const getAllDonations = async (req, res, next) => {
  try {
    if(req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const donations = await Donation.find()
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: donations.length,
      donations: donations
    });
  } catch (error) {
    next(error);
  }
};

const getModelPhotosById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const model = await User.findById(id);
    if(!model) {
      return res.status(404).json({success: false, message: 'Model not found' });
    }
    const photos = await Photo.find({ model: id }); 
    return res.status(200).json({
      success: true,
      count: photos.length,
      photos: photos
    });
  } catch (error) {
    next(error);
  }
};

// Admin creates invitation

const createInvitation = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = req.user;
    
    if(user.role !== 'admin' && user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({success: false, message: 'Email is already registered' });
    }
    
    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({ 
      email, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvitation) {
      return res.status(400).json({success: false, message: 'Invitation already sent to this email' });
    }
    
    // Create invitation
    const invitation = new Invitation({ 
      sender: user._id,
      email
    });
    await invitation.save();
    
    // Send invitation email
    // await emailService.sendAdminInvitationEmail(invitation);
    
    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation
    });
  } catch (error) {
    next(error);
  }
};

// Admin deletes model
const deleteModel = async (req, res, next) => {
  try {
    if(req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    
    const model = await User.findById(id);
    
    if (!model) {
      return res.status(404).json({success: false, message: 'Model not found' });
    }
    
    if (model.role !== 'model') {
      return res.status(400).json({success: false, message: 'User is not a model' });
    }
    
    const photos = await Photo.find({ model: id });
    if(photos.length > 0) {
        for (const photo of photos) {
            if (photo.path) {
                await fs.unlink(path.join(__dirname, '..', photo.path));
            }
            if (photo.blurredPath) {
                await fs.unlink(path.join(__dirname, '..', photo.blurredPath));
            }
        }
    }
    // Delete profile photo from filesystem if exists
    if (model.profilePhoto) {
      try {
        await fs.unlink(path.join(__dirname, '..', model.profilePhoto));
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    // Delete model
    await User.deleteOne({ _id: id });
    
      return res.status(200).json({
          success: true,
          message: 'Model deleted successfully'
      });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllModels,
  getAllDonations,
  createInvitation,
  deleteModel,
  getModelPhotosById
};