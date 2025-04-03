const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Photo = require('../models/Photo');

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, '../../uploads');
const photosDir = path.join(uploadDir, 'photos');
const blurredDir = path.join(uploadDir, 'blurred');

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
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
exports.updateProfilePhoto = (req, res, next) => {
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
