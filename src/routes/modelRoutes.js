const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { processProfilePhoto } = require('../middleware/imageProcessing');
const { uploadProfileMulter} = require("../config/multer");

const {
  getModels,
  getModelById,
  updateModel,
  updateProfilePhoto,
  deleteProfilePhoto,
  updatePassword
} = require('../controllers/modelController');

router.get('/', getModels);
router.get('/:id', getModelById);
router.put('/:id', protect, authorize('model', 'admin', 'superadmin'), updateModel);
router.post('/:id/update-password', protect, updatePassword);
router.delete('/:id/profile-photo', protect, deleteProfilePhoto);
router.post('/:id/profile-photo',
    protect, authorize('model', 'admin', 'superadmin'),
    uploadProfileMulter,
    processProfilePhoto,
    updateProfilePhoto);

module.exports = router;