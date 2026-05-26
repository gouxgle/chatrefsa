const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { uploadSticker } = require('../middleware/upload');
const ctrl = require('../controllers/sticker.controller');

router.use(authMiddleware);

router.get('/', ctrl.listStickers);
router.post('/', uploadSticker.single('sticker'), ctrl.uploadSticker);
router.delete('/:id', ctrl.deleteSticker);

module.exports = router;
