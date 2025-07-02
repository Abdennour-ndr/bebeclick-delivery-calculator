/**
 * Serveur de démonstration pour BebeClick avec MongoDB simulé
 */

import http from 'http';
import url from 'url';
import mockMongoService from './src/services/mockMongoService.js';

const PORT = 3001;

// Helper pour parser JSON
const parseJSON = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Helper pour les réponses JSON
const sendJSON = (res, data, statusCode = 200) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
};

// Créer le serveur
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  try {
    // Routes principales
    if (path === '/' && method === 'GET') {
      sendJSON(res, {
        message: 'BebeClick MongoDB Demo API',
        version: '1.0.0',
        status: 'running',
        mock: true,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (path === '/health' && method === 'GET') {
      const health = await mockMongoService.checkHealth();
      sendJSON(res, {
        status: health.overall ? 'healthy' : 'unhealthy',
        services: health,
        mock: true,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // API Delivery Pricing
    if (path === '/api/delivery-pricing' && method === 'GET') {
      const pricing = await mockMongoService.getServicePricing('yalidine');
      sendJSON(res, {
        success: true,
        data: pricing,
        count: pricing.length,
        mock: true
      });
      return;
    }

    if (path === '/api/delivery-pricing' && method === 'POST') {
      const body = await parseJSON(req);
      const result = await mockMongoService.savePricing(body);
      sendJSON(res, {
        success: true,
        data: result,
        message: 'Prix ajouté avec succès (simulation)',
        mock: true
      }, 201);
      return;
    }

    if (path === '/api/delivery-pricing/stats' && method === 'GET') {
      const stats = await mockMongoService.getStats();
      sendJSON(res, {
        success: true,
        data: stats,
        mock: true
      });
      return;
    }

    // API Products
    if (path === '/api/products' && method === 'GET') {
      const products = await mockMongoService.searchProducts('', 50);
      sendJSON(res, {
        success: true,
        data: products,
        count: products.length,
        mock: true
      });
      return;
    }

    if (path === '/api/products/search' && method === 'GET') {
      const searchTerm = parsedUrl.query.q || '';
      const products = await mockMongoService.searchProducts(searchTerm);
      sendJSON(res, {
        success: true,
        data: products,
        count: products.length,
        searchTerm,
        mock: true
      });
      return;
    }

    if (path === '/api/products' && method === 'POST') {
      const body = await parseJSON(req);
      const result = await mockMongoService.saveProduct(body);
      sendJSON(res, {
        success: true,
        data: result,
        message: 'Produit ajouté avec succès (simulation)',
        mock: true
      }, 201);
      return;
    }

    // API Locations
    if (path === '/api/locations/wilayas' && method === 'GET') {
      const wilayas = await mockMongoService.getWilayas();
      sendJSON(res, {
        success: true,
        data: wilayas,
        count: wilayas.length,
        mock: true
      });
      return;
    }

    if (path.startsWith('/api/locations/communes/') && method === 'GET') {
      const wilayaCode = parseInt(path.split('/').pop());
      const communes = await mockMongoService.getCommunesByWilaya(wilayaCode);
      sendJSON(res, {
        success: true,
        data: communes,
        wilayaCode,
        count: communes.length,
        mock: true
      });
      return;
    }

    if (path === '/api/locations/commune' && method === 'POST') {
      const body = await parseJSON(req);
      const result = await mockMongoService.addCommune(body.wilayaCode, body.communeData);
      sendJSON(res, {
        success: true,
        data: result,
        message: 'Commune ajoutée avec succès (simulation)',
        mock: true
      }, 201);
      return;
    }

    if (path === '/api/locations/initialize-algeria' && method === 'POST') {
      // Simulation d'initialisation
      const wilayas = [
        { code: 1, name: 'Adrar', nameAr: 'أدرار' },
        { code: 2, name: 'Chlef', nameAr: 'الشلف' },
        { code: 3, name: 'Laghouat', nameAr: 'الأغواط' },
        { code: 16, name: 'Alger', nameAr: 'الجزائر' },
        { code: 31, name: 'Oran', nameAr: 'وهران' },
        { code: 25, name: 'Constantine', nameAr: 'قسنطينة' }
      ];

      sendJSON(res, {
        success: true,
        data: wilayas.map(w => ({ success: true, data: w })),
        summary: {
          total: wilayas.length,
          success: wilayas.length,
          errors: 0
        },
        message: `${wilayas.length} wilayas initialisées (simulation)`,
        mock: true
      });
      return;
    }

    // Route de test spéciale
    if (path === '/api/test-mongo' && method === 'GET') {
      const testResult = await mockMongoService.getDeliveryPrice('Alger Centre, Alger', 'home', 2, {}, 25000);
      sendJSON(res, {
        success: true,
        message: 'Test MongoDB simulé réussi',
        testResult,
        mock: true
      });
      return;
    }

    // Route non trouvée
    sendJSON(res, {
      success: false,
      error: 'Route non trouvée',
      path,
      method,
      mock: true
    }, 404);

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    sendJSON(res, {
      success: false,
      error: 'Erreur interne du serveur',
      message: error.message,
      mock: true
    }, 500);
  }
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log('🚀 Serveur de démonstration BebeClick démarré');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🎭 Mode: MongoDB Simulé (Demo)`);
  console.log(`📋 Test: http://localhost:${PORT}/api/test-mongo`);
  console.log(`💚 Santé: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📊 APIs disponibles:');
  console.log('  GET  /api/delivery-pricing');
  console.log('  POST /api/delivery-pricing');
  console.log('  GET  /api/products');
  console.log('  GET  /api/products/search?q=term');
  console.log('  POST /api/products');
  console.log('  GET  /api/locations/wilayas');
  console.log('  GET  /api/locations/communes/:wilayaCode');
  console.log('  POST /api/locations/commune');
  console.log('  POST /api/locations/initialize-algeria');
});

export default server;
