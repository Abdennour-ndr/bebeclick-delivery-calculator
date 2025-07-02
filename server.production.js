/**
 * Production-Optimized Express Server for AWS EC2
 * BebeClick Delivery Calculator
 * Optimized for t2.micro/t3.micro instances
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// Firebase services (no MongoDB needed)
import firebaseService from './src/services/firebaseService.js';
import cluster from 'cluster';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Production configuration
const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'production',
  maxWorkers: process.env.MAX_WORKERS || Math.min(2, os.cpus().length), // Limit for t2.micro
  memoryLimit: process.env.MEMORY_LIMIT || '400MB',
  enableClustering: process.env.ENABLE_CLUSTERING === 'true',
  corsOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://calc-bebeclick.surge.sh',
    process.env.FRONTEND_URL
  ].filter(Boolean)
};

// Cluster setup for better performance
if (config.enableClustering && cluster.isPrimary) {
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`🔧 Starting ${config.maxWorkers} workers...`);
  
  // Fork workers
  for (let i = 0; i < config.maxWorkers; i++) {
    cluster.fork();
  }
  
  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 Master received SIGTERM, shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });
  
} else {
  // Worker process
  startServer();
}

async function startServer() {
  const app = express();
  
  // Trust proxy (important for AWS ALB/ELB)
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
        connectSrc: ["'self'", "https://api.allorigins.win", "https://maps.googleapis.com"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
  
  // Compression middleware
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path === '/health'
  });
  
  app.use('/api/', limiter);
  
  // CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow any localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
  }));
  
  // Body parsing with limits
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      // Verify JSON payload
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON payload' });
        return;
      }
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));
  
  // Request logging middleware (optimized for production)
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
      
      // Only log errors and slow requests in production
      if (logLevel === 'ERROR' || duration > 1000) {
        console.log(`[${logLevel}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
      }
    });
    
    next();
  });
  
  // Health check endpoint (lightweight)
  app.get('/health', (req, res) => {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        limit: config.memoryLimit
      },
      pid: process.pid
    };
    
    res.status(200).json(healthCheck);
  });
  
  // Detailed health check for monitoring
  app.get('/health/detailed', async (req, res) => {
    try {
      // Test Firebase connection
      const firebaseStatus = await firebaseService.testConnection();

      const detailedHealth = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        firebase: firebaseStatus,
        cluster: {
          worker: cluster.worker?.id || 'master',
          pid: process.pid
        }
      };

      res.status(200).json(detailedHealth);
    } catch (error) {
      res.status(503).json({
        status: 'ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // API routes
  app.get('/', (req, res) => {
    res.json({
      message: 'BebeClick Delivery Calculator - Production API',
      version: process.env.npm_package_version || '1.0.0',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      worker: cluster.worker?.id || 'master',
      endpoints: {
        health: '/health',
        detailedHealth: '/health/detailed',
        database: '/api/database',
        deliveryPricing: '/api/delivery-pricing',
        products: '/api/products',
        locations: '/api/locations',
        settings: '/api/settings'
      }
    });
  });
  
  // Initialize Firebase connection
  try {
    console.log('🔌 Connecting to Firebase...');
    const firebaseStatus = await firebaseService.testConnection();
    console.log('✅ Firebase connected successfully:', firebaseStatus);

  } catch (error) {
    console.warn('⚠️ Firebase connection warning:', error.message);
    console.log('📡 Continuing with limited functionality...');
  }
  
  // Import and use API routes (Firebase-based)
  try {
    // Only load routes that work with Firebase
    console.log('🔧 Loading Firebase-based API routes...');

    // Basic API endpoints for Firebase data
    app.get('/api/wilayas', async (req, res) => {
      try {
        const wilayas = await firebaseService.getWilayas();
        res.json(wilayas);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/communes/:wilayaCode', async (req, res) => {
      try {
        const wilayaCode = parseInt(req.params.wilayaCode);
        if (isNaN(wilayaCode)) {
          return res.status(400).json({ error: 'Invalid wilaya code' });
        }
        const communes = await firebaseService.getCommunesByWilaya(wilayaCode);
        res.json(communes);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    console.log('✅ Firebase API routes loaded successfully');

  } catch (error) {
    console.warn('⚠️ Some API routes may not be available:', error.message);
  }
  
  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error('🚨 Unhandled error:', error);
    
    // Don't leak error details in production
    const errorResponse = {
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    };
    
    if (config.nodeEnv !== 'production') {
      errorResponse.details = error.message;
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
  });
  
  // Start server
  const server = app.listen(config.port, '0.0.0.0', () => {
    const workerId = cluster.worker?.id || 'master';
    console.log(`🚀 Worker ${workerId} (PID: ${process.pid}) listening on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`💾 Memory limit: ${config.memoryLimit}`);
  });
  
  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`📴 Received ${signal}. Shutting down gracefully...`);
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 30 seconds
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
    const memLimitMB = parseInt(config.memoryLimit);
    
    if (memUsedMB > memLimitMB * 0.9) {
      console.warn(`⚠️ High memory usage: ${memUsedMB}MB (limit: ${memLimitMB}MB)`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('🗑️ Forced garbage collection');
      }
    }
  }, 60000); // Check every minute
  
  return server;
}
