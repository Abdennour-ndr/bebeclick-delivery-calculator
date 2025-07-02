#!/usr/bin/env node

/**
 * Create AWS Deployment Package
 * BebeClick Delivery Calculator
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Creating AWS Deployment Package...\n');

const deploymentDir = path.join(__dirname, 'aws-deployment');
const packageName = 'bebeclick-aws-production.tar.gz';

// Clean deployment directory
if (fs.existsSync(deploymentDir)) {
  fs.rmSync(deploymentDir, { recursive: true });
}
fs.mkdirSync(deploymentDir, { recursive: true });

console.log('📁 Copying essential files...');

// Files to include in deployment
const filesToCopy = [
  // Server files
  { src: 'server.final.cjs', dest: 'server.js' },
  
  // Package files
  { src: 'package.json', dest: 'package.json' },
  { src: 'package-lock.json', dest: 'package-lock.json', optional: true },
  
  // Environment
  { src: '.env', dest: '.env', optional: true },
  { src: '.env.example', dest: '.env.example', optional: true },
  
  // Documentation
  { src: 'AWS_DEPLOYMENT_GUIDE.md', dest: 'README.md' },
  
  // Deployment scripts
  { src: 'aws-deploy.sh', dest: 'deploy.sh' }
];

// Directories to copy
const dirsToCopy = [
  // Optimized build
  { src: 'dist-optimized', dest: 'public', fallback: 'dist' }
];

// Copy files
filesToCopy.forEach(file => {
  const srcPath = path.join(__dirname, file.src);
  const destPath = path.join(deploymentDir, file.dest);
  
  if (fs.existsSync(srcPath)) {
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ ${file.src} → ${file.dest}`);
  } else if (!file.optional) {
    console.warn(`⚠️ Missing required file: ${file.src}`);
  }
});

// Copy directories
dirsToCopy.forEach(dir => {
  const srcPath = path.join(__dirname, dir.src);
  const fallbackPath = dir.fallback ? path.join(__dirname, dir.fallback) : null;
  const destPath = path.join(deploymentDir, dir.dest);
  
  let actualSrcPath = srcPath;
  
  if (!fs.existsSync(srcPath) && fallbackPath && fs.existsSync(fallbackPath)) {
    actualSrcPath = fallbackPath;
    console.log(`📁 Using fallback: ${dir.fallback} → ${dir.dest}`);
  }
  
  if (fs.existsSync(actualSrcPath)) {
    if (!fs.existsSync(path.dirname(destPath))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
    }
    
    // Copy directory recursively
    const copyDir = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const items = fs.readdirSync(src);
      items.forEach(item => {
        const srcItem = path.join(src, item);
        const destItem = path.join(dest, item);
        
        if (fs.statSync(srcItem).isDirectory()) {
          copyDir(srcItem, destItem);
        } else {
          fs.copyFileSync(srcItem, destItem);
        }
      });
    };
    
    copyDir(actualSrcPath, destPath);
    console.log(`✅ ${path.basename(actualSrcPath)} → ${dir.dest}`);
  } else if (!dir.optional) {
    console.warn(`⚠️ Missing required directory: ${dir.src}`);
  }
});

// Create simplified package.json for production
const originalPackage = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const productionPackage = {
  name: originalPackage.name,
  version: originalPackage.version,
  description: originalPackage.description + ' - AWS Production',
  main: 'server.js',
  type: 'commonjs',
  scripts: {
    start: 'node server.js',
    'start:production': 'NODE_ENV=production node server.js'
  },
  dependencies: {
    // Only essential dependencies for the simple server
  },
  engines: {
    node: '>=18.0.0'
  },
  keywords: ['delivery', 'calculator', 'aws', 'production'],
  author: originalPackage.author,
  license: originalPackage.license
};

fs.writeFileSync(
  path.join(deploymentDir, 'package.json'),
  JSON.stringify(productionPackage, null, 2)
);

console.log('✅ Created production package.json');

// Create deployment instructions
const deploymentInstructions = `# BebeClick Delivery Calculator - AWS Deployment

## Quick Start

1. Upload this package to your AWS EC2 instance
2. Extract: \`tar -xzf ${packageName}\`
3. Install Node.js 18+ if not installed
4. Start server: \`node server.js\`

## Production Deployment

1. \`chmod +x deploy.sh\`
2. \`sudo ./deploy.sh\`

## Server Details

- **Port**: 3001 (configurable via PORT env var)
- **Static Files**: ./public/
- **Health Check**: http://your-server:3001/health
- **Memory Usage**: ~50-100MB
- **CPU Usage**: Minimal

## Files Included

- \`server.js\` - Production server (CommonJS)
- \`public/\` - Optimized static files
- \`package.json\` - Minimal dependencies
- \`deploy.sh\` - Automated deployment script
- \`README.md\` - Complete deployment guide

## Environment Variables

- \`PORT\` - Server port (default: 3001)
- \`NODE_ENV\` - Environment (default: production)

## Support

Check logs and monitor with:
- Health: \`curl http://localhost:3001/health\`
- Memory: Check server console output
- Errors: Server will log to console

Built on: ${new Date().toISOString()}
Version: ${originalPackage.version}
`;

fs.writeFileSync(path.join(deploymentDir, 'DEPLOYMENT.md'), deploymentInstructions);

// Create startup script
const startupScript = `#!/bin/bash

# BebeClick Startup Script
echo "🚀 Starting BebeClick Delivery Calculator..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Set environment
export NODE_ENV=production
export PORT=\${PORT:-3001}

# Start server
echo "🌐 Starting server on port $PORT..."
node server.js
`;

fs.writeFileSync(path.join(deploymentDir, 'start.sh'), startupScript);
execSync(`chmod +x "${path.join(deploymentDir, 'start.sh')}"`);

console.log('✅ Created startup script');

// Create archive
console.log('\n📦 Creating deployment archive...');
try {
  execSync(`cd "${deploymentDir}" && tar -czf "../${packageName}" .`, { stdio: 'pipe' });
  
  const archiveSize = fs.statSync(path.join(__dirname, packageName)).size;
  const archiveSizeMB = (archiveSize / 1024 / 1024).toFixed(2);
  
  console.log(`✅ Created: ${packageName} (${archiveSizeMB}MB)`);
  
  // Calculate total files
  const countFiles = (dir) => {
    let count = 0;
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        count += countFiles(itemPath);
      } else {
        count++;
      }
    });
    return count;
  };
  
  const totalFiles = countFiles(deploymentDir);
  
  console.log('\n📊 Deployment Package Summary:');
  console.log('===============================');
  console.log(`📦 Archive: ${packageName}`);
  console.log(`📏 Size: ${archiveSizeMB}MB`);
  console.log(`📄 Files: ${totalFiles}`);
  console.log(`📁 Directory: ${deploymentDir}`);
  
  console.log('\n🚀 Ready for AWS Deployment!');
  console.log('=============================');
  console.log('1. Upload to EC2: scp -i key.pem bebeclick-aws-production.tar.gz ubuntu@your-ec2-ip:~');
  console.log('2. Extract: tar -xzf bebeclick-aws-production.tar.gz');
  console.log('3. Start: ./start.sh');
  console.log('4. Or automated: chmod +x deploy.sh && sudo ./deploy.sh');
  
} catch (error) {
  console.error('❌ Failed to create archive:', error.message);
  process.exit(1);
}

console.log('\n✅ Deployment package created successfully!');
