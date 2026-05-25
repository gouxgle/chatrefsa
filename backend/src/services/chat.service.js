const prisma = require('../config/database');
const { sanitize } = require('../utils/helpers');

class ChatService {
  async getConversations(userId) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                status: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, username: true, fullName: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get unread counts
    const results = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            reads: { none: { userId } },
          },
        });

        return {
          ...conv,
          unreadCount,
          lastMessage: conv.messages[0] || null,
        };
      })
    );

    return results;
  }

  async getOrCreatePrivateConversation(userId, otherUserId) {
    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                status: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (existing) return existing;

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId, role: 'MEMBER' },
            { userId: otherUserId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                status: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    return conversation;
  }

  async getMessages(conversationId, userId, page = 1, limit = 50) {
    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw { status: 403, message: 'No eres participante de esta conversación' };
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          replyTo: {
            include: {
              sender: {
                select: { id: true, username: true, fullName: true },
              },
            },
          },
          files: true,
          reads: {
            select: { userId: true, readAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  }

  async sendMessage({ conversationId, senderId, content, type = 'TEXT', replyToId, files }) {
    const sanitizedContent = content ? sanitize(content) : null;

    const message = await prisma.message.create({
      data: {
        content: sanitizedContent,
        type,
        conversationId,
        senderId,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, username: true, fullName: true },
            },
          },
        },
        files: true,
        reads: true,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async editMessage(messageId, userId, newContent) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message || message.senderId !== userId) {
      throw { status: 403, message: 'No puedes editar este mensaje' };
    }

    return prisma.message.update({
      where: { id: messageId },
      data: {
        content: sanitize(newContent),
        isEdited: true,
      },
      include: {
        sender: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
      },
    });
  }

  async deleteMessage(messageId, userId) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message || message.senderId !== userId) {
      throw { status: 403, message: 'No puedes eliminar este mensaje' };
    }

    return prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: null,
      },
    });
  }

  async forwardMessage(messageId, userId, targetConversationId) {
    const original = await prisma.message.findUnique({
      where: { id: messageId },
      include: { files: true },
    });

    if (!original) {
      throw { status: 404, message: 'Mensaje no encontrado' };
    }

    const forwarded = await prisma.message.create({
      data: {
        content: original.content ? `⤳ ${original.content}` : '⤳ [Mensaje reenviado]',
        type: original.type,
        conversationId: targetConversationId,
        senderId: userId,
      },
      include: {
        sender: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
        files: true,
        reads: true,
      },
    });

    return forwarded;
  }

  async markAsRead(conversationId, userId) {
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        reads: { none: { userId } },
      },
      select: { id: true },
    });

    if (unreadMessages.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessages.map((msg) => ({
          messageId: msg.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    return { markedAsRead: unreadMessages.length };
  }

  async searchMessages(userId, searchQuery, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const userConversations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const conversationIds = userConversations.map((c) => c.conversationId);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId: { in: conversationIds },
          content: { contains: searchQuery },
          isDeleted: false,
        },
        include: {
          sender: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          conversation: {
            select: { id: true, name: true, isGroup: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          conversationId: { in: conversationIds },
          content: { contains: searchQuery },
          isDeleted: false,
        },
      }),
    ]);

    return { messages, total, page, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new ChatService();
