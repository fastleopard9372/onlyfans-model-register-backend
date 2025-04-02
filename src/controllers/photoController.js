const User = require('../models/User');
const Photo = require('../models/Photo');
const UnlockedPhoto = require('../models/UnlockedPhoto');
// const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const sharp = require('sharp');

// Configure AWS
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new aws.S3();

// Set up multer for file uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'private',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'photos/' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Helper function to create a blurred version of an image
const createBlurredImage = async (s3Key) => {
  try {
    // Get the original image from S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    };
    
    const data = await s3.getObject(params).promise();
    
    // Create a blurred version
    const blurredBuffer = await sharp(data.Body)
      .blur(15) // Adjust blur amount as needed
      .toBuffer();
    
    // Upload the blurred version to S3
    const blurredKey = 'blurred/' + path.basename(s3Key);
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: blurredKey,
      Body: blurredBuffer,
      ContentType: data.ContentType,
      ACL: 'private'
    };
    
    const uploadResult = await s3.upload(uploadParams).promise();
    
    return {
      key: blurredKey,
      url: uploadResult.Location
    };
  } catch (error) {
    console.error('Error creating blurred image:', error);
    throw error;
  }
};

// @desc    Upload a photo
// @route   POST /api/photos
// @access  Private
exports.uploadPhoto = async (req, res, next) => {
  try {
    // Multer middleware will handle the file upload
    upload.single('photo')(req, res, async function(err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a photo'
        });
      }
      
      try {
        // Create blurred version
        const blurred = await createBlurredImage(req.file.key);
        
        // Create photo record
        const photo = await Photo.create({
          userId: req.user.id,
          title: req.body.title || '',
          description: req.body.description || '',
          s3Key: req.file.key,
          s3Url: req.file.location,
          blurredS3Key: blurred.key,
          blurredS3Url: blurred.url,
          isLocked: req.body.isLocked !== 'false', // Default to true
          price: req.body.price || 25,
          isActive: req.body.isActive !== 'false' // Default to true
        });
        
        res.status(201).json({
          success: true,
          photo
        });
      } catch (error) {
        // If there's an error, delete the uploaded file
        await s3.deleteObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: req.file.key
        }).promise();
        
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all photos (public, active)
// @route   GET /api/photos
// @access  Public
exports.getPhotos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 16;
    const startIndex = (page - 1) * limit;
    
    const photos = await Photo.find({ isActive: true })
      .populate('userId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Photo.countDocuments({ isActive: true });
    
    // Check which photos are unlocked for the current user (if authenticated)
    let unlockedPhotoIds = [];
    if (req.user) {
      const unlockedPhotos = await UnlockedPhoto.find({ 
        donorEmail: req.user.email 
      });
      unlockedPhotoIds = unlockedPhotos.map(up => up.photoId.toString());
    }
    
    // Transform photos to include whether they're unlocked for this user
    const transformedPhotos = photos.map(photo => {
      const photoObj = photo.toObject();
      photoObj.isUnlocked = unlockedPhotoIds.includes(photo._id.toString());
      
      // If photo is locked and not unlocked for this user, return blurred URL
      if (photoObj.isLocked && !photoObj.isUnlocked) {
        photoObj.displayUrl = photoObj.blurredS3Url;
      } else {
        photoObj.displayUrl = photoObj.s3Url;
      }
      
      return photoObj;
    });
    
    res.status(200).json({
      success: true,
      count: photos.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      photos: transformedPhotos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single photo
// @route   GET /api/photos/:id
// @access  Public
exports.getPhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id)
      .populate('userId', 'name email siteAddress profilePhoto');
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }
    
    // Check if photo is unlocked for the current user
    let isUnlocked = false;
    if (req.user) {
      // If user is the owner, they can see it
      if (photo.userId._id.toString() === req.user.id) {
        isUnlocked = true;
      } else {
        // Check if user has unlocked this photo
        const unlockedPhoto = await UnlockedPhoto.findOne({
          photoId: photo._id,
          donorEmail: req.user.email
        });
        
        isUnlocked = !!unlockedPhoto;
      }
    }
    
    const photoObj = photo.toObject();
    photoObj.isUnlocked = isUnlocked;
    
    // If photo is locked and not unlocked for this user, return blurred URL
    if (photoObj.isLocked && !photoObj.isUnlocked) {
      photoObj.displayUrl = photoObj.blurredS3Url;
    } else {
      photoObj.displayUrl = photoObj.s3Url;
    }
    
    res.status(200).json({
      success: true,
      photo: photoObj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a photo
// @route   PUT /api/photos/:id
// @access  Private
exports.updatePhoto = async (req, res, next) => {
  try {
    let photo = await Photo.findById(req.params.id);
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }
    
    // Make sure user is the photo owner
    if (photo.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this photo'
      });
    }
    
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      isLocked: req.body.isLocked,
      price: req.body.price,
      isActive: req.body.isActive
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    photo = await Photo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      photo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a photo
// @route   DELETE /api/photos/:id
// @access  Private
exports.deletePhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id);
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }
    
    // Make sure user is the photo owner
    if (photo.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this photo'
      });
    }
    
    // Delete from S3
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: photo.s3Key
    }).promise();
    
    // Delete blurred version
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: photo.blurredS3Key
    }).promise();
    
    // Delete from database
    await photo.remove();
    
    // Delete related unlocked photos
    await UnlockedPhoto.deleteMany({ photoId: photo._id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's photos
// @route   GET /api/photos/user/:userId
// @access  Public
exports.getUserPhotos = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 16;
    const startIndex = (page - 1) * limit;
    
    const photos = await Photo.find({ 
      userId,
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Photo.countDocuments({ 
      userId,
      isActive: true 
    });
    
    // Check which photos are unlocked for the current user (if authenticated)
    let unlockedPhotoIds = [];
    if (req.user) {
      // If user is viewing their own photos, all are unlocked
      if (req.user.id === userId) {
        unlockedPhotoIds = photos.map(p => p._id.toString());
      } else {
        const unlockedPhotos = await UnlockedPhoto.find({ 
          donorEmail: req.user.email 
        });
        unlockedPhotoIds = unlockedPhotos.map(up => up.photoId.toString());
      }
    }
    
    // Transform photos to include whether they're unlocked for this user
    const transformedPhotos = photos.map(photo => {
      const photoObj = photo.toObject();
      photoObj.isUnlocked = unlockedPhotoIds.includes(photo._id.toString());
      
      // If photo is locked and not unlocked for this user, return blurred URL
      if (photoObj.isLocked && !photoObj.isUnlocked) {
        photoObj.displayUrl = photoObj.blurredS3Url;
      } else {
        photoObj.displayUrl = photoObj.s3Url;
      }
      
      return photoObj;
    });
    
    res.status(200).json({
      success: true,
      count: photos.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      photos: transformedPhotos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my photos (for logged in model)
// @route   GET /api/photos/my
// @access  Private
exports.getMyPhotos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 16;
    const startIndex = (page - 1) * limit;
    
    const photos = await Photo.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Photo.countDocuments({ userId: req.user.id });
    
    res.status(200).json({
      success: true,
      count: photos.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      photos
    });
  } catch (error) {
    next(error);
  }
};
