const Photo = require('../models/Photo');
const Donation = require('../models/Donation');
const fs = require('fs').promises;
const path = require('path');
// upload locked photo
// @route   POST /api/locked-photo/:photoId/models/:id
// @access  Private
const uploadLockedPhoto = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      // Only allow users to update their own profile
      if (user._id.toString() !== id && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this profile'
        });
      }
      
      if (!req.processedImage) {
        return res.status(400).json({
          success: false,
          message: 'Image processing failed'
        });
      }
      const amount = 25;      //req.body.donationAmount;
      const photo = new Photo({
        model: id,
        title: req.body.title,
        description: req.body.description,
        originalUrl: req.processedImage.path,
        blurredUrl: req.processedImage.blurredPath,
        donationAmount: amount
      });
      await photo.save();
      res.status(200).json({
        success: true,
        message: 'Photo uploaded successfully',
        photo
      });
    } catch (error) {
        next(error);
      }
};

// update locked photo
// @route   PUT /api/locked-photo/:photoId/models/:id
// @access  Private
const updateLockedPhoto = async (req, res, next) => {
  try {
    const { id, photoId } = req.params;
    const user = req.user;
    
    // Only allow users to update their own profile
    if (user._id.toString() !== id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }
    
    if (!req.processedImage) {
      return res.status(400).json({
        success: false,
        message: 'Image processing failed',
      });
    }
    const amount = 25;      //req.body.donationAmount;
    const photo = await Photo.findById(photoId);
    if(photo.model.toString() !== id){
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    if(photo.originalUrl){
      try {
        await fs.unlink(path.join(__dirname, '../..', photo.originalUrl));
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    if(photo.blurredUrl){
      try {
        await fs.unlink(path.join(__dirname, '../..', photo.blurredUrl));
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    photo.title = req.body.title;
    photo.description = req.body.description;
    photo.originalUrl = req.processedImage.path;
    photo.blurredUrl = req.processedImage.blurredPath;
    photo.donationAmount = amount;
    await photo.save();

    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      photo
    });
  } catch (error) {
      next(error);
    }
};

// get locked photos
// @route   GET /api/locked-photos/models/:id
// @access  Private
const lockedPhotos = async (req, res, next) => {
  try { 
    const { id } = req.params;
    const user = req.user;

    if(user.role !== 'admin' && user._id.toString() !== id){
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    const photos = await Photo.find({ model: id }); 
    res.status(200).json({
      success: true,
      message: '',
      photos
    });
  } catch (error) {
    next(error);
  }
};

// get locked photo
// @route   GET /api/locked-photo/:photoId/models/:id
// @access  Private
const lockedPhoto = async (req, res, next) => {
  try {
    const { id, photoId } = req.params;
    const user = req.user;
    
    if(user.role !== 'admin' && user._id.toString() !== id){
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    const photo = await Photo.findById(photoId);  
    if(photo.model.toString() !== id){
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    res.status(200).json({
      success: true,
      message: '',
      photo
    }); 
  } catch (error) {
    next(error);
  }
}

// delete locked photo
// @route   DELETE /api/locked-photo/:photoId/models/:id
// @access  Private
const deleteLockedPhoto = async (req, res, next) => {
  try {
    const { id, photoId } = req.params;
    const user = req.user;
    
    // Only allow users to update their own profile 
    if (user._id.toString() !== id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    } 

    const photo = await Photo.findById(photoId);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    } 

    if(photo.model.toString() !== id){
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    if(photo.originalUrl){
      try {
        await fs.unlink(path.join(__dirname, '../..', photo.originalUrl));
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    if(photo.blurredUrl){
      try {
        await fs.unlink(path.join(__dirname, '../..', photo.blurredUrl));
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    await photo.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};


// get unlocked photo
// @route   GET /api/locked-photo/:photoId/visitor/:email/unlocked
// @access  public
const unlockedPhoto = async (req, res, next) => {
  try {
    const { photoId, email } = req.params;
    const donation = await Donation.findOne({ photo: photoId, donorEmail: email });
    if(!donation){
      return res.status(404).json({ success: false, message: 'You have not donated to this photo' });
    }
    if(donation.status !== 'successed'){
      return res.status(400).json({ success: false, message: 'This photo is not unlocked' });
    }
    const photo = await Photo.findById(photoId);
    
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }
    
    // Check if the email is already in the unlockedBy array
    if (photo.unlockedBy.includes(email)) {
      return res.status(200).json({
        success: true,
        message: 'Photo already unlocked',
        photo
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadLockedPhoto,
  updateLockedPhoto,
  deleteLockedPhoto,
  lockedPhotos,
  lockedPhoto,
  unlockedPhoto
};