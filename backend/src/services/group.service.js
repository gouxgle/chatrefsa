const prisma = require('../config/database');
const { sanitize } = require('../utils/helpers');

class GroupService {
  async createGroup({ name, description, createdById, memberIds = [] }) {
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: sanitize(name),
        description: description ? sanitize(description) : null,
        createdById,
        participants: {
          create: [
            { userId: createdById, role: 'ADMIN' },
            ...memberIds.filter(id => id !== createdById).map(userId => ({
              userId,
              role: 'MEMBER',
            })),
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
                isOnline: true,
              },
            },
          },
        },
      },
    });

    // System message
    await prisma.message.create({
      data: {
        content: `Grupo "${name}" creado`,
        type: 'SYSTEM',
        conversationId: conversation.id,
        senderId: createdById,
      },
    });

    return conversation;
  }

  async updateGroup(groupId, userId, { name, description }) {
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: groupId, userId, role: { in: ['ADMIN', 'MODERATOR'] } },
    });

    if (!participant) {
      throw { status: 403, message: 'No tienes permisos para editar este grupo' };
    }

    const data = {};
    if (name) data.name = sanitize(name);
    if (description !== undefined) data.description = description ? sanitize(description) : null;

    return prisma.conversation.update({
      where: { id: groupId },
      data,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });
  }

  async addMember(groupId, userId, newMemberId) {
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: groupId, userId, role: { in: ['ADMIN', 'MODERATOR'] } },
    });

    if (!participant) {
      throw { status: 403, message: 'No tienes permisos para agregar miembros' };
    }

    const existing = await prisma.conversationParticipant.findFirst({
      where: { conversationId: groupId, userId: newMemberId },
    });

    if (existing) {
      throw { status: 409, message: 'El usuario ya es miembro del grupo' };
    }

    await prisma.conversationParticipant.create({
      data: {
        conversationId: groupId,
        userId: newMemberId,
        role: 'MEMBER',
      },
    });

    const newMember = await prisma.user.findUnique({
      where: { id: newMemberId },
      select: { fullName: true, username: true },
    });

    // System message
    await prisma.message.create({
      data: {
        content: `${newMember.fullName || newMember.username} se unió al grupo`,
        type: 'SYSTEM',
        conversationId: groupId,
        senderId: userId,
      },
    });

    return { success: true };
  }

  async removeMember(groupId, userId, targetUserId) {
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: groupId, userId, role: 'ADMIN' },
    });

    if (!participant && userId !== targetUserId) {
      throw { status: 403, message: 'No tienes permisos para remover miembros' };
    }

    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: groupId, userId: targetUserId },
    });

    const removedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { fullName: true, username: true },
    });

    const action = userId === targetUserId ? 'salió del grupo' : 'fue removido del grupo';

    await prisma.message.create({
      data: {
        content: `${removedUser.fullName || removedUser.username} ${action}`,
        type: 'SYSTEM',
        conversationId: groupId,
        senderId: userId,
      },
    });

    return { success: true };
  }

  async updateMemberRole(groupId, userId, targetUserId, newRole) {
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: groupId, userId, role: 'ADMIN' },
    });

    if (!participant) {
      throw { status: 403, message: 'Solo los administradores pueden cambiar roles' };
    }

    const target = await prisma.conversationParticipant.findFirst({
      where: { conversationId: groupId, userId: targetUserId },
    });

    if (!target) {
      throw { status: 404, message: 'El usuario no es miembro del grupo' };
    }

    return prisma.conversationParticipant.update({
      where: { id: target.id },
      data: { role: newRole },
    });
  }
}

module.exports = new GroupService();
