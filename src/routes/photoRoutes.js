const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { processLockedPhoto } = require('../middleware/imageProcessing');
const { uploadLockedMulter } = require('../config/multer');
const {
  uploadLockedPhoto,
  updateLockedPhoto,
  deleteLockedPhoto,
  lockedPhotos,
  lockedPhoto,
  unlockedPhoto
} = require('../controllers/photoController');

// Upload locked photo
router.post(
  '/locked-photo/models/:id',
  protect,
  authorize('model', 'admin', 'superadmin'),
  uploadLockedMulter,
  processLockedPhoto,
  uploadLockedPhoto
);

// Update locked photo
router.put(
  '/locked-photo/:photoId/models/:id',
  protect,
  authorize('model', 'admin', 'superadmin'),
  uploadLockedMulter,
  processLockedPhoto,
  updateLockedPhoto
);

// Get locked photos
router.get(
  '/locked-photo/models/:id',
  protect,
  authorize('model', 'admin', 'superadmin'),
  lockedPhotos
);

// Get locked photo
router.get(
  '/locked-photo/:photoId/models/:id',
  protect,
  authorize('model', 'admin', 'superadmin'),
  lockedPhoto
);

// Get unlocked photo
router.get(
  '/unlocked-photo/:photoId/visitor/:email',
  unlockedPhoto
);

// Delete locked photo
router.delete(
  '/locked-photo/:photoId/models/:id',
  protect,
  authorize('model', 'admin', 'superadmin'),
  deleteLockedPhoto
);


module.exports = router;
