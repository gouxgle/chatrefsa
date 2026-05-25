const prisma = require('../config/database');
const path = require('path');
const fs = require('fs');

class FileService {
  async saveFile({ file, messageId, uploadedById }) {
    const fileRecord = await prisma.file.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        messageId,
        uploadedById,
      },
    });

    return fileRecord;
  }

  async getFile(fileId) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      throw { status: 404, message: 'Archivo no encontrado' };
    }
    return file;
  }

  async getStorageStats() {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    let totalSize = 0;
    const categories = {};

    const dirs = ['avatars', 'images', 'documents', 'videos', 'audio'];
    for (const dir of dirs) {
      const dirPath = path.join(uploadDir, dir);
      let dirSize = 0;
      try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const stat = fs.statSync(path.join(dirPath, file));
          dirSize += stat.size;
        }
      } catch (e) {
        // Directory might not exist
      }
      categories[dir] = dirSize;
      totalSize += dirSize;
    }

    return { totalSize, categories };
  }
}

module.exports = new FileService();
