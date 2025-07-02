/**
 * AWS Production Server - Ultra Simple
 * BebeClick Delivery Calculator
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 BebeClick Delivery Calculator - AWS Production Server');

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    pid: process.pid
  });
});

// API root
app.get('/api', (req, res) => {
  res.json({
    message: 'BebeClick API - Production',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Firebase API routes
app.get('/api/wilayas', async (req, res) => {
  try {
    const { default: firebaseService } = await import('./src/services/firebaseService.js');
    const wilayas = await firebaseService.getWilayas();
    res.json(wilayas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch wilayas' });
  }
});

// Static files
const staticDir = fs.existsSync(path.join(__dirname, 'dist-optimized')) 
  ? path.join(__dirname, 'dist-optimized')
  : path.join(__dirname, 'dist');

if (fs.existsSync(staticDir)) {
  console.log(`📁 Serving static files from: ${path.basename(staticDir)}`);
  app.use(express.static(staticDir, {
    maxAge: '1y',
    etag: true
  }));
} else {
  console.warn('⚠️ No static files found');
}

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'App not built. Run: npm run build:complete' 
    });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  
  // Test Firebase connection
  try {
    const { default: firebaseService } = await import('./src/services/firebaseService.js');
    const status = await firebaseService.testConnection();
    console.log('🔥 Firebase:', status.success ? '✅ Connected' : '❌ Failed');
  } catch (error) {
    console.log('🔥 Firebase: ⚠️ Connection test failed');
  }
  
  console.log(`🌐 Ready: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('📴 Shutting down...');
  server.close(() => process.exit(0));
});

export default app;
