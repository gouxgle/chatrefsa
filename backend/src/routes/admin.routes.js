const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/role', adminController.changeUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/logs', adminController.getLogs);
router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);
router.get('/messages', adminController.getMessagesAudit);
router.post('/users', adminController.createUser);

module.exports = router;
