const { validationResult } = require('express-validator');
const chatService = require('../services/chat.service');

const getConversations = async (req, res) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};

const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId requerido' });
    }

    const conversation = await chatService.getOrCreatePrivateConversation(req.user.id, userId);
    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear conversación' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await chatService.getMessages(id, req.user.id, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Error al obtener mensajes' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: conversationId } = req.params;
    const { content, type, replyToId } = req.body;

    const message = await chatService.sendMessage({
      conversationId,
      senderId: req.user.id,
      content,
      type,
      replyToId,
    });

    // Emit via Socket.io (will be handled in socket handler)
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', message);
    }

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const message = await chatService.editMessage(id, req.user.id, content);

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId).emit('message_edited', message);
    }

    res.json({ message });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await chatService.deleteMessage(id, req.user.id);

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId).emit('message_deleted', { messageId: id, conversationId: message.conversationId });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const forwardMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { conversationId } = req.body;

    const message = await chatService.forwardMessage(id, req.user.id, conversationId);

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', message);
    }

    res.status(201).json({ message });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await chatService.markAsRead(id, req.user.id);

    const io = req.app.get('io');
    if (io) {
      io.to(id).emit('messages_read', { conversationId: id, userId: req.user.id });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar como leídos' });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
    }

    const result = await chatService.searchMessages(req.user.id, q, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
};

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  forwardMessage,
  markAsRead,
  searchMessages,
};
