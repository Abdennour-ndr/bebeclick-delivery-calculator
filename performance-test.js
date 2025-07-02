#!/usr/bin/env node

/**
 * Performance Testing Script for AWS Production
 * Tests load times, bundle sizes, and optimization effectiveness
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Performance Testing...\n');

// Configuration
const config = {
  testUrl: process.env.TEST_URL || 'http://localhost:3001',
  lighthouseConfig: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false
      }
    }
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

// Test 1: Bundle Size Analysis
const analyzeBundleSize = () => {
  console.log('📦 Analyzing Bundle Sizes...');
  console.log('============================');
  
  const distDir = path.join(__dirname, 'dist');
  const optimizedDir = path.join(__dirname, 'dist-optimized');
  
  const results = {
    original: { total: 0, files: {} },
    optimized: { total: 0, files: {} }
  };
  
  // Analyze original build
  if (fs.existsSync(distDir)) {
    const analyzeDir = (dir, result) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          analyzeDir(itemPath, result);
        } else {
          const ext = path.extname(item).toLowerCase();
          const size = stat.size;
          
          if (!result.files[ext]) {
            result.files[ext] = { count: 0, size: 0 };
          }
          
          result.files[ext].count++;
          result.files[ext].size += size;
          result.total += size;
        }
      }
    };
    
    analyzeDir(distDir, results.original);
  }
  
  // Analyze optimized build
  if (fs.existsSync(optimizedDir)) {
    const analyzeDir = (dir, result) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          analyzeDir(itemPath, result);
        } else {
          const ext = path.extname(item).toLowerCase();
          const size = stat.size;
          
          if (!result.files[ext]) {
            result.files[ext] = { count: 0, size: 0 };
          }
          
          result.files[ext].count++;
          result.files[ext].size += size;
          result.total += size;
        }
      }
    };
    
    analyzeDir(optimizedDir, results.optimized);
  }
  
  // Display results
  console.log('File Type | Original Size | Optimized Size | Savings');
  console.log('----------|---------------|----------------|--------');
  
  const allExtensions = new Set([
    ...Object.keys(results.original.files),
    ...Object.keys(results.optimized.files)
  ]);
  
  for (const ext of allExtensions) {
    const original = results.original.files[ext] || { size: 0 };
    const optimized = results.optimized.files[ext] || { size: 0 };
    const savings = original.size - optimized.size;
    const savingsPercent = original.size > 0 ? ((savings / original.size) * 100).toFixed(1) : 0;
    
    console.log(`${ext.padEnd(9)} | ${formatBytes(original.size).padStart(13)} | ${formatBytes(optimized.size).padStart(14)} | ${formatBytes(savings).padStart(6)} (${savingsPercent}%)`);
  }
  
  const totalSavings = results.original.total - results.optimized.total;
  const totalSavingsPercent = results.original.total > 0 ? ((totalSavings / results.original.total) * 100).toFixed(1) : 0;
  
  console.log('----------|---------------|----------------|--------');
  console.log(`TOTAL     | ${formatBytes(results.original.total).padStart(13)} | ${formatBytes(results.optimized.total).padStart(14)} | ${formatBytes(totalSavings).padStart(6)} (${totalSavingsPercent}%)`);
  
  return results;
};

// Test 2: Server Response Time
const testServerResponse = async () => {
  console.log('\n⚡ Testing Server Response Times...');
  console.log('===================================');
  
  const endpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'API Root', path: '/api' },
    { name: 'Frontend', path: '/' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await fetch(`${config.testUrl}${endpoint.path}`);
      const end = Date.now();
      
      const result = {
        name: endpoint.name,
        path: endpoint.path,
        status: response.status,
        responseTime: end - start,
        size: parseInt(response.headers.get('content-length') || '0')
      };
      
      results.push(result);
      
      const status = response.ok ? '✅' : '❌';
      console.log(`${status} ${endpoint.name.padEnd(15)} | ${result.responseTime.toString().padStart(4)}ms | ${response.status} | ${formatBytes(result.size)}`);
      
    } catch (error) {
      console.log(`❌ ${endpoint.name.padEnd(15)} | ERROR | ${error.message}`);
      results.push({
        name: endpoint.name,
        path: endpoint.path,
        error: error.message
      });
    }
  }
  
  return results;
};

// Test 3: Lighthouse Performance Test
const runLighthouseTest = async () => {
  console.log('\n🔍 Running Lighthouse Performance Test...');
  console.log('=========================================');
  
  try {
    // Check if lighthouse is available
    execSync('lighthouse --version', { stdio: 'pipe' });
    
    const outputPath = path.join(__dirname, 'lighthouse-report.html');
    const jsonOutputPath = path.join(__dirname, 'lighthouse-report.json');
    
    console.log('🔄 Running Lighthouse audit...');
    
    const lighthouseCmd = `lighthouse ${config.testUrl} --output=html --output=json --output-path=${outputPath.replace('.html', '')} --chrome-flags="--headless --no-sandbox --disable-gpu"`;
    
    execSync(lighthouseCmd, { stdio: 'inherit' });
    
    // Parse JSON results
    if (fs.existsSync(jsonOutputPath)) {
      const report = JSON.parse(fs.readFileSync(jsonOutputPath, 'utf8'));
      
      const metrics = {
        performance: Math.round(report.lhr.categories.performance.score * 100),
        accessibility: Math.round(report.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(report.lhr.categories['best-practices'].score * 100),
        seo: Math.round(report.lhr.categories.seo.score * 100),
        firstContentfulPaint: report.lhr.audits['first-contentful-paint'].numericValue,
        largestContentfulPaint: report.lhr.audits['largest-contentful-paint'].numericValue,
        timeToInteractive: report.lhr.audits['interactive'].numericValue,
        speedIndex: report.lhr.audits['speed-index'].numericValue,
        totalBlockingTime: report.lhr.audits['total-blocking-time'].numericValue
      };
      
      console.log('\n📊 Lighthouse Scores:');
      console.log(`Performance:     ${metrics.performance}/100 ${metrics.performance >= 90 ? '✅' : metrics.performance >= 70 ? '⚠️' : '❌'}`);
      console.log(`Accessibility:   ${metrics.accessibility}/100 ${metrics.accessibility >= 90 ? '✅' : metrics.accessibility >= 70 ? '⚠️' : '❌'}`);
      console.log(`Best Practices:  ${metrics.bestPractices}/100 ${metrics.bestPractices >= 90 ? '✅' : metrics.bestPractices >= 70 ? '⚠️' : '❌'}`);
      console.log(`SEO:             ${metrics.seo}/100 ${metrics.seo >= 90 ? '✅' : metrics.seo >= 70 ? '⚠️' : '❌'}`);
      
      console.log('\n⏱️ Core Web Vitals:');
      console.log(`First Contentful Paint: ${(metrics.firstContentfulPaint / 1000).toFixed(2)}s ${metrics.firstContentfulPaint <= 1800 ? '✅' : '❌'}`);
      console.log(`Largest Contentful Paint: ${(metrics.largestContentfulPaint / 1000).toFixed(2)}s ${metrics.largestContentfulPaint <= 2500 ? '✅' : '❌'}`);
      console.log(`Time to Interactive: ${(metrics.timeToInteractive / 1000).toFixed(2)}s ${metrics.timeToInteractive <= 3800 ? '✅' : '❌'}`);
      console.log(`Speed Index: ${(metrics.speedIndex / 1000).toFixed(2)}s ${metrics.speedIndex <= 3400 ? '✅' : '❌'}`);
      console.log(`Total Blocking Time: ${metrics.totalBlockingTime.toFixed(0)}ms ${metrics.totalBlockingTime <= 200 ? '✅' : '❌'}`);
      
      console.log(`\n📄 Full report: ${outputPath}`);
      
      return metrics;
    }
    
  } catch (error) {
    console.warn('⚠️ Lighthouse test failed:', error.message);
    console.log('💡 Install Lighthouse: npm install -g lighthouse');
    return null;
  }
};

// Test 4: Memory Usage Test
const testMemoryUsage = async () => {
  console.log('\n💾 Testing Memory Usage...');
  console.log('==========================');
  
  try {
    const response = await fetch(`${config.testUrl}/health/detailed`);
    const health = await response.json();
    
    if (health.memory) {
      const memoryMB = Math.round(health.memory.heapUsed / 1024 / 1024);
      const totalMemoryMB = Math.round(health.memory.heapTotal / 1024 / 1024);
      
      console.log(`Heap Used: ${memoryMB}MB`);
      console.log(`Heap Total: ${totalMemoryMB}MB`);
      console.log(`Memory Efficiency: ${memoryMB <= 400 ? '✅ Excellent' : memoryMB <= 600 ? '⚠️ Good' : '❌ High'}`);
      
      return { used: memoryMB, total: totalMemoryMB };
    }
  } catch (error) {
    console.warn('⚠️ Memory test failed:', error.message);
  }
  
  return null;
};

// Generate Performance Report
const generateReport = (bundleResults, responseResults, lighthouseResults, memoryResults) => {
  const report = {
    timestamp: new Date().toISOString(),
    testUrl: config.testUrl,
    bundleAnalysis: bundleResults,
    responseTests: responseResults,
    lighthouseMetrics: lighthouseResults,
    memoryUsage: memoryResults,
    summary: {
      bundleOptimization: bundleResults.original.total > 0 ? 
        ((bundleResults.original.total - bundleResults.optimized.total) / bundleResults.original.total * 100).toFixed(1) + '%' : 'N/A',
      averageResponseTime: responseResults.filter(r => !r.error).reduce((sum, r) => sum + r.responseTime, 0) / responseResults.filter(r => !r.error).length,
      performanceScore: lighthouseResults?.performance || 'N/A',
      memoryEfficient: memoryResults?.used <= 400
    }
  };
  
  const reportPath = path.join(__dirname, 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Performance Summary:');
  console.log('=======================');
  console.log(`Bundle Optimization: ${report.summary.bundleOptimization}`);
  console.log(`Average Response Time: ${Math.round(report.summary.averageResponseTime)}ms`);
  console.log(`Performance Score: ${report.summary.performanceScore}`);
  console.log(`Memory Efficient: ${report.summary.memoryEfficient ? '✅ Yes' : '❌ No'}`);
  console.log(`\n📄 Detailed report: ${reportPath}`);
  
  return report;
};

// Main test execution
const main = async () => {
  try {
    const bundleResults = analyzeBundleSize();
    const responseResults = await testServerResponse();
    const lighthouseResults = await runLighthouseTest();
    const memoryResults = await testMemoryUsage();
    
    const report = generateReport(bundleResults, responseResults, lighthouseResults, memoryResults);
    
    console.log('\n🎉 Performance testing completed!');
    
    // Exit with appropriate code
    const hasErrors = responseResults.some(r => r.error) || 
                     (lighthouseResults && lighthouseResults.performance < 70) ||
                     (memoryResults && memoryResults.used > 600);
    
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
};

// Run the tests
main();
