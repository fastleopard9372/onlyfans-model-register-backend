const express = require('express');
const router = express.Router();
const {sendInvitation, getInvitations, verifyInvitation} = require('../controllers/invitationController');
const { protect, authorize } = require('../middleware/auth');   

router.get('/verify-invitation', verifyInvitation);
router.post('/:id', protect, authorize('model', 'admin', 'superadmin'), sendInvitation);
router.get('/:id', protect, authorize('model', 'admin', 'superadmin'), getInvitations);
module.exports = router;
