/**
 * Simple Deployment Server for AWS
 * BebeClick Delivery Calculator
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Static files directory
const staticDir = fs.existsSync(path.join(__dirname, 'dist-optimized')) 
  ? path.join(__dirname, 'dist-optimized')
  : path.join(__dirname, 'dist');

console.log('🚀 BebeClick Delivery Calculator - Simple AWS Server');
console.log(`📁 Static files: ${path.basename(staticDir)}`);

// Firebase service (lazy load)
let firebaseService = null;
const getFirebaseService = async () => {
  if (!firebaseService) {
    try {
      const module = await import('./src/services/firebaseService.js');
      firebaseService = module.default;
    } catch (error) {
      console.error('Firebase service not available:', error.message);
      return null;
    }
  }
  return firebaseService;
};

// Request handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    // Health check
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        pid: process.pid
      }));
      return;
    }
    
    // API routes
    if (pathname.startsWith('/api/')) {
      const firebase = await getFirebaseService();
      
      if (pathname === '/api/wilayas' && req.method === 'GET') {
        if (firebase) {
          try {
            const wilayas = await firebase.getWilayas();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(wilayas));
            return;
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch wilayas' }));
            return;
          }
        }
      }
      
      if (pathname.startsWith('/api/communes/') && req.method === 'GET') {
        const wilayaCode = parseInt(pathname.split('/')[3]);
        if (firebase && !isNaN(wilayaCode)) {
          try {
            const communes = await firebase.getCommunesByWilaya(wilayaCode);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(communes));
            return;
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch communes' }));
            return;
          }
        }
      }
      
      // API not found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
      return;
    }
    
    // Static files
    let filePath = path.join(staticDir, pathname === '/' ? 'index.html' : pathname);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // SPA fallback - serve index.html for client-side routing
      filePath = path.join(staticDir, 'index.html');
    }
    
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 - File not found. Please run: npm run build:complete');
      return;
    }
    
    // Get file extension and MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // Set cache headers for static assets
    if (ext !== '.html') {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
    
    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 - Internal Server Error');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(data);
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// Start server
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  
  // Test Firebase connection
  try {
    const firebase = await getFirebaseService();
    if (firebase) {
      const status = await firebase.testConnection();
      console.log('🔥 Firebase:', status.success ? '✅ Connected' : '❌ Failed');
    } else {
      console.log('🔥 Firebase: ⚠️ Service not available');
    }
  } catch (error) {
    console.log('🔥 Firebase: ⚠️ Connection test failed');
  }
  
  console.log(`🌐 Ready: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`📴 Received ${signal}. Shutting down...`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('❌ Forced shutdown');
    process.exit(1);
  }, 10000);
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
      console.log('🗑️ Garbage collection triggered');
    }
  }
}, 60000);

export default server;
