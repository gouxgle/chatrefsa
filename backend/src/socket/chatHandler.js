const prisma = require('../config/database');

module.exports = (io, socket) => {
  const userId = socket.userId;

  // Join conversation rooms
  const joinRooms = async () => {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    participations.forEach((p) => {
      socket.join(p.conversationId);
    });

    // Personal room for direct notifications
    socket.join(`user_${userId}`);
  };

  joinRooms();

  // Send message via socket
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type, replyToId } = data;

      const message = await prisma.message.create({
        data: {
          content,
          type: type || 'TEXT',
          conversationId,
          senderId: userId,
          replyToId: replyToId || null,
        },
        include: {
          sender: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          replyTo: {
            include: {
              sender: { select: { id: true, username: true, fullName: true } },
            },
          },
          files: true,
          reads: true,
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      io.to(conversationId).emit('new_message', message);
    } catch (error) {
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  });

  // Mark messages as read
  socket.on('mark_read', async ({ conversationId }) => {
    try {
      const unread = await prisma.message.findMany({
        where: {
          conversationId,
          senderId: { not: userId },
          reads: { none: { userId } },
        },
        select: { id: true },
      });

      if (unread.length > 0) {
        await prisma.messageRead.createMany({
          data: unread.map((msg) => ({ messageId: msg.id, userId })),
          skipDuplicates: true,
        });

        io.to(conversationId).emit('messages_read', {
          conversationId,
          userId,
          count: unread.length,
        });
      }
    } catch (error) {
      // Silent fail
    }
  });

  // Edit message
  socket.on('edit_message', async ({ messageId, content }) => {
    try {
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (message && message.senderId === userId) {
        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { content, isEdited: true },
          include: {
            sender: { select: { id: true, username: true, fullName: true, avatar: true } },
          },
        });
        io.to(message.conversationId).emit('message_edited', updated);
      }
    } catch (error) {
      socket.emit('error', { message: 'Error al editar mensaje' });
    }
  });

  // Delete message
  socket.on('delete_message', async ({ messageId }) => {
    try {
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (message && message.senderId === userId) {
        await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true, content: null },
        });
        io.to(message.conversationId).emit('message_deleted', {
          messageId,
          conversationId: message.conversationId,
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Error al eliminar mensaje' });
    }
  });

  // Join new conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });
};
