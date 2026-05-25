const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { sanitize } = require('../utils/helpers');

const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      id: { not: req.user.id },
      isBlocked: false,
    };

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
          username: true,
          fullName: true,
          email: true,
          avatar: true,
          status: true,
          isOnline: true,
          lastSeen: true,
          role: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: [{ isOnline: 'desc' }, { fullName: 'asc' }],
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        avatar: true,
        status: true,
        customStatus: true,
        isOnline: true,
        lastSeen: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, username, customStatus } = req.body;
    const data = {};

    if (fullName) data.fullName = sanitize(fullName);
    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, id: { not: req.user.id } },
      });
      if (existing) {
        return res.status(409).json({ error: 'El nombre de usuario ya existe' });
      }
      data.username = sanitize(username);
    }
    if (customStatus !== undefined) data.customStatus = sanitize(customStatus);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        avatar: true,
        status: true,
        customStatus: true,
        role: true,
      },
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ninguna imagen' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarPath },
      select: {
        id: true,
        avatar: true,
      },
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar avatar' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['AVAILABLE', 'BUSY', 'AWAY', 'DO_NOT_DISTURB', 'OFFLINE'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { status },
      select: { id: true, status: true },
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);

    if (!valid) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

module.exports = { getUsers, getUser, updateProfile, updateAvatar, updateStatus, changePassword };
