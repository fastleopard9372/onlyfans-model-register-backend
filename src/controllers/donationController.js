const Donation = require('../models/Donation');
const Photo = require('../models/Photo');
const User = require('../models/User');
const stripe = require('../config/stripe');
const mongoose = require('mongoose');
const generateCode = require('../utils/generateCode');
const emailService = require('../services/emailService');

// create payment intent
// @route   POST /api/donations/create-payment-intent
// @access  public
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { photoId, amount, name, email, donorType } = req.body;
    
    let donation = await Donation.findOne({ donorEmail: email, photo: photoId, donorType: donorType });
    if (donation) {
      return res.status(400).json({
        success: false,
        type: "already_donated",
        message: 'You have already donated to this photo'
      });
    } else {
      const newDonation = new Donation({
        donorEmail: email,
        donorType: donorType,
        donorName: name,
        photo: photoId,
        amount: amount,
        status: 'pending'
      });
      await newDonation.save();
      donation = newDonation;
    }
    
    const photo = await Photo.findById(photoId);
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        type: "no_photo",
        message: 'Photo not found'
      });
    }
    // Check if user has already unlocked this photo
    if (photo.unlockedBy.includes(email)) {
      return res.status(400).json({
        success: false,
        type: "already_unlocked",
        message: 'Photo already unlocked'
      });
    }
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        photoId: photo._id.toString(),
        modelId: photo.model.toString(),
        donorEmail: email,
        donorType: donorType,
        donorName: name
      }
    });

    let user = await User.findOne({ email: email, role:"visitor" });
    if (!user) {
      let code = generateCode();
      const newUser = new User({
        email: email,
        name: name,
        username: code,
        password: code,
        role: "visitor"
      });
      await newUser.save()
      user = newUser
      try{
        if(user && user.role === "visitor"){
          await emailService.sendVisitorRegistrationSuccessEmail(user);
        }
      } catch (err) {
        console.log(err);
      }
    }
    // Drop the index
    try {
      const collection = mongoose.connection.collection('photos');
      await collection.dropIndex('unlockedBy_1');
    } catch (err) {
      console.log(err);
    }

    await Photo.findByIdAndUpdate(photoId, {
      $addToSet: { unlockedBy: email }
    }); 

    try {
      const model = await User.findById(photo.model);
      const data = {
        modelEmail: model.email,
        modelName: model.name,
        visitorName: user.name,
        visitorEmail: user.email,
      }
      await emailService.sendModelUnlockedPhotoEmail(data);
    } catch (err) {
      console.log(err);
    }
    
    return res.json({
      success: true,
      message: 'Payment intent created successfully',
      paymentIntent: paymentIntent.client_secret,
      donationId: donation._id,
      user: user
    });
  } catch (err) {
    next(err);
  }
};

//@desc check donation status
//@route GET /api/donations/check-status
//@access public
exports.checkDonationStatus = async (req, res, next) => {
  try {
    const { email, photoId } = req.params;
    const donation = await Donation.findOne({
      donorEmail: email,
      photo: photoId,
      status: 'succeeded'
    });
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    return res.status(200).json({
      message: 'Donation status checked successfully',
      success: true,
      donation: donation
    });
  } catch (err) {
    next(err);
  }
}

// @desc Webhook to handle successful payments
// @route   POST /api/donations/webhook
// @access  public
exports.handlePaymentWebhook = async (req, res, next) => {  
  const signature = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    try {
      const { photoId, donorEmail, donorType, donorName } = paymentIntent.metadata;
      
      // Create donation record
      const donation = new Donation({
        donorEmail: donorEmail,
        donorType: donorType,
        donorName: donorName,
        photo: photoId,
        amount: paymentIntent.amount / 100, // Convert from cents
        stripePaymentId: paymentIntent.id,
        status: 'successed'
      });
      await donation.save();
      
      // Update photo to mark as unlocked for this user
      await Photo.findByIdAndUpdate(photoId, {
        $addToSet: { unlockedBy: donorEmail }
      });
      
      console.log(`Payment for photo ${photoId} successful`);
    } catch (err) {
      console.error('Error processing payment:', err);
      next(err);
    }
  }
  return res.status(200).json({
    success: true,
    message: 'Payment successful'
  });
};

// @desc    Create payment complete
// @route   POST /api/donations/payment-complete
exports.createPaymentComplete  = async (req, res, next) => {
  try {
    const { donationId, paymentIntent } = req.body;
    const donation = await Donation.findById(donationId);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    if(donation.status === 'successed'){
      return res.status(400).json({
        success: false,
        message: 'Donation already completed'
      });
    }
    donation.stripePaymentId = paymentIntent.id;
    donation.status = paymentIntent.status;

    await donation.save();

    const user = await User.findOne({ email: donation.donorEmail });
    if(!user){
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'Payment complete',
      donation: donation,
      user: user
    });
  } catch (error) {
    next(error);
  }
}

// // @desc    Get all donations
// // @route   GET /api/donations
// // @access  Private/Admin
// exports.getDonations = (async (req, res, next) => {
//   const donations = await Donation.find();
//   res.status(200).json({
//     success: true,
//     count: donations.length,
//     data: donations
//   });
// });

// // @desc    Get single donation
// // @route   GET /api/donations/:id
// // @access  Private/Admin
// exports.getDonation = (async (req, res, next) => {
//   const donation = await Donation.findById(req.params.id);
//   if (!donation) {
//     return next(`Donation not found with id of ${req.params.id}`, 404);
//   }
//   res.status(200).json({
//     success: true,
//     data: donation
//   });
// });

// // @desc    Create donation
// // @route   POST /api/donations
// // @access  Private
// exports.createDonation = (async (req, res, next) => {
//   // Add user to req.body
//   req.body.donorEmail = req.user.email;
  
//   const donation = await Donation.create(req.body);
//   res.status(201).json({
//     success: true,
//     data: donation
//   });
// });

// // @desc    Update donation
// // @route   PUT /api/donations/:id
// // @access  Private/Admin
// exports.updateDonation = (async (req, res, next) => {
//   const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   if (!donation) {
//     return next(`Donation not found with id of ${req.params.id}`, 404);
//   }
//   res.status(200).json({
//     success: true,
//     data: donation
//   });
// });

// // @desc    Delete donation
// // @route   DELETE /api/donations/:id
// // @access  Private/Admin
// exports.deleteDonation = (async (req, res, next) => {
//   const donation = await Donation.findById(req.params.id);
//   if (!donation) {
//     return next(`Donation not found with id of ${req.params.id}`, 404);
//   }
//   await donation.remove();
//   res.status(200).json({
//     success: true,
//     data: {}
//   });
// });

// // @desc    Get donations made by current user
// // @route   GET /api/donations/my-donations
// // @access  Private
// exports.getMyDonations = (async (req, res, next) => {
//   const donations = await Donation.find({ donorEmail: req.user.email });
//   res.status(200).json({
//     success: true,
//     count: donations.length,
//     data: donations
//   });
// });

// // @desc    Get donations received by current user (for models)
// // @route   GET /api/donations/received
// // @access  Private
// exports.getDonationsToMe = (async (req, res, next) => {
//   const donations = await Donation.find({ modelId: req.user.id });
//   res.status(200).json({
//     success: true,
//     count: donations.length,
//     data: donations
//   });
// }); 