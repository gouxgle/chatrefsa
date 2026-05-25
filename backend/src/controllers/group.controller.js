const { validationResult } = require('express-validator');
const groupService = require('../services/group.service');

const createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, memberIds } = req.body;
    const group = await groupService.createGroup({
      name,
      description,
      createdById: req.user.id,
      memberIds: memberIds || [],
    });

    const io = req.app.get('io');
    if (io) {
      // Notify all members
      group.participants.forEach((p) => {
        io.to(`user_${p.userId}`).emit('group_created', group);
      });
    }

    res.status(201).json({ group });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear grupo' });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const group = await groupService.updateGroup(id, req.user.id, { name, description });

    const io = req.app.get('io');
    if (io) {
      io.to(id).emit('group_updated', group);
    }

    res.json({ group });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await groupService.addMember(id, req.user.id, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('added_to_group', { groupId: id });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    await groupService.removeMember(id, req.user.id, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('removed_from_group', { groupId: id });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    const result = await groupService.updateMemberRole(id, req.user.id, userId, role);
    res.json({ success: true, participant: result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { createGroup, updateGroup, addMember, removeMember, updateMemberRole };
