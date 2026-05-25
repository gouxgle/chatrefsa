const prisma = require('../config/database');

module.exports = (io, socket) => {
  const userId = socket.userId;

  // Set user online
  const setOnline = async () => {
    try {
      if (!userId) return;
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date(), status: 'AVAILABLE' },
      });

      io.emit('user_online', {
        userId,
        isOnline: true,
        lastSeen: new Date(),
      });
    } catch (error) {
      console.warn('Error al marcar usuario como online:', error.message);
    }
  };

  setOnline();

  // Typing indicators
  socket.on('typing', ({ conversationId }) => {
    socket.to(conversationId).emit('user_typing', {
      userId,
      conversationId,
    });
  });

  socket.on('stop_typing', ({ conversationId }) => {
    socket.to(conversationId).emit('user_stop_typing', {
      userId,
      conversationId,
    });
  });

  // Status change
  socket.on('status_change', async ({ status }) => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status },
      });

      io.emit('user_status_changed', { userId, status });
    } catch (error) {
      // Silent fail
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      });

      io.emit('user_offline', {
        userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    } catch (error) {
      // Silent fail
    }
  });
};
