const express = require('express');
const router = express.Router();
const {
  createPhotoPayment,
  createSignupPayment,
  handleWebhook,
  verifyPayment
} = require('../controllers/paymentController');

// Public routes
router.post('/photo/:photoId', createPhotoPayment);
router.post('/signup', createSignupPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/verify/:sessionId', verifyPayment);

module.exports = router;
