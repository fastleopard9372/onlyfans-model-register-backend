const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  checkDonationStatus,
  handlePaymentWebhook,
  createPaymentComplete
} = require('../controllers/donationController');

router.post('/create-payment-intent', createPaymentIntent);
router.get('/check-status/:email/:photoId', checkDonationStatus);
// router.post('/webhook', handlePaymentWebhook);
router.post('/payment-complete', createPaymentComplete);

module.exports = router;
