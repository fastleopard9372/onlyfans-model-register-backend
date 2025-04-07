const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateProfile
} = require('../controllers/1userController');


router.route('/:id')
  .get(getUser)
  
router.use(protect);

// Get current user profile
router.get('/me', getCurrentUser);

// Update current user profile
router.put('/me', updateProfile);

// Admin routes
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router; 