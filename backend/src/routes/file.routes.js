const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);

router.post('/upload', uploadLimiter, upload.single('file'), fileController.uploadFile);
router.get('/:id/download', fileController.downloadFile);
router.get('/:id/preview', fileController.previewFile);

module.exports = router;
