const prisma = require('../config/database');
const { sanitize } = require('../utils/helpers');

const isParticipant = async (userId, conversationId) => {
  const p = await prisma.conversationParticipant.findFirst({
    where: { userId, conversationId },
  });
  return !!p;
};

module.exports = (io, socket) => {
  const userId = socket.userId;

  const joinRooms = async () => {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    participations.forEach((p) => {
      socket.join(p.conversationId);
    });

    socket.join(`user_${userId}`);
  };

  joinRooms();

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type, replyToId } = data;

      if (!conversationId || !(await isParticipant(userId, conversationId))) {
        return socket.emit('error', { message: 'Sin acceso a esta conversación' });
      }

      const safeContent = type === 'STICKER' ? content : sanitize(content || '');

      const message = await prisma.message.create({
        data: {
          content: safeContent,
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

  socket.on('mark_read', async ({ conversationId }) => {
    try {
      if (!conversationId || !(await isParticipant(userId, conversationId))) return;

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

  socket.on('edit_message', async ({ messageId, content }) => {
    try {
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (message && message.senderId === userId) {
        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { content: sanitize(content || ''), isEdited: true },
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

  socket.on('join_conversation', async (conversationId) => {
    if (conversationId && await isParticipant(userId, conversationId)) {
      socket.join(conversationId);
    }
  });
};
