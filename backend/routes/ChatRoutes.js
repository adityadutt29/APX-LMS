const express = require('express');
const router = express.Router();
const {
  getChatRooms,
  createChatRoom,
  getChatRoom,
  sendMessage,
  addParticipant,
  removeParticipant,
  markAsRead,
  getAvailableUsers,
  deleteChatRoom
} = require('../controllers/ChatController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all chat rooms for current user
router.get('/', getChatRooms);

// Create new chat room
router.post('/', createChatRoom);

// Get available users for chat
router.get('/users', getAvailableUsers);

// Get specific chat room
router.get('/:roomId', getChatRoom);

// Send message to chat room
router.post('/:roomId/messages', sendMessage);

// Mark messages as read
router.put('/:roomId/read', markAsRead);

// Add participant to chat room
router.post('/:roomId/participants', addParticipant);

// Remove participant from chat room
router.delete('/:roomId/participants/:userId', removeParticipant);

// Delete chat room
router.delete('/:roomId', deleteChatRoom);

module.exports = router;
