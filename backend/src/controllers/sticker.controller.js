const stickerService = require('../services/sticker.service');

const listStickers = async (req, res) => {
  try {
    const packs = await stickerService.listStickers();
    res.json({ packs });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener stickers' });
  }
};

const uploadSticker = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const { name, pack } = req.body;
    const sticker = await stickerService.createSticker({
      name: name || req.file.originalname,
      pack: pack || 'General',
      filename: req.file.filename,
      filePath: req.file.path,
      uploadedById: req.user.id,
    });

    res.status(201).json({ sticker });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir sticker' });
  }
};

const deleteSticker = async (req, res) => {
  try {
    await stickerService.deleteSticker(req.params.id, req.user.id, req.user.role === 'ADMIN');
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { listStickers, uploadSticker, deleteSticker };
