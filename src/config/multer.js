const multer = require('multer');

// Configure multer storage for in-memory storage
// (we'll process the images before saving to disk)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 5MB max file size
  },
});

module.exports = {
  uploadProfileMulter: upload.single('image'),
  uploadLockedMulter: upload.single('image'),
};
