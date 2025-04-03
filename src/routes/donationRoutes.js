const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDonations,
  getDonation,
  createDonation,
  updateDonation,
  deleteDonation,
  getMyDonations,
  getDonationsToMe
} = require('../controllers/donationController');

router.use(protect);

// Get all donations made by current user
router.get('/my-donations', getMyDonations);

// Get all donations received by current user (for models)
router.get('/received', getDonationsToMe);

// Admin routes
router.use(protect);

router.route('/')
  .get(getDonations)
  .post(createDonation);

router.route('/:id')
  .get(getDonation)
  .put(updateDonation)
  .delete(deleteDonation);

module.exports = router; 