/**
 * Serveur proxy pour contourner les restrictions CORS de l'API Yalidine
 * Usage: node proxy-server.js
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Configuration Yalidine API
const YALIDINE_CONFIG = {
  baseUrl: 'https://api.yalidine.app/v1',
  apiId: '53332088154627079445',
  apiToken: 'C3BpezWbhXURmYJnddfLgKKB49j1e6s1pZ8HMPT2lNSOQulb5EqMF8PQLaFrgii6'
};

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Route proxy pour Yalidine API
app.get('/api/yalidine/*', async (req, res) => {
  try {
    // Extraire le chemin de l'API
    const apiPath = req.path.replace('/api/yalidine', '');
    const queryString = new URLSearchParams(req.query).toString();
    const url = `${YALIDINE_CONFIG.baseUrl}${apiPath}${queryString ? '?' + queryString : ''}`;
    
    console.log('🔗 Proxy request to:', url);
    
    // Faire la requête à Yalidine
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-ID': YALIDINE_CONFIG.apiId,
        'X-API-TOKEN': YALIDINE_CONFIG.apiToken,
        'Content-Type': 'application/json',
        'User-Agent': 'BebeClick-Delivery-Calculator/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Yalidine API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return res.status(response.status).json({
        error: `Yalidine API Error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log('✅ Yalidine API Success:', {
      path: apiPath,
      dataSize: JSON.stringify(data).length,
      totalData: data.total_data || 'N/A'
    });
    
    res.json(data);
    
  } catch (error) {
    console.error('❌ Proxy Error:', error);
    res.status(500).json({
      error: 'Proxy Server Error',
      message: error.message
    });
  }
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

// Route de test Yalidine
app.get('/test-yalidine', async (req, res) => {
  try {
    const url = `${YALIDINE_CONFIG.baseUrl}/wilayas?page_size=1`;
    
    const response = await fetch(url, {
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
      message: 'Yalidine API accessible',
      sampleData: {
        totalWilayas: data.total_data,
        firstWilaya: data.data?.[0]?.name || 'N/A'
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
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Yalidine API: ${YALIDINE_CONFIG.baseUrl}`);
  console.log(`🔑 API ID: ${YALIDINE_CONFIG.apiId}`);
  console.log(`🧪 Test: http://localhost:${PORT}/test-yalidine`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
