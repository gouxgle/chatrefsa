const fileService = require('../services/file.service');
const chatService = require('../services/chat.service');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE = path.resolve(process.env.UPLOAD_DIR || './uploads');

const SAFE_CONTENT_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
  'application/pdf',
]);

const safeFilePath = (filePath) => {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(UPLOAD_BASE + path.sep) && resolved !== UPLOAD_BASE) {
    return null;
  }
  return resolved;
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const { conversationId, replyToId } = req.body;

    let messageType = 'FILE';
    if (req.file.mimetype.startsWith('image/')) messageType = 'IMAGE';
    else if (req.file.mimetype.startsWith('video/')) messageType = 'VIDEO';
    else if (req.file.mimetype.startsWith('audio/')) messageType = 'AUDIO';

    let message = null;
    if (conversationId) {
      message = await chatService.sendMessage({
        conversationId,
        senderId: req.user.id,
        content: req.file.originalname,
        type: messageType,
        replyToId,
      });
    }

    const fileRecord = await fileService.saveFile({
      file: req.file,
      messageId: message ? message.id : null,
      uploadedById: req.user.id,
    });

    if (conversationId) {
      const io = req.app.get('io');
      if (io) {
        io.to(conversationId).emit('new_message', {
          ...message,
          files: [fileRecord],
        });
      }
    }

    res.status(201).json({ file: fileRecord, message });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir archivo' });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await fileService.getFile(req.params.id);
    const filePath = safeFilePath(file.path);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }

    const safeName = path.basename(file.originalName || 'archivo');
    res.download(filePath, safeName);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const previewFile = async (req, res) => {
  try {
    const file = await fileService.getFile(req.params.id);
    const filePath = safeFilePath(file.path);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const contentType = SAFE_CONTENT_TYPES.has(file.mimetype)
      ? file.mimetype
      : 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { uploadFile, downloadFile, previewFile };
