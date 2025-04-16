const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  addModel,
  getAllModels,
  getAllDonations,
  deleteModel,
  getModelPhotosById,
  addVisitor,
  deleteVisitor,
  getAllVisitors,
  createInvitation,
  getAllInvitations,
  deleteInvitation,
  getStatistics
} = require('../controllers/adminController');

// All routes are protected and require admin
router.use(protect);
router.use(authorize('admin'));

router.post('/models', addModel);
router.get('/models', getAllModels);
router.get('/models/:id/photos', getModelPhotosById);
router.delete('/models/:id', deleteModel);

router.get('/visitors', getAllVisitors);
router.post('/visitors', addVisitor);
router.delete('/visitors/:id', deleteVisitor);

router.post('/invitations', createInvitation);
router.get('/invitations', getAllInvitations);
router.delete('/invitations/:id', deleteInvitation);

router.get('/donations', getAllDonations);

router.get('/statistics', getStatistics);

module.exports = router;
