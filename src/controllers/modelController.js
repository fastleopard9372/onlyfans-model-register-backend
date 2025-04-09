const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Photo = require('../models/Photo');

// Get all models with pagination and search
// @route   GET /api/models
// @access  Public
const getModels = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const search = req.query.q || '';
    
    const searchQuery = search 
      ? { 
          name: { $regex: search, $options: 'i' },
          role: 'model',
          profilePhoto: { $ne: null }
        }
      : {
          role: 'model',
          profilePhoto: { $ne: null }
        };
    
    const skip = (page - 1) * limit;
    
    const models = await User.find(searchQuery)
      .select('_id name profilePhoto')
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(searchQuery);
    
    res.status(200).json({
      success: true,
      message: '',
      models,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
      totalModels: total
    });
  } catch (error) {
    next(error);
  }
};

// Get model details
// @route   GET /api/models/:id
// @access  Public
const getModelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Find the model by ID
    const model = await User.findOne({ _id: id, role: 'model' });
    
    // Get model's photos with aggregation
    const photos = await Photo.aggregate([
      { $match: { model: new mongoose.Types.ObjectId(id), isActive: true } },
      { 
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          blurredUrl: 1,
          originalUrl: 1,
          donationAmount: 1,
          createdAt: 1,
          unlockedCount: { $size: "$unlockedBy" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    
    // Add photos to model data
    if (model) {
      model.photos = photos || [];
    }
    
    if (!model) {
      return res.status(404).json({success: false, message: 'Model not found' });  
    }
    
    const response = {
        _id: model._id,
        name: model.name,
        username: model.username,
        email: model.email,
        bio: model.bio,
        quote: model.quote,
        siteAddress: model.siteAddress,
        profilePhoto: model.profilePhoto,
        lockedPhotos: model.photos,
        age: model.age,
        zodiac: model.zodiac,
        height: model.height,
        weight: model.weight,
        eyes: model.eyes,
        hair: model.hair,
        favoriteBook: model.favoriteBook,
        futureGoals: model.futureGoals
    };
    
      res.status(200).json({
        success: true,
        message: '',
        model: response
    });
  } catch (error) {
    next(error);
  }
};

// Update model profile 
// @route   PUT /api/models/:id
// @access  Private
const updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, quote, siteAddress, age, zodiac, height, weight, eyes, hair, favoriteBook, futureGoals } = req.body;
    const user = req.user;
        
    // Only allow users to update their own profile
    if (user._id.toString() !== id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    if(name.length <3){
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 3 characters long'
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, bio, quote, siteAddress, age, zodiac, height, weight, eyes, hair, favoriteBook, futureGoals },
      { new: true, runValidators: true }
    ).select('_id name bio quote siteAddress profilePhoto age zodiac height weight eyes hair favoriteBook futureGoals');
    if (!updatedUser) {
      return res.status(404).json({success: false, message: 'User not found' });
    }
    
    res.status(200).json({success: true, message: 'Profile updated successfully', model: updatedUser});
  } catch (error) {
    next(error);
  }
};

// Update profile photo
// @route   POST /api/models/:id/profile-photo
// @access  Private
const updateProfilePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Only allow users to update their own profile
    if (user._id.toString() !== id && user.role !== 'admin') {
      return res.status(403).json({success: false, message: 'Not authorized to update this profile' });
    }
    
    if(user.profilePhoto){
        try {
            await fs.unlink(path.join(__dirname, '../..', user.profilePhoto));
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    }
    
    if (!req.processedImage) {
      return res.status(400).json({success: false, message: 'Image processing failed' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { profilePhoto: req.processedImage.path },
      { new: true }
    ).select('_id profilePhoto');
    
    res.status(200).json({
      success: true,  
      message: 'Profile photo uploaded successfully',
      profilePhoto: updatedUser.profilePhoto
    });
  } catch (error) {
    next(error);
  }
};

// delete profile photo 
// @route   DELETE /api/models/:id/profile-photo
// @access  Private
const deleteProfilePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Only allow users to update their own profile
    if (user._id.toString() !== id && user.role !== 'admin') {
      return res.status(403).json({success: false, message: 'Not authorized to update this profile' });
    }
    
    const model = await User.findById(id);
    
    if (!model) {
      return res.status(404).json({success: false, message: 'Model not found' });
    }
    
    if(model.profilePhoto){
      try {
        await fs.unlink(path.join(__dirname, '../..', model.profilePhoto));
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
      
    model.profilePhoto = null;
    await model.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   POST /api/models/:id/update-password
// @access  Private
const updatePassword = async (req, res, next) => {
    try {
        const { password, confirm_password } = req.body;
        const { id } = req.params;
      if(req.user._id.toString() !== id){
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this profile'
        });
      }
      
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
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

module.exports = {
  getModels,
  getModelById,
  updateModel,
  updateProfilePhoto,
  deleteProfilePhoto,
  updatePassword
};