const jwt = require('jsonwebtoken');
const chatHandler = require('./chatHandler');
const presenceHandler = require('./presenceHandler');
const groupHandler = require('./groupHandler');
const logger = require('../utils/logger');

const setupSocket = (io) => {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Initialize handlers
    chatHandler(io, socket);
    presenceHandler(io, socket);
    groupHandler(io, socket);

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });
};

module.exports = setupSocket;
