#!/usr/bin/env node

/**
 * Build Optimization Script for AWS Production
 * Minifies, compresses, and optimizes all assets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Build Optimization for AWS Production...\n');

// Configuration
const config = {
  distDir: path.join(__dirname, 'dist'),
  optimizedDir: path.join(__dirname, 'dist-optimized'),
  publicDir: path.join(__dirname, 'public'),
  srcDir: path.join(__dirname, 'src')
};

// Utility functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileSize = (filePath) => {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
};

const copyFile = (src, dest) => {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
};

// Step 1: Clean and prepare directories
console.log('📁 Preparing directories...');
if (fs.existsSync(config.optimizedDir)) {
  fs.rmSync(config.optimizedDir, { recursive: true });
}
fs.mkdirSync(config.optimizedDir, { recursive: true });

// Step 2: Build the project
console.log('🔨 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Install optimization tools
console.log('📦 Installing optimization tools...');
const optimizationTools = [
  'html-minifier-terser',
  'terser',
  'clean-css-cli',
  'imagemin-cli',
  'imagemin-webp',
  'imagemin-mozjpeg',
  'imagemin-pngquant'
];

try {
  execSync(`npm install -g ${optimizationTools.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ Optimization tools installed\n');
} catch (error) {
  console.warn('⚠️ Some optimization tools may not be available');
}

// Step 4: Copy and optimize files
console.log('🎯 Optimizing files...');

const optimizationStats = {
  html: { original: 0, optimized: 0, files: 0 },
  css: { original: 0, optimized: 0, files: 0 },
  js: { original: 0, optimized: 0, files: 0 },
  images: { original: 0, optimized: 0, files: 0 },
  other: { original: 0, optimized: 0, files: 0 }
};

const processDirectory = (srcDir, destDir) => {
  const items = fs.readdirSync(srcDir);
  
  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      processDirectory(srcPath, destPath);
    } else {
      const ext = path.extname(item).toLowerCase();
      const originalSize = getFileSize(srcPath);
      
      try {
        if (ext === '.html') {
          // Optimize HTML
          const htmlContent = fs.readFileSync(srcPath, 'utf8');
          const optimizedHtml = htmlContent
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><')
            .replace(/<!--[\s\S]*?-->/g, '')
            .trim();
          
          fs.writeFileSync(destPath, optimizedHtml);
          
          optimizationStats.html.original += originalSize;
          optimizationStats.html.optimized += getFileSize(destPath);
          optimizationStats.html.files++;
          
        } else if (ext === '.css') {
          // Optimize CSS
          try {
            execSync(`cleancss -o "${destPath}" "${srcPath}"`, { stdio: 'pipe' });
          } catch {
            copyFile(srcPath, destPath);
          }
          
          optimizationStats.css.original += originalSize;
          optimizationStats.css.optimized += getFileSize(destPath);
          optimizationStats.css.files++;
          
        } else if (ext === '.js') {
          // Optimize JavaScript
          try {
            execSync(`terser "${srcPath}" -o "${destPath}" -c -m`, { stdio: 'pipe' });
          } catch {
            copyFile(srcPath, destPath);
          }
          
          optimizationStats.js.original += originalSize;
          optimizationStats.js.optimized += getFileSize(destPath);
          optimizationStats.js.files++;
          
        } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
          // Optimize images
          copyFile(srcPath, destPath);
          
          try {
            if (ext === '.png') {
              execSync(`imagemin "${destPath}" --out-dir="${path.dirname(destPath)}" --plugin=pngquant`, { stdio: 'pipe' });
            } else if (['.jpg', '.jpeg'].includes(ext)) {
              execSync(`imagemin "${destPath}" --out-dir="${path.dirname(destPath)}" --plugin=mozjpeg`, { stdio: 'pipe' });
            }
          } catch {
            // Keep original if optimization fails
          }
          
          optimizationStats.images.original += originalSize;
          optimizationStats.images.optimized += getFileSize(destPath);
          optimizationStats.images.files++;
          
        } else {
          // Copy other files as-is
          copyFile(srcPath, destPath);
          
          optimizationStats.other.original += originalSize;
          optimizationStats.other.optimized += getFileSize(destPath);
          optimizationStats.other.files++;
        }
        
      } catch (error) {
        console.warn(`⚠️ Failed to optimize ${srcPath}:`, error.message);
        copyFile(srcPath, destPath);
      }
    }
  }
};

// Process the dist directory
processDirectory(config.distDir, config.optimizedDir);

// Step 5: Generate optimization report
console.log('\n📊 Optimization Report:');
console.log('========================');

const totalOriginal = Object.values(optimizationStats).reduce((sum, stat) => sum + stat.original, 0);
const totalOptimized = Object.values(optimizationStats).reduce((sum, stat) => sum + stat.optimized, 0);
const totalSaved = totalOriginal - totalOptimized;
const savingsPercent = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : 0;

Object.entries(optimizationStats).forEach(([type, stats]) => {
  if (stats.files > 0) {
    const saved = stats.original - stats.optimized;
    const percent = stats.original > 0 ? ((saved / stats.original) * 100).toFixed(1) : 0;
    console.log(`${type.toUpperCase().padEnd(8)} | ${stats.files.toString().padStart(3)} files | ${formatBytes(stats.original).padStart(8)} → ${formatBytes(stats.optimized).padStart(8)} | Saved: ${formatBytes(saved).padStart(8)} (${percent}%)`);
  }
});

console.log('------------------------');
console.log(`TOTAL    | ${Object.values(optimizationStats).reduce((sum, stat) => sum + stat.files, 0).toString().padStart(3)} files | ${formatBytes(totalOriginal).padStart(8)} → ${formatBytes(totalOptimized).padStart(8)} | Saved: ${formatBytes(totalSaved).padStart(8)} (${savingsPercent}%)`);

// Step 6: Create production manifest
const manifest = {
  buildTime: new Date().toISOString(),
  optimization: {
    totalFiles: Object.values(optimizationStats).reduce((sum, stat) => sum + stat.files, 0),
    originalSize: totalOriginal,
    optimizedSize: totalOptimized,
    savedBytes: totalSaved,
    savingsPercent: parseFloat(savingsPercent),
    breakdown: optimizationStats
  },
  environment: 'production',
  target: 'aws-ec2',
  version: process.env.npm_package_version || '1.0.0'
};

fs.writeFileSync(
  path.join(config.optimizedDir, 'build-manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('\n✅ Build optimization completed successfully!');
console.log(`📁 Optimized files available in: ${config.optimizedDir}`);
console.log(`💾 Total size reduction: ${formatBytes(totalSaved)} (${savingsPercent}%)`);
console.log(`📄 Build manifest: ${path.join(config.optimizedDir, 'build-manifest.json')}`);

// Step 7: Create deployment-ready archive
console.log('\n📦 Creating deployment archive...');
try {
  execSync(`cd ${config.optimizedDir} && tar -czf ../bebeclick-production.tar.gz .`, { stdio: 'pipe' });
  const archiveSize = getFileSize(path.join(__dirname, 'bebeclick-production.tar.gz'));
  console.log(`✅ Deployment archive created: bebeclick-production.tar.gz (${formatBytes(archiveSize)})`);
} catch (error) {
  console.warn('⚠️ Failed to create archive:', error.message);
}

console.log('\n🎉 Ready for AWS deployment!');
