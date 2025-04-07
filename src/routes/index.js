const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const modelRoutes = require('./modelRoutes');
const invitationRoutes = require('./invitationRoutes');
const donationRoutes = require('./donationRoutes');
const adminRoutes = require('./adminRoutes');
const photoRoutes = require('./photoRoutes');
router.use('/auth', authRoutes);
router.use('/models', modelRoutes);
router.use('/invitations', invitationRoutes);
router.use('/donations', donationRoutes);
router.use('/photos', photoRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

