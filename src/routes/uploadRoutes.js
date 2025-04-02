const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadFile, updateProfilePhoto } = require('../controllers/uploadController');

// Protected routes
router.post('/', protect, uploadFile);
router.post('/profile', protect, updateProfilePhoto);

module.exports = router;
