const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  register,
  admin_register,
  login,
  getMe,
  generateInvitation,
  checkInvitation
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin_register', admin_register);

// Protected routes
router.get('/me', protect, getMe);
router.post('/invite', protect, generateInvitation);
router.get('/check_invitation/:email/:code', checkInvitation);
module.exports = router;
