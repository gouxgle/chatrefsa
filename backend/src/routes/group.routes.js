const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { authMiddleware } = require('../middleware/auth');
const { groupValidation } = require('../middleware/validators');
const { uploadAvatar } = require('../middleware/upload');

router.use(authMiddleware);

router.post('/', groupValidation, groupController.createGroup);
router.delete('/:id', groupController.deleteGroup);
router.put('/:id', groupController.updateGroup);
router.put('/:id/avatar', uploadAvatar.single('avatar'), groupController.updateAvatar);
router.post('/:id/members', groupController.addMember);
router.delete('/:id/members/:userId', groupController.removeMember);
router.put('/:id/members/:userId/role', groupController.updateMemberRole);

module.exports = router;
