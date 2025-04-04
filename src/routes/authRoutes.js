const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  register,
  admin_register,
  login,
  getMe,
  getInvitations,
  generateInvitation,
  checkInvitation,
  updatePassword,
  updateProfile
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin_register', admin_register);
router.get('/check_invitation/:email/:code', checkInvitation);

// Protected routes
router.get('/me', protect, getMe);
router.get('/invitations/', protect, getInvitations);
router.post('/invite', protect, generateInvitation);
router.put('/update_password', protect, updatePassword);
router.put('/update_profile', protect, updateProfile);

module.exports = router;
