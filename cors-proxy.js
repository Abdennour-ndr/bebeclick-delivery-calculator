/**
 * Serveur proxy CORS simple pour développement
 * Usage: node cors-proxy.js
 * Puis utiliser: http://localhost:3001/api/yalidine/wilayas
 */

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Configuration Yalidine
const YALIDINE_CONFIG = {
  baseUrl: 'https://api.yalidine.app/v1',
  apiId: '53332088154627079445',
  apiToken: 'C3BpezWbhXURmYJnddfLgKKB49j1e6s1pZ8HMPT2lNSOQulb5EqMF8PQLaFrgii6'
};

// Middleware CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://calc-bebeclick.fly.dev'],
  credentials: true
}));

// Middleware JSON
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Route de test
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    yalidineConfig: {
      baseUrl: YALIDINE_CONFIG.baseUrl,
      apiId: YALIDINE_CONFIG.apiId,
      hasToken: !!YALIDINE_CONFIG.apiToken
    }
  });
});

// Proxy pour Yalidine API
app.use('/api/yalidine', createProxyMiddleware({
  target: YALIDINE_CONFIG.baseUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/yalidine': '', // Supprimer /api/yalidine du chemin
  },
  onProxyReq: (proxyReq, req, res) => {
    // Ajouter les headers d'authentification
    proxyReq.setHeader('X-API-ID', YALIDINE_CONFIG.apiId);
    proxyReq.setHeader('X-API-TOKEN', YALIDINE_CONFIG.apiToken);
    proxyReq.setHeader('Content-Type', 'application/json');
    
    console.log(`🔗 Proxy: ${req.method} ${req.path} -> ${YALIDINE_CONFIG.baseUrl}${req.path.replace('/api/yalidine', '')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({
      error: 'Proxy Error',
      message: err.message
    });
  }
}));

// Route de test direct
app.get('/test-yalidine', async (req, res) => {
  try {
    
    const response = await fetch(`${YALIDINE_CONFIG.baseUrl}/wilayas?page_size=5`, {
      headers: {
        'X-API-ID': YALIDINE_CONFIG.apiId,
        'X-API-TOKEN': YALIDINE_CONFIG.apiToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json({
      success: true,
      message: 'API Yalidine accessible via proxy',
      data: {
        totalWilayas: data.total_data,
        sampleWilayas: data.data?.slice(0, 3) || []
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Yalidine API: ${YALIDINE_CONFIG.baseUrl}`);
  console.log(`🔑 API ID: ${YALIDINE_CONFIG.apiId}`);
  console.log(`\n📋 Routes disponibles:`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Test: http://localhost:${PORT}/test-yalidine`);
  console.log(`   Proxy: http://localhost:${PORT}/api/yalidine/wilayas`);
  console.log(`\n🔧 Pour utiliser dans l'app:`);
  console.log(`   Remplacer: https://api.yalidine.app/v1`);
  console.log(`   Par: http://localhost:${PORT}/api/yalidine`);
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
