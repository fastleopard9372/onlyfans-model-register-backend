const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Donation = require('../models/Donation');
const Photo = require('../models/Photo');
const emailService = require('../services/emailService');
const fs = require('fs').promises;
const path = require('path');
const generateCode = require('../utils/generateCode');

const addModel = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    if(req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    } 
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({success: false, message: 'Email is already registered' });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({success: false, message: 'Username is already registered' });
    } 
    const user = new User({ name, username, email, password, role: 'model' });
    await user.save();
    return res.status(201).json({success: true, message: 'Model added successfully', model:user });
  } catch (error) {
    next(error);
  }
} 

// Get all models for admin
const getAllModels = async (req, res, next) => {
  const { q, page = 1, limit = 10 } = req.query;
  try {
    // Authorization check is already handled by middleware, but keeping as a safeguard
    if(req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const skip = (page - 1) * limit;
    const query = {
      $and: [
        { role: 'model' },
        q
          ? {
              $or: [
                { name: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
              ]
            }
          : {}
      ]
    };
    // Use aggregation to get models with invitation counts in a single query
    const aggregationPipeline = [
      { $match: query },
      {
        $facet: {
          models: [
            { $skip: parseInt(skip) },
            { $limit: parseInt(limit) },
            {
              $lookup: {
                from: 'photos',
                localField: '_id',
                foreignField: 'model',
                as: 'photos'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: 'invitedBy',
                as: 'invitedUsers'
              }
            },
            {
              $project: {
                name: 1,
                username: 1,
                email: 1,
                createdAt: 1,
                photos:1,
                unlockedPhotosCount: {
                  $size: {
                    $filter: {
                      input: '$photos',
                      as: 'photo',
                      cond: { $gt: [{ $size: '$$photo.unlockedBy' }, 0] }
                    }
                  }
                },
    
                invitedUsers: {
                  $map: {
                    input: '$invitedUsers',
                    as: 'user',
                    in: {
                      _id: '$$user._id',
                      name: '$$user.name',
                      email: '$$user.email',
                      createdAt: '$$user.createdAt'
                    }
                  }
                },
    
                referrals: { $size: '$invitedUsers' },
                photosCount: { $size: '$photos' }
              }
            },
          ],
    
          total: [
            { $count: 'count' }
          ]
        }
      }
    ];
    const result = await User.aggregate(aggregationPipeline);
    const models = result[0].models;
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;
    const totalPages = Math.ceil(total / limit);
    
    return res.status(200).json({
      success: true,
      models: models,
      pagination: {
        page: parseInt(page),
        totalPages,
        totalCount: total,
        limit: parseInt(limit),
        q:q
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all donations for admin
const getAllDonations = async (req, res, next) => {
  try {
    if(req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const donations = await Donation.find()
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: donations.length,
      donations: donations
    });
  } catch (error) {
    next(error);
  }
};

const getModelPhotosById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const model = await User.findById(id);
    if(!model) {
      return res.status(404).json({success: false, message: 'Model not found' });
    }
    const photos = await Photo.find({ model: id }); 
    return res.status(200).json({
      success: true,
      count: photos.length,
      photos: photos
    });
  } catch (error) {
    next(error);
  }
};

// Admin deletes model
const deleteModel = async (req, res, next) => {
  try {
    if(req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    
    const model = await User.findById(id);
    
    if (!model) {
      return res.status(404).json({success: false, message: 'Model not found' });
    }
    
    if(id == model._id && model.role === 'admin') {
      return res.status(400).json({success: false, message: 'You cannot delete your own account' });
    }

    const photos = await Photo.find({ model: id });
    if(photos.length > 0) {
        for (const photo of photos) {
            if (photo.path) {
                await fs.unlink(path.join(__dirname, '..', photo.path));
            }
            if (photo.blurredPath) {
                await fs.unlink(path.join(__dirname, '..', photo.blurredPath));
            }
        }
    }
    // Delete profile photo from filesystem if exists
    if (model.profilePhoto) {
      try {
        await fs.unlink(path.join(__dirname, '..', model.profilePhoto));
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    // Delete model
    await User.deleteOne({ _id: id });
    
      return res.status(200).json({
        success: true,
        message: 'Model deleted successfully',
        id  
      });
  } catch (error) {
    next(error);
  }
};

const getAllVisitors = async (req, res, next) => {
  const { q, page = 1, limit = 10 } = req.query;
  try {
    // Authorization check is already handled by middleware, but keeping as a safeguard
    if(req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const skip = (page - 1) * limit;
    const query = {
      $and: [
        { role: 'visitor' },
        q
          ? {
              $or: [
                { name: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
              ]
            }
          : {}
      ]
    };
    // Use aggregation to get models with invitation counts in a single query
    const aggregationPipeline = [
      { $match: query },
      {
        $facet: {
          visitors: [
            { $skip: parseInt(skip) },
            { $limit: parseInt(limit) },
            {
              $lookup: {
                from: 'photos',
                localField: 'email',
                foreignField: 'unlockedBy',
                as: 'unlockedPhotos'
              }
            },
            {
              $project: {
                name: 1,
                username: 1,
                email: 1,
                createdAt: 1,
                unlockedPhotos:1,
                unlockedPhotosCount: {
                  $size: {
                    $filter: {
                      input: '$unlockedPhotos',
                      as: 'photo',
                      cond: { $gt: [{ $size: '$$photo.unlockedBy' }, 0] }
                    }
                  }
                },
              }
            },
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ];
    const result = await User.aggregate(aggregationPipeline);
    const visitors = result[0].visitors;
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;
    const totalPages = Math.ceil(total / limit);
    
    return res.status(200).json({
      success: true,
      visitors: visitors,
      pagination: {
        page: parseInt(page),
        totalPages,
        totalCount: total,
        limit: parseInt(limit),
        q:q
      }
    });
  } catch (error) {
    next(error);
  }
}

const addVisitor = async (req, res, next) => {
  try {
    const { name, email} = req.body;
    if(req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    } 
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({success: false, message: 'Email is already registered' });
    }
    const code = generateCode();
    const user = new User({ name, email, username:code, password:code, role: 'visitor' });
    await user.save();
    return res.status(201).json({success: true, message: 'Visitor added successfully', visitor:user });
  } catch (error) {
    next(error);
  }
} 

const deleteVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visitor = await User.findById(id);
    if(!visitor) {
      return res.status(404).json({success: false, message: 'Visitor not found' });
    }
    if(visitor.role !== 'visitor') {
      return res.status(400).json({success: false, message: 'User is not a visitor' });
    }
    await User.deleteOne({ _id: id });
    return res.status(200).json({success: true, message: 'Visitor deleted successfully', id: id });
  } catch (error) {
    next(error);
  }
} 

// Admin creates invitation

const createInvitation = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = req.user;
    
    if(user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({success: false, message: 'Email is already registered' });
    }
    
    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({ 
      email, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvitation) {
      return res.status(400).json({success: false, message: 'Invitation already sent to this email' });
    }
    
    // Create invitation
    const invitation = new Invitation({ 
      sender: user._id,
      email
    });
    await invitation.save();

    const newInvitation = await Invitation.findById(invitation._id).populate({path: 'sender', select: 'name email'}).sort({ createdAt: -1 });
    
    // Send invitation email
    // await emailService.sendAdminInvitationEmail(invitation);
    
    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: newInvitation
    });
  } catch (error) {
    next(error);
  }
};

const getAllInvitations = async (req, res, next) => {
  try {
    if(req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    } 
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query ={};
    if (q) {
        query = { email: { $regex: q, $options: 'i' } }
    }
    
    const invitations = await Invitation.find(query).populate({path: 'sender', select: 'name email'}).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Invitation.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({success: true, invitations: invitations, pagination: {
      page: parseInt(page),
      totalPages,
      totalCount: total,
      limit: parseInt(limit),
      q:q
    } });
  } catch (error) {
    next(error);
  }
}

const deleteInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    if(req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const invitation = await Invitation.findById(id);
    if(!invitation) {
      return res.status(404).json({success: false, message: 'Invitation not found' });
    }
    await Invitation.deleteOne({ _id: id });
    return res.status(200).json({success: true, message: 'Invitation deleted successfully', id: id });
  } catch (error) {
    next(error);
  }
}

const getStatistics = async (req, res, next) => {
  try {
    const totalPhotosUnlocked = await Photo.countDocuments({ unlockedBy: { $ne: null } });
    const totalModels = await User.countDocuments({ role: 'model' });
    const totalVisitors = await User.countDocuments({ role: 'visitor' });
    const totalDonations = await Donation.countDocuments();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // include today

    const dailyUnlocks = await Donation.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 } // ascending by date
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1
        }
      }
    ]);


    return res.status(200).json({success: true, statistics: {
      totalPhotosUnlocked,
      totalModels,
      totalVisitors,
      totalDonations,
      dailyUnlocks
    } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addModel,
  getAllModels,
  getAllDonations,
  deleteModel,
  getModelPhotosById,
  addVisitor,
  deleteVisitor,
  getAllVisitors,
  getAllInvitations,
  createInvitation,
  deleteInvitation,
  getStatistics
};