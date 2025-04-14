const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

const setupSocket = (server) => {
  const io = socketio(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Map to store online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    
    // Add user to online users
    onlineUsers.set(userId, socket.id);
    
    // Emit online status to all connected clients
    io.emit('userStatus', {
      userId,
      status: 'online'
    });

    // Handle joining a conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
    });

    // Handle new message
    socket.on('sendMessage', async (messageData) => {
      try {
        const { recipientId, content, attachments = [], conversationId } = messageData;
        
        // Create message in database
        const message = new Message({
          sender: userId,
          recipient: recipientId,
          content: content || '',
          attachments
        });
        
        await message.save();
        
        // Update or create conversation
        let conversation;
        
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
          if (conversation) {
            conversation.lastMessage = message._id;
            await conversation.save();
          }
        }
        
        if (!conversation) {
          conversation = await Conversation.create({
            participants: [userId, recipientId],
            lastMessage: message._id
          });
        }
        
        // Populate sender details
        const populatedMessage = await Message.findById(message._id).populate({
          path: 'sender',
          select: 'name username profilePhoto'
        });
        
        // Emit message to conversation room
        io.to(conversation._id.toString()).emit('newMessage', populatedMessage);
        
        // Send notification to recipient if online
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('messageNotification', {
            message: populatedMessage,
            conversationId: conversation._id
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle typing status
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('userTyping', {
        userId,
        isTyping
      });
    });

    // Handle read receipts
    socket.on('markAsRead', async ({ conversationId, senderId }) => {
      try {
        await Message.updateMany(
          { 
            recipient: userId,
            sender: senderId,
            isRead: false
          },
          { isRead: true }
        );
        
        socket.to(conversationId).emit('messagesRead', { readerId: userId });
      } catch (error) {
        socket.emit('error', { message: 'Error updating read status' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      
      io.emit('userStatus', {
        userId,
        status: 'offline'
      });
    });
  });

  return io;
};

module.exports = setupSocket;