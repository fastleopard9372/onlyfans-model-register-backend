const Donation = require('../models/Donation');

// @desc    Get all donations
// @route   GET /api/donations
// @access  Private/Admin
exports.getDonations = (async (req, res, next) => {
  const donations = await Donation.find();
  res.status(200).json({
    success: true,
    count: donations.length,
    data: donations
  });
});

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Private/Admin
exports.getDonation = (async (req, res, next) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    return next(`Donation not found with id of ${req.params.id}`, 404);
  }
  res.status(200).json({
    success: true,
    data: donation
  });
});

// @desc    Create donation
// @route   POST /api/donations
// @access  Private
exports.createDonation = (async (req, res, next) => {
  // Add user to req.body
  req.body.donorEmail = req.user.email;
  
  const donation = await Donation.create(req.body);
  res.status(201).json({
    success: true,
    data: donation
  });
});

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private/Admin
exports.updateDonation = (async (req, res, next) => {
  const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!donation) {
    return next(`Donation not found with id of ${req.params.id}`, 404);
  }
  res.status(200).json({
    success: true,
    data: donation
  });
});

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private/Admin
exports.deleteDonation = (async (req, res, next) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    return next(`Donation not found with id of ${req.params.id}`, 404);
  }
  await donation.remove();
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get donations made by current user
// @route   GET /api/donations/my-donations
// @access  Private
exports.getMyDonations = (async (req, res, next) => {
  const donations = await Donation.find({ donorEmail: req.user.email });
  res.status(200).json({
    success: true,
    count: donations.length,
    data: donations
  });
});

// @desc    Get donations received by current user (for models)
// @route   GET /api/donations/received
// @access  Private
exports.getDonationsToMe = (async (req, res, next) => {
  const donations = await Donation.find({ modelId: req.user.id });
  res.status(200).json({
    success: true,
    count: donations.length,
    data: donations
  });
}); 