const { upload, getSignedUrl } = require('../utils/s3Upload');
const User = require('../models/User');
const Photo = require('../models/Photo');

// @desc    Upload a file to S3
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
      // Get the transforms from multer-s3-transform
      const original = req.file.transforms.find(t => t.id === 'original');
      const blurred = req.file.transforms.find(t => t.id === 'blurred');

      if (!original || !blurred) {
        return res.status(500).json({
          success: false,
          message: 'Error processing image transforms'
        });
      }

      // Generate signed URLs for the uploaded files
      const originalUrl = getSignedUrl(original.key);
      const blurredUrl = getSignedUrl(blurred.key);

      // Return the file information
      res.status(200).json({
        success: true,
        file: {
          originalKey: original.key,
          originalUrl,
          blurredKey: blurred.key,
          blurredUrl
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
      // Get the original transform
      const original = req.file.transforms.find(t => t.id === 'original');

      if (!original) {
        return res.status(500).json({
          success: false,
          message: 'Error processing image transform'
        });
      }

      // Generate signed URL for the uploaded file
      const url = getSignedUrl(original.key);

      // Update user profile photo
      await User.findByIdAndUpdate(req.user.id, {
        profilePhoto: {
          url,
          key: original.key
        }
      });

      // Return the file information
      res.status(200).json({
        success: true,
        profilePhoto: {
          url,
          key: original.key
        }
      });
    } catch (error) {
      next(error);
    }
  });
};
