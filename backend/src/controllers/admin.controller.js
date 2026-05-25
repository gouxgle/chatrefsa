const prisma = require('../config/database');
const fileService = require('../services/file.service');
const { formatFileSize } = require('../utils/helpers');

const getStats = async (req, res) => {
  try {
    const [totalUsers, onlineUsers, totalMessages, totalGroups, totalFiles] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isOnline: true } }),
      prisma.message.count(),
      prisma.conversation.count({ where: { isGroup: true } }),
      prisma.file.count(),
    ]);

    const storageStats = await fileService.getStorageStats();

    // Messages today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesToday = await prisma.message.count({
      where: { createdAt: { gte: today } },
    });

    // New users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersWeek = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    });

    res.json({
      stats: {
        totalUsers,
        onlineUsers,
        totalMessages,
        messagesToday,
        totalGroups,
        totalFiles,
        newUsersWeek,
        storage: {
          total: formatFileSize(storageStats.totalSize),
          totalBytes: storageStats.totalSize,
          categories: Object.fromEntries(
            Object.entries(storageStats.categories).map(([k, v]) => [k, formatFileSize(v)])
          ),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          avatar: true,
          status: true,
          role: true,
          isBlocked: true,
          isOnline: true,
          lastSeen: true,
          createdAt: true,
          _count: { select: { sentMessages: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked: blocked },
      select: { id: true, email: true, isBlocked: true },
    });

    await prisma.systemLog.create({
      data: {
        action: blocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
        userId: req.user.id,
        details: `User ${user.email} ${blocked ? 'blocked' : 'unblocked'}`,
      },
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error al bloquear/desbloquear usuario' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });

    await prisma.user.delete({ where: { id } });

    await prisma.systemLog.create({
      data: {
        action: 'USER_DELETED',
        userId: req.user.id,
        details: `User ${user.email} deleted`,
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar rol' });
  }
};

const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.systemLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

const getConfig = async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    res.json({ configs });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { key, value } = req.body;

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};

const getMessagesAudit = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, dateFrom, dateTo, senderId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (search) {
      where.content = { contains: search };
    }

    if (senderId) {
      where.senderId = senderId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        if (dateTo.length <= 10) {
          toDate.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = toDate;
      }
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: { id: true, username: true, fullName: true, email: true },
          },
          conversation: {
            select: { id: true, isGroup: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.message.count({ where }),
    ]);

    res.json({
      messages,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error en auditoría de mensajes:', error);
    res.status(500).json({ error: 'Error al obtener auditoría de mensajes' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, fullName, email, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }

    // Check if email already exists (only if provided)
    const normalizedEmail = email ? email.toLowerCase().trim() : null;
    if (normalizedEmail) {
      const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingEmail) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName: fullName || username,
        email: normalizedEmail,
        role: role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    await prisma.systemLog.create({
      data: {
        action: 'USER_CREATED_BY_ADMIN',
        userId: req.user.id,
        details: `Admin created user: ${username}`,
      },
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  blockUser,
  deleteUser,
  changeUserRole,
  getLogs,
  getConfig,
  updateConfig,
  getMessagesAudit,
  createUser,
};
