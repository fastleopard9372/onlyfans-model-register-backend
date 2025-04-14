const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const modelRoutes = require('./modelRoutes');
const visitorRoutes = require('./visitorRoutes');
const invitationRoutes = require('./invitationRoutes');
const donationRoutes = require('./donationRoutes');
const adminRoutes = require('./adminRoutes');
const photoRoutes = require('./photoRoutes');
const chatRoutes = require('./chatRoutes');

router.use('/auth', authRoutes);
router.use('/models', modelRoutes);
router.use('/visitors', visitorRoutes);
router.use('/invitations', invitationRoutes);
router.use('/donations', donationRoutes);
router.use('/photos', photoRoutes);
router.use('/admin', adminRoutes);
router.use('/chat', chatRoutes);

module.exports = router;

