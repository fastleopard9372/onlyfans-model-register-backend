const visitorController = require('../controllers/visitorController');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.get('/:id/unlocked-photos', protect, visitorController.getUnlockedPhotos);
router.get('/:id/unlocked-photos/:photoId', protect, visitorController.getUnlockedPhoto);
module.exports = router;
