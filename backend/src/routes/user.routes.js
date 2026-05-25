const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.use(authMiddleware);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.put('/profile', userController.updateProfile);
router.put('/avatar', uploadAvatar.single('avatar'), userController.updateAvatar);
router.put('/status', userController.updateStatus);
router.put('/password', userController.changePassword);

module.exports = router;
