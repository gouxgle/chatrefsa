const prisma = require('../config/database');
const fs = require('fs');
const path = require('path');

class StickerService {
  async listStickers() {
    const stickers = await prisma.sticker.findMany({
      orderBy: [{ pack: 'asc' }, { createdAt: 'asc' }],
      include: { uploadedBy: { select: { username: true, fullName: true } } },
    });

    const packs = {};
    for (const s of stickers) {
      if (!packs[s.pack]) packs[s.pack] = [];
      packs[s.pack].push(s);
    }
    return packs;
  }

  async createSticker({ name, pack, filename, filePath, uploadedById }) {
    return prisma.sticker.create({
      data: { name, pack: pack || 'General', filename, path: filePath, uploadedById },
    });
  }

  async deleteSticker(id, userId, isAdmin) {
    const sticker = await prisma.sticker.findUnique({ where: { id } });
    if (!sticker) throw { status: 404, message: 'Sticker no encontrado' };
    if (!isAdmin && sticker.uploadedById !== userId) {
      throw { status: 403, message: 'No podés eliminar este sticker' };
    }

    try { fs.unlinkSync(path.resolve(sticker.path)); } catch { /* ignore */ }
    await prisma.sticker.delete({ where: { id } });
    return { success: true };
  }
}

module.exports = new StickerService();
