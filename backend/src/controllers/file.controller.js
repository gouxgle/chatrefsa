const fileService = require('../services/file.service');
const chatService = require('../services/chat.service');
const path = require('path');
const fs = require('fs');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const { conversationId, replyToId } = req.body;

    // Determine message type
    let messageType = 'FILE';
    if (req.file.mimetype.startsWith('image/')) messageType = 'IMAGE';
    else if (req.file.mimetype.startsWith('video/')) messageType = 'VIDEO';
    else if (req.file.mimetype.startsWith('audio/')) messageType = 'AUDIO';

    // Create message with file
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

    // Save file record
    const fileRecord = await fileService.saveFile({
      file: req.file,
      messageId: message ? message.id : null,
      uploadedById: req.user.id,
    });

    // Emit via socket
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
    const filePath = path.resolve(file.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const previewFile = async (req, res) => {
  try {
    const file = await fileService.getFile(req.params.id);
    const filePath = path.resolve(file.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    res.setHeader('Content-Type', file.mimetype);
    res.sendFile(filePath);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { uploadFile, downloadFile, previewFile };
