const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authMiddleware } = require('../middleware/auth');
const { messageValidation, paginationValidation } = require('../middleware/validators');

router.use(authMiddleware);

router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);
router.get('/conversations/:id/messages', paginationValidation, chatController.getMessages);
router.post('/conversations/:id/messages', messageValidation, chatController.sendMessage);
router.put('/messages/:id', chatController.editMessage);
router.delete('/messages/:id', chatController.deleteMessage);
router.post('/messages/:id/forward', chatController.forwardMessage);
router.post('/conversations/:id/read', chatController.markAsRead);
router.get('/messages/search', chatController.searchMessages);

module.exports = router;
