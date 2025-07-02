/**
 * Simple Production Server for AWS EC2
 * BebeClick Delivery Calculator - Firebase Only
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting BebeClick Delivery Calculator - Production Server');

// Trust proxy for AWS
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://firestore.googleapis.com", "https://maps.googleapis.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression({
  level: 6,
  threshold: 1024
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per window
  message: { error: 'Too many requests' },
  skip: (req) => req.path === '/health'
});

app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://calc-bebeclick.surge.sh',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400 || duration > 1000) {
      console.log(`[${res.statusCode >= 400 ? 'ERROR' : 'SLOW'}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    pid: process.pid
  });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  try {
    // Import Firebase service dynamically
    const { default: firebaseService } = await import('./src/services/firebaseService.js');
    const firebaseStatus = await firebaseService.testConnection();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      firebase: firebaseStatus,
      pid: process.pid
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API root
app.get('/', (req, res) => {
  res.json({
    message: 'BebeClick Delivery Calculator - Production API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      detailedHealth: '/health/detailed',
      wilayas: '/api/wilayas',
      communes: '/api/communes/:wilayaCode'
    }
  });
});

// Firebase API routes
app.get('/api/wilayas', async (req, res) => {
  try {
    const { default: firebaseService } = await import('./src/services/firebaseService.js');
    const wilayas = await firebaseService.getWilayas();
    res.json(wilayas);
  } catch (error) {
    console.error('Error fetching wilayas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/communes/:wilayaCode', async (req, res) => {
  try {
    const wilayaCode = parseInt(req.params.wilayaCode);
    if (isNaN(wilayaCode)) {
      return res.status(400).json({ error: 'Invalid wilaya code' });
    }
    
    const { default: firebaseService } = await import('./src/services/firebaseService.js');
    const communes = await firebaseService.getCommunesByWilaya(wilayaCode);
    res.json(communes);
  } catch (error) {
    console.error('Error fetching communes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from dist-optimized if available, otherwise dist
const staticDir = path.join(__dirname, 'dist-optimized');
const fallbackDir = path.join(__dirname, 'dist');

try {
  if (require('fs').existsSync(staticDir)) {
    console.log('📁 Serving optimized static files from dist-optimized');
    app.use(express.static(staticDir, {
      maxAge: '1y',
      etag: true,
      lastModified: true
    }));
  } else if (require('fs').existsSync(fallbackDir)) {
    console.log('📁 Serving static files from dist');
    app.use(express.static(fallbackDir, {
      maxAge: '1y',
      etag: true,
      lastModified: true
    }));
  } else {
    console.warn('⚠️ No static files directory found');
  }
} catch (error) {
  console.warn('⚠️ Error setting up static files:', error.message);
}

// SPA fallback
app.get('*', (req, res) => {
  try {
    const indexPath = require('fs').existsSync(path.join(staticDir, 'index.html')) 
      ? path.join(staticDir, 'index.html')
      : path.join(fallbackDir, 'index.html');
    
    if (require('fs').existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Application not built. Run npm run build first.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`📴 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  if (memUsedMB > 400) {
    console.warn(`⚠️ High memory usage: ${memUsedMB}MB`);
    if (global.gc) {
      global.gc();
      console.log('🗑️ Forced garbage collection');
    }
  }
}, 60000);

export default app;
