/**
 * Final Production Server for AWS Deployment
 * BebeClick Delivery Calculator - Ultra Simple
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

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

console.log('🚀 BebeClick Delivery Calculator - Final AWS Server');
console.log(`📁 Static files: ${path.basename(staticDir)}`);

// Request handler
const server = http.createServer((req, res) => {
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
        pid: process.pid,
        staticDir: path.basename(staticDir)
      }));
      return;
    }
    
    // API root
    if (pathname === '/api' || pathname === '/api/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'BebeClick API - Production Ready',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: ['/health', '/api/test']
      }));
      return;
    }
    
    // Test API endpoint
    if (pathname === '/api/test') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        test: 'success',
        server: 'aws-production',
        timestamp: new Date().toISOString()
      }));
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
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>BebeClick - Not Built</title></head>
          <body>
            <h1>Application Not Built</h1>
            <p>Please run: <code>npm run build:complete</code></p>
            <p>Static directory: ${staticDir}</p>
            <p>Looking for: ${filePath}</p>
          </body>
        </html>
      `);
      return;
    }
    
    // Get file extension and MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // Set cache headers for static assets
    if (ext !== '.html') {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      res.setHeader('ETag', `"${fs.statSync(filePath).mtime.getTime()}"`);
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    // Compression for text files
    if (ext === '.js' || ext === '.css' || ext === '.html') {
      res.setHeader('Content-Encoding', 'identity'); // No compression for now
    }
    
    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('File read error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 - Internal Server Error');
        return;
      }
      
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Content-Length': data.length
      });
      res.end(data);
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }));
  }
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`📁 Serving from: ${staticDir}`);
  console.log(`🌐 Ready: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
  
  // Check if static files exist
  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ Static files found');
  } else {
    console.log('⚠️ Static files not found - run: npm run build:complete');
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`📴 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
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
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection triggered');
    }
  }
}, 60000); // Check every minute

// Log startup info
console.log('📋 Server Configuration:');
console.log(`   Node.js: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);
console.log(`   PID: ${process.pid}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'production'}`);

module.exports = server;
