const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Photo = require('../models/Photo');

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, '../../uploads');
const photosDir = path.join(uploadDir, 'photos');
const blurredDir = path.join(uploadDir, 'blurred'); 
const profileDir = path.join(uploadDir, 'profile');
const lockedDir = path.join(uploadDir, 'locked');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir);
}
if (!fs.existsSync(blurredDir)) {
  fs.mkdirSync(blurredDir);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, photosDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    // Accept all image types
    const mimeType = file.mimetype.split('/')[0];
    if (mimeType !== 'image') {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// @desc    Upload a file
// @route   POST /api/upload
// @access  Private
exports.uploadFile = (req, res, next) => {
  // Use the upload middleware
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    try {
      // Return the file information
      res.status(200).json({
        success: true,
        file: {
          filename: req.file.filename,
          fileUrl: `/uploads/photos/${req.file.filename}`
        }
      });
    } catch (error) {
      next(error);
    }
  });
};

// @desc    Update user profile photo
// @route   POST /api/upload/profile
// @access  Private
exports.updateProfilePicture = (req, res, next) => {
  
  // Use the upload middleware
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    try {
      // Update user profile photo
      await User.findByIdAndUpdate(req.user.id, {
        profilePhoto: {
          url: `/uploads/photos/${req.file.filename}`,
          filename: req.file.filename
        }
      });

      // Return the file information
      res.status(200).json({
        success: true,
        profilePhoto: {
          url: `/uploads/photos/${req.file.filename}`,
          filename: req.file.filename
        }
      });
    } catch (error) {
      next(error);
    }
  });
};

exports.getPicture = (req, res, next) => {
  try { 
    const { photos, file } = req.params;
    const filePath = path.join(__dirname, '..', '..', 'uploads', photos, file);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

exports.deletePicture = async (req, res, next) => {
  try {
    const {photos, file} = req.params;
    const filePath = path.join(__dirname, '..', '..', 'uploads',photos, file);
    fs.unlinkSync(filePath);
    await User.findByIdAndUpdate(req.user.id, {
      profilePhoto: null
    });
    res.status(200).json({
      success: true,
      message: 'Picture deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}


exports.updateLockedPicture = (req, res, next) => {
  // Use the upload middleware
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    try {
      // Update user locked photo
      await User.findByIdAndUpdate(req.user.id, {
        lockedPhoto: {
          url: `/uploads/photos/${req.file.filename}`,
          filename: req.file.filename
        }
      });

      // Return the file information
      res.status(200).json({
        success: true,
        lockedPhoto: {
          url: `/uploads/photos/${req.file.filename}`,
          filename: req.file.filename
        }
      });
    } catch (error) {
      next(error);
    }
  });
};

exports.getLockedPicture = async (req, res, next) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);
    if(!user.lockedPhoto){
      return res.status(400).json({
        success: false,
        message: 'No locked photo found'
      });
    }
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'photos', user.lockedPhoto.filename);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

exports.deleteLockedPicture = async (req, res, next) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);
    if(!user.lockedPhoto){
      return res.status(400).json({
        success: false,
        message: 'No locked photo found'
      });
    }
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'photos', user.lockedPhoto.filename);
    fs.unlinkSync(filePath);
    await User.findByIdAndUpdate(id, {
      lockedPhoto: null
    });
    res.status(200).json({
      success: true,
      message: 'Locked photo deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProfilePicture = async (req, res, next) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);
    if(!user.profilePhoto){
      return res.status(400).json({
        success: false,
        message: 'No profile photo found'
      });
    }
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'photos', user.profilePhoto.filename);
    fs.unlinkSync(filePath);
    await User.findByIdAndUpdate(id, {
      profilePhoto: null
    });
    res.status(200).json({
      success: true,
      message: 'Profile photo deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

