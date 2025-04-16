const Message = require('../models/message');
const Conversation = require('../models/conversation');
const User = require('../models/User');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const emailService = require('../services/emailService');

// Get all conversations for the current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate({
      path: 'participants',
      select: 'name username profilePhoto'
    })
    .populate({
      path: 'lastMessage',
      select: 'content createdAt isRead'
    })
    .sort({ updatedAt: -1 });

    // Format conversations to show other participant's details
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId
      );
      
      return {
        id: conv._id,
        otherParticipant,
        lastMessage: conv.lastMessage,
        updatedAt: conv.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      message: "Conversations fetched successfully",
      count: formattedConversations.length,
      data: formattedConversations
    });
  } catch (error) {
    res.status(500).json({
      success: false, 
      message: "Server Error",
      error: error
    });
  }
};

// Get a specific conversation by id
exports.getConversationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    })
    .populate({
      path: 'participants',
      select: 'name username profilePhoto'
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
        error: error
      });
    }

    // Get messages for this conversation
    const messages = await Message.find({
      $and: [
        { sender: { $in: conversation.participants } },
        { recipient: { $in: conversation.participants } }
      ]
    })
    .sort({ createdAt: 1 })
    .populate({
      path: 'sender',
      select: 'name username profilePhoto'
    });

    // Mark unread messages as read
    await Message.updateMany(
      { 
        recipient: userId,
        isRead: false,
        sender: { $in: conversation.participants.filter(p => p._id.toString() !== userId) }
      },
      { isRead: true }
    );

    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== userId
    );

    res.status(200).json({
      success: true,
      data: {
        conversation: {
          id: conversation._id,
          otherParticipant
        },
        messages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error
    });
  }
};

// Start or get conversation with a user
exports.startConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    // Validate otherUserId
    if (!mongoose.isValidObjectId(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        error: error
      });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId).select('name username profilePhoto');
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: error
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
      isActive: true
    }).populate({
      path: 'participants',
      select: 'name username profilePhoto'
    });

    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, otherUserId]
      });

      // Populate participants after creation
      conversation = await Conversation.findById(conversation._id).populate({
        path: 'participants',
        select: 'name username profilePhoto'
      });
    }

    const formattedConversation = {
      id: conversation._id,
      otherParticipant: otherUser
    };

    res.status(200).json({
      success: true,
      message: "Conversation started successfully",
      data: formattedConversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, content, attachments = [] } = req.body;

    // Validate inputs
    if (!content && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content or attachments are required",
        error: error
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
        error: error
      });
    }

    // Create the message
    const message = await Message.create({
      sender: userId,
      recipient: recipientId,
      content: content || '',
      attachments
    });

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
      isActive: true
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        lastMessage: message._id
      });
    } else {
      // Update last message
      conversation.lastMessage = message._id;
      await conversation.save();
    }

    // Populate sender details for response
    const populatedMessage = await Message.findById(message._id).populate({
      path: 'sender',
      select: 'name username profilePhoto email'
    }).populate({
      path: 'recipient',
      select: 'name username profilePhoto email'
    });

    // Send email to recipient
    try {
      await emailService.sendMessageEmail(populatedMessage);
    } catch (error) {
      console.log(error);
    }

    res.status(201).json({
      success: true,
      data: {
        message: populatedMessage,
        conversationId: conversation._id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error
    });
  }
};

// Delete conversation (soft delete)
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
        error: error
      });
    }

    // Soft delete by setting isActive to false
    conversation.isActive = false;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const results = await Message.aggregate([
      {
        $match: {
          recipient: new mongoose.Types.ObjectId(userId),
          isRead: false
        }
      },
      {
        $facet: {
          grouped: [
            {
              $group: {
                _id: '$sender',
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                id: '$_id',
                count: 1,
                _id: 0
              }
            }
          ],
          total: [
            {
              $count: 'count'
            }
          ]
        }
      }
    ]);
    const unreadMessages = results[0].grouped || {};
    const unreadCount = results[0].total[0]?.count || 0;
    
    res.status(200).json({
      success: true,
      data: { unreadMessages, unreadCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error
    });
  }
};


