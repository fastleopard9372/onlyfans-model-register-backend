const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    uploadFile,
    updateProfilePicture,
    updateLockedPicture,
    getPicture,
    getLockedPicture,
    deleteLockedPicture,
    deletePicture
} = require('../controllers/uploadController');

// Protected routes
router.post('/', protect, uploadFile);
router.post('/profile', protect, updateProfilePicture);
router.post('/locked', protect, updateLockedPicture);
router.get('/locked', protect, getLockedPicture);
router.delete('/locked', protect, deleteLockedPicture);
router.get('/uploads/:photos/:file', getPicture);
router.delete('/uploads/:photos/:file', protect, deletePicture);
module.exports = router;
