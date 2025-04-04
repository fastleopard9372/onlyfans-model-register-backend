const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Donation = require('../models/Donation');
const Photo = require('../models/Photo');
const UnlockedPhoto = require('../models/UnlockedPhoto');
const User = require('../models/User');

exports.createSignupPaymentIntent = async (req, res, next) => {
  try {
    const { email, donorType } = req.body;
    const amount = 25
    const donation_find = await Donation.findOne({
      donorEmail: email,
      status: 'succeeded',
      donorType: donorType
    });
    let donationId = -1
    if (donation_find) { 
      donationId = donation_find._id
      return res.json({ clientSecret:donation_find.stripePaymentId, donationId: donation_find._id });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "usd",
      metadata: { email },
    });
    const donation = new Donation({
      donorEmail: email,
      amount:amount,
      donorType: donorType,
      stripePaymentId: paymentIntent.id,
      status: "pending",
    })
    
    await donation.save();
    return res.json({ clientSecret: paymentIntent.client_secret, donationId: donation._id });
  } catch (error) {
    next(error);
  }
}

exports.createPhotoPaymentIntent = async (req, res, next) => {
  try {
    const { email, donorType, modelId } = req.body;
    const amount = 25
    const donation_find = await Donation.findOne({
      donorEmail: email,
      status: 'succeeded',
      donorType: donorType,
      modelId: modelId
    }); 
    let donationId = -1
    if (donation_find) { 
      donationId = donation_find._id
      return res.json({ clientSecret:donation_find.stripePaymentId, donationId: donation_find._id });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "usd",
      metadata: { email, modelId },
    }); 
    const donation = new Donation({
      donorEmail: email,
      amount:amount,
      donorType: donorType,
      stripePaymentId: paymentIntent.id,
      status: "pending",
      modelId: modelId
    })
    
    await donation.save();
    return res.json({ clientSecret: paymentIntent.client_secret, donationId: donation._id });
  } catch (error) {
    next(error);
  }
}

exports.createSignupPaymentComplete  = async (req, res, next) => {
  try {
    const { donationId, paymentIntent } = req.body;
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    donation.stripePaymentId = paymentIntent.id;
    donation.status = paymentIntent.status;
    await donation.save();
    return res.json({
      success: true,
      message: 'Payment complete',
      donation
    });
  } catch (error) {
    next(error);
  }
}



exports.createPhotoPaymentComplete = async (req, res, next) => {
  try {
    const { donationId, paymentIntent } = req.body;
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    donation.stripePaymentId = paymentIntent.id;
    donation.status = paymentIntent.status;
    await donation.save();

    const unlockedPhoto = new UnlockedPhoto({
      modelId: donation.modelId,
      donorEmail: donation.donorEmail,
      donationId: donation._id
    })
    await unlockedPhoto.save();

    return res.json({
      success: true,
      message: 'Payment complete',
      unlockedPhoto,
      donation
    });
  } catch (error) {
    next(error);
  }
} 

exports.checkPhotoPayment = async (req, res, next) => {
  try {
    const { email, modelId } = req.body;
    const donation = await Donation.findOne({
      donorEmail: email,
      modelId: modelId,
      status: 'succeeded',
      donorType: 'visitor',
    });
    if (!donation) {
      return res.json({
        success: false,
        message: 'Payment not found'
      });
    }
    const unlockedPhoto = await UnlockedPhoto.findOne({
      modelId: modelId,
      donorEmail: email,
      donationId: donation._id
    });
    if (!unlockedPhoto) {
      return res.json({
        success: false,
        message: 'Photo not unlocked'
      });
    }
    return res.json({
      success: true,
      unlockedPhoto,
      donation
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Create payment session for photo unlock
// @route   POST /api/payments/photo/:photoId
// @access  Public
exports.createPhotoPayment = async (req, res, next) => {
  try {
    const { photoId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find the photo
    const photo = await Photo.findById(photoId).populate('userId', 'email');

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Check if already unlocked
    const alreadyUnlocked = await UnlockedPhoto.findOne({
      photoId,
      donorEmail: email
    });

    if (alreadyUnlocked) {
      return res.status(400).json({
        success: false,
        message: 'You have already unlocked this photo'
      });
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Photo Unlock - ${photo.title || 'Untitled'}`,
              description: `Donation to unlock photo by ${photo.userId.name || 'Model'}`
            },
            unit_amount: photo.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/photos/${photoId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/photos/${photoId}`,
      customer_email: email,
      metadata: {
        photoId,
        modelId: photo.userId._id.toString(),
        donorEmail: email,
        type: 'photo_unlock'
      }
    });

    // Create a pending donation record
    await Donation.create({
      amount: photo.price,
      photoId,
      donorEmail: email,
      modelId: photo.userId._id,
      stripeSessionId: session.id,
      stripePaymentId: '', // Will be updated when payment is completed
      status: 'pending',
      type: 'photo_unlock'
    });

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create payment session for model signup
// @route   POST /api/payments/signup
// @access  Public
exports.createSignupPayment = async (req, res, next) => {
  try {
    const { email, invitationCode } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Model Signup Fee',
              description: 'One-time fee to join the platform as a model'
            },
            unit_amount: 2500, // $25.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/signup/complete?session_id={CHECKOUT_SESSION_ID}&invitation=${invitationCode}`,
      cancel_url: `${process.env.FRONTEND_URL}/signup?invitation=${invitationCode}`,
      customer_email: email,
      metadata: {
        donorEmail: email,
        invitationCode,
        type: 'model_signup'
      }
    });

    // Create a pending donation record (modelId will be updated after user creation)
    await Donation.create({
      amount: 25,
      donorEmail: email,
      modelId: null, // Will be updated after user creation
      stripeSessionId: session.id,
      stripePaymentId: '', // Will be updated when payment is completed
      status: 'pending',
      type: 'model_signup'
    });

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
};



// @desc    Webhook for Stripe events
// @route   POST /api/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Update donation status
      const donation = await Donation.findOne({ stripeSessionId: session.id });
      
      if (donation) {
        donation.status = 'completed';
        donation.stripePaymentId = session.payment_intent;
        await donation.save();
        
        // If it's a photo unlock, create an UnlockedPhoto record
        if (donation.type === 'photo_unlock') {
          await UnlockedPhoto.create({
            photoId: donation.photoId,
            donorEmail: donation.donorEmail,
            donationId: donation._id
          });
          
          // Increment donation count for the photo
          await Photo.findByIdAndUpdate(donation.photoId, {
            $inc: { donationCount: 1 }
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment completion
// @route   GET /api/payments/verify/:sessionId
// @access  Public
exports.verifyPayment = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Check if donation exists and is completed
    const donation = await Donation.findOne({ 
      stripeSessionId: sessionId,
      status: 'completed'
    });
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or not completed'
      });
    }
    
    // If it's a photo unlock, check if photo is unlocked
    if (donation.type === 'photo_unlock') {
      const unlockedPhoto = await UnlockedPhoto.findOne({
        donationId: donation._id
      });
      
      if (!unlockedPhoto) {
        return res.status(404).json({
          success: false,
          message: 'Photo unlock record not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        type: 'photo_unlock',
        photoId: donation.photoId,
        unlocked: true
      });
    }
    
    // If it's a model signup
    if (donation.type === 'model_signup') {
      return res.status(200).json({
        success: true,
        type: 'model_signup',
        paid: true
      });
    }
    
    res.status(200).json({
      success: true,
      donation
    });
  } catch (error) {
    next(error);
  }
};
