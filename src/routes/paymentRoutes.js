const express = require('express');
const router = express.Router();
const {
  createPhotoPayment,
  createPhotoPaymentIntent,
  createPhotoPaymentComplete,
  createSignupPaymentIntent,
  createSignupPaymentComplete,
  handleWebhook,
  verifyPayment,
  checkPhotoPayment
} = require('../controllers/paymentController');

// Public routes
router.post('/create_signup_payment_intent', createSignupPaymentIntent);
router.post('/create_photo_payment_intent', createPhotoPaymentIntent);
router.post('/create_signup_payment_complete', createSignupPaymentComplete);
router.post('/create_photo_payment_complete', createPhotoPaymentComplete);
router.post('/photo/check_payment', checkPhotoPayment);
// router.post('/photo/:photoId', createPhotoPayment);
// router.post('/signup', createSignupPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/verify/:sessionId', verifyPayment);


module.exports = router;
