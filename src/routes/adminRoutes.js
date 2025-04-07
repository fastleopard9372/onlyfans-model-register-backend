const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllModels,
  getAllDonations,
  createInvitation,
  deleteModel,
  getModelPhotosById
} = require('../controllers/adminController');

// All routes are protected and require admin or superadmin role
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Model routes
router.get('/models', getAllModels);
router.get('/models/:id/photos', getModelPhotosById);
router.delete('/models/:id', deleteModel);

// Invitation routes
router.post('/invitations', createInvitation);

// Donation routes
router.get('/donations', getAllDonations);

module.exports = router;
