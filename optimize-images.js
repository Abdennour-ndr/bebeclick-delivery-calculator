#!/usr/bin/env node

/**
 * Image Optimization Script for AWS Production
 * Converts images to WebP format and optimizes file sizes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🖼️ Starting Image Optimization for AWS Production...\n');

// Configuration
const config = {
  inputDirs: [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'src', 'assets'),
    path.join(__dirname, 'Logo')
  ],
  outputDir: path.join(__dirname, 'optimized-images'),
  formats: {
    webp: { quality: 85, effort: 6 },
    avif: { quality: 80, effort: 6 },
    jpeg: { quality: 85, progressive: true },
    png: { quality: 90, compressionLevel: 9 }
  }
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

const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif'];
  return imageExtensions.includes(path.extname(filename).toLowerCase());
};

// Check if ImageMagick is available
const checkImageMagick = () => {
  try {
    execSync('magick -version', { stdio: 'pipe' });
    return true;
  } catch {
    try {
      execSync('convert -version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
};

// Install ImageMagick if not available
const installImageMagick = () => {
  console.log('📦 Installing ImageMagick...');
  try {
    if (process.platform === 'darwin') {
      execSync('brew install imagemagick', { stdio: 'inherit' });
    } else if (process.platform === 'linux') {
      execSync('sudo apt-get update && sudo apt-get install -y imagemagick', { stdio: 'inherit' });
    } else {
      console.warn('⚠️ Please install ImageMagick manually for your platform');
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to install ImageMagick:', error.message);
    return false;
  }
};

// Optimize single image
const optimizeImage = async (inputPath, outputDir, filename) => {
  const ext = path.extname(filename).toLowerCase();
  const baseName = path.basename(filename, ext);
  const stats = { original: 0, optimized: 0, formats: [] };
  
  stats.original = getFileSize(inputPath);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Generate WebP version (best compression for web)
    const webpPath = path.join(outputDir, `${baseName}.webp`);
    const webpCmd = `magick "${inputPath}" -quality ${config.formats.webp.quality} -define webp:method=6 "${webpPath}"`;
    execSync(webpCmd, { stdio: 'pipe' });
    
    if (fs.existsSync(webpPath)) {
      stats.formats.push({
        format: 'webp',
        size: getFileSize(webpPath),
        path: webpPath
      });
    }
    
    // Generate AVIF version (next-gen format)
    try {
      const avifPath = path.join(outputDir, `${baseName}.avif`);
      const avifCmd = `magick "${inputPath}" -quality ${config.formats.avif.quality} "${avifPath}"`;
      execSync(avifCmd, { stdio: 'pipe' });
      
      if (fs.existsSync(avifPath)) {
        stats.formats.push({
          format: 'avif',
          size: getFileSize(avifPath),
          path: avifPath
        });
      }
    } catch {
      // AVIF might not be supported, skip
    }
    
    // Optimize original format
    let optimizedPath;
    if (['.jpg', '.jpeg'].includes(ext)) {
      optimizedPath = path.join(outputDir, `${baseName}${ext}`);
      const jpegCmd = `magick "${inputPath}" -quality ${config.formats.jpeg.quality} -interlace Plane -strip "${optimizedPath}"`;
      execSync(jpegCmd, { stdio: 'pipe' });
    } else if (ext === '.png') {
      optimizedPath = path.join(outputDir, `${baseName}${ext}`);
      const pngCmd = `magick "${inputPath}" -quality ${config.formats.png.quality} -strip "${optimizedPath}"`;
      execSync(pngCmd, { stdio: 'pipe' });
    } else {
      // Copy other formats as-is
      optimizedPath = path.join(outputDir, filename);
      fs.copyFileSync(inputPath, optimizedPath);
    }
    
    if (fs.existsSync(optimizedPath)) {
      stats.formats.push({
        format: ext.substring(1),
        size: getFileSize(optimizedPath),
        path: optimizedPath
      });
    }
    
    // Calculate total optimized size (smallest format)
    stats.optimized = Math.min(...stats.formats.map(f => f.size));
    
  } catch (error) {
    console.warn(`⚠️ Failed to optimize ${filename}:`, error.message);
    // Fallback: copy original
    const fallbackPath = path.join(outputDir, filename);
    fs.copyFileSync(inputPath, fallbackPath);
    stats.optimized = stats.original;
    stats.formats.push({
      format: 'original',
      size: stats.original,
      path: fallbackPath
    });
  }
  
  return stats;
};

// Process directory recursively
const processDirectory = async (inputDir, outputDir) => {
  const results = [];
  
  if (!fs.existsSync(inputDir)) {
    console.warn(`⚠️ Directory not found: ${inputDir}`);
    return results;
  }
  
  const items = fs.readdirSync(inputDir);
  
  for (const item of items) {
    const inputPath = path.join(inputDir, item);
    const stat = fs.statSync(inputPath);
    
    if (stat.isDirectory()) {
      const subResults = await processDirectory(inputPath, path.join(outputDir, item));
      results.push(...subResults);
    } else if (isImageFile(item)) {
      console.log(`🔄 Processing: ${item}`);
      const stats = await optimizeImage(inputPath, outputDir, item);
      results.push({ filename: item, ...stats });
    }
  }
  
  return results;
};

// Generate responsive image HTML
const generateResponsiveHTML = (results) => {
  const html = results.map(result => {
    const baseName = path.basename(result.filename, path.extname(result.filename));
    const webpFormat = result.formats.find(f => f.format === 'webp');
    const avifFormat = result.formats.find(f => f.format === 'avif');
    const originalFormat = result.formats.find(f => f.format !== 'webp' && f.format !== 'avif');
    
    if (webpFormat || avifFormat) {
      return `
<!-- Responsive image: ${result.filename} -->
<picture>
  ${avifFormat ? `<source srcset="${path.basename(avifFormat.path)}" type="image/avif">` : ''}
  ${webpFormat ? `<source srcset="${path.basename(webpFormat.path)}" type="image/webp">` : ''}
  <img src="${originalFormat ? path.basename(originalFormat.path) : result.filename}" 
       alt="${baseName}" 
       loading="lazy"
       decoding="async">
</picture>`;
    } else {
      return `<img src="${result.filename}" alt="${baseName}" loading="lazy" decoding="async">`;
    }
  }).join('\n');
  
  return html;
};

// Main optimization process
const main = async () => {
  console.log('🔍 Checking ImageMagick availability...');
  
  if (!checkImageMagick()) {
    console.log('📦 ImageMagick not found. Attempting to install...');
    if (!installImageMagick()) {
      console.error('❌ ImageMagick installation failed. Please install manually.');
      process.exit(1);
    }
  }
  
  console.log('✅ ImageMagick is available\n');
  
  // Clean output directory
  if (fs.existsSync(config.outputDir)) {
    fs.rmSync(config.outputDir, { recursive: true });
  }
  fs.mkdirSync(config.outputDir, { recursive: true });
  
  // Process all input directories
  const allResults = [];
  
  for (const inputDir of config.inputDirs) {
    console.log(`📁 Processing directory: ${inputDir}`);
    const results = await processDirectory(inputDir, config.outputDir);
    allResults.push(...results);
  }
  
  // Generate optimization report
  console.log('\n📊 Image Optimization Report:');
  console.log('==============================');
  
  const totalOriginal = allResults.reduce((sum, result) => sum + result.original, 0);
  const totalOptimized = allResults.reduce((sum, result) => sum + result.optimized, 0);
  const totalSaved = totalOriginal - totalOptimized;
  const savingsPercent = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : 0;
  
  allResults.forEach(result => {
    const saved = result.original - result.optimized;
    const percent = result.original > 0 ? ((saved / result.original) * 100).toFixed(1) : 0;
    console.log(`${result.filename.padEnd(30)} | ${formatBytes(result.original).padStart(8)} → ${formatBytes(result.optimized).padStart(8)} | Saved: ${formatBytes(saved).padStart(8)} (${percent}%)`);
  });
  
  console.log('------------------------------');
  console.log(`TOTAL (${allResults.length} files)`.padEnd(30) + ` | ${formatBytes(totalOriginal).padStart(8)} → ${formatBytes(totalOptimized).padStart(8)} | Saved: ${formatBytes(totalSaved).padStart(8)} (${savingsPercent}%)`);
  
  // Generate responsive HTML examples
  const responsiveHTML = generateResponsiveHTML(allResults);
  fs.writeFileSync(
    path.join(config.outputDir, 'responsive-images.html'),
    `<!DOCTYPE html>
<html>
<head>
  <title>Optimized Images - BebeClick</title>
  <style>
    img { max-width: 100%; height: auto; }
    picture { display: block; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>Optimized Images</h1>
  ${responsiveHTML}
</body>
</html>`
  );
  
  // Generate optimization manifest
  const manifest = {
    optimizationTime: new Date().toISOString(),
    totalFiles: allResults.length,
    totalOriginalSize: totalOriginal,
    totalOptimizedSize: totalOptimized,
    totalSaved: totalSaved,
    savingsPercent: parseFloat(savingsPercent),
    formats: config.formats,
    results: allResults
  };
  
  fs.writeFileSync(
    path.join(config.outputDir, 'optimization-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('\n✅ Image optimization completed successfully!');
  console.log(`📁 Optimized images available in: ${config.outputDir}`);
  console.log(`💾 Total size reduction: ${formatBytes(totalSaved)} (${savingsPercent}%)`);
  console.log(`📄 Responsive HTML examples: ${path.join(config.outputDir, 'responsive-images.html')}`);
  console.log(`📄 Optimization manifest: ${path.join(config.outputDir, 'optimization-manifest.json')}`);
};

// Run the optimization
main().catch(error => {
  console.error('❌ Optimization failed:', error);
  process.exit(1);
});
