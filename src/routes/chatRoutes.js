const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations,
  getConversationById,
  startConversation,
  sendMessage,
  deleteConversation,
  getUnreadCount
} = require('../controllers/chatController');

router.get('/conversations', protect, getConversations);
router.get('/conversations/:conversationId', protect, getConversationById);
router.post('/conversations/:otherUserId', protect, startConversation);
router.post('/messages', protect, sendMessage);
router.delete('/conversations/:conversationId', protect, deleteConversation);
router.get('/messages/unread', protect, getUnreadCount);

module.exports = router;
