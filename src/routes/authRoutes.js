const express = require('express');
const router = express.Router();
const {
  newGenerateModelId,
  register,
  admin_register,
  logout,
  login } = require('../controllers/authController');

// Public routes

router.post('/register', register);
router.post('/admin-register', admin_register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/new-generate-model-id', newGenerateModelId);
// Protected routes can be added here
// Example: router.get('/profile', protect, userController.getProfile);

module.exports = router;
