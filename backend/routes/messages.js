const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  addReaction
} = require('../controllers/messageController');
const { protect, verifiedOnly } = require('../middleware/auth');

// All routes require authentication and verification
router.use(protect);
router.use(verifiedOnly);

router.post('/', sendMessage);
router.get('/unread', getUnreadCount);
router.get('/:matchId', getMessages);
router.put('/:matchId/read', markAsRead);
router.delete('/:messageId', deleteMessage);
router.post('/:messageId/react', addReaction);

module.exports = router;