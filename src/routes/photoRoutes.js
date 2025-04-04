const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  uploadPhoto,
  getPhotos,
  getPhoto,
  updatePhoto,
  deletePhoto,
  getUserPhotos,
  getMyPhotos,
  getPhotoBlob
} = require('../controllers/photoController');

// Public routes
router.get('/', getPhotos);
router.get('/:id', getPhoto);
router.get('/blob/uploads/:photos/:file', getPhotoBlob);
router.get('/user/:userId', getUserPhotos);

// Protected routes
router.post('/', protect, uploadPhoto);
router.put('/:id', protect, updatePhoto);
router.delete('/:id', protect, deletePhoto);
router.get('/my/photos', protect, getMyPhotos);

module.exports = router;
