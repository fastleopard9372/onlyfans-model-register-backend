const express = require('express');
const router = express.Router();
const {
  createPhotoPayment,
  createPaymentIntent,
  createPaymentComplete,
  createSignupPayment,
  handleWebhook,
  verifyPayment
} = require('../controllers/paymentController');

// Public routes
router.post('/create_payment_intent', createPaymentIntent);
router.post('/create_payment_complete', createPaymentComplete);
router.post('/photo/:photoId', createPhotoPayment);
router.post('/signup', createSignupPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/verify/:sessionId', verifyPayment);


module.exports = router;
