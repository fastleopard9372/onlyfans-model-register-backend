const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    uploadFile,
    updatePicture,
    getPicture,
    deletePicture
} = require('../controllers/uploadController');

// Protected routes
router.post('/', protect, uploadFile);
router.post('/profile', protect, updatePicture);
router.get('/uploads/:photos/:file', protect, getPicture);
router.delete('/uploads/:photos/:file', protect, deletePicture);
// router.post('/locked', protect, updateLockedPhoto);
module.exports = router;
