require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const logger = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const setupSocket = require('./socket');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const chatRoutes = require('./routes/chat.routes');
const groupRoutes = require('./routes/group.routes');
const fileRoutes = require('./routes/file.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const server = http.createServer(app);

// Socket.io setup with dynamic CORS for local development and local network testing
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isLocal = origin.includes('localhost') || 
                      origin.includes('127.0.0.1') || 
                      /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
      if (process.env.NODE_ENV !== 'production' || isLocal || origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(null, false); // Block other production origins
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 1e8, // 100MB
});

// Make io accessible in routes
app.set('io', io);

// Create upload directories
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const dirs = ['avatars', 'images', 'documents', 'videos', 'audio'];
dirs.forEach((dir) => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocal = origin.includes('localhost') || 
                    origin.includes('127.0.0.1') || 
                    /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
    if (process.env.NODE_ENV !== 'production' || isLocal || origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado por CORS en Producción'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'El archivo excede el tamaño máximo permitido' });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Error de archivo: ${err.message}` });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
});

// Setup Socket.io
setupSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  logger.success(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 WebSocket ready`);
  logger.info(`🌐 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = { app, server, io };
