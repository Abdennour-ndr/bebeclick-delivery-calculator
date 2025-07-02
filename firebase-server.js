/**
 * خادم Firebase لـ BebeClick
 */

import http from 'http';
import url from 'url';
import firebaseService from './src/services/firebaseService.js';

const PORT = 3002;

// Helper functions
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

const sendJSON = (res, data, statusCode = 200) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
};

// إنشاء الخادم
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // CORS
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
    // الصفحة الرئيسية
    if (path === '/' && method === 'GET') {
      sendJSON(res, {
        message: 'BebeClick Firebase API',
        version: '1.0.0',
        database: 'Firebase Firestore',
        status: 'running',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // فحص الصحة
    if (path === '/health' && method === 'GET') {
      try {
        const connectionTest = await firebaseService.testConnection();
        
        if (connectionTest.success) {
          sendJSON(res, {
            status: 'healthy',
            database: {
              status: 'connected',
              type: 'Firebase Firestore',
              message: connectionTest.message
            },
            timestamp: new Date().toISOString()
          });
        } else {
          sendJSON(res, {
            status: 'unhealthy',
            database: {
              status: 'error',
              error: connectionTest.error
            },
            timestamp: new Date().toISOString()
          }, 503);
        }
      } catch (error) {
        sendJSON(res, {
          status: 'unhealthy',
          error: error.message
        }, 503);
      }
      return;
    }

    // الولايات
    if (path === '/api/locations/wilayas' && method === 'GET') {
      try {
        const wilayas = await firebaseService.getWilayas();
        sendJSON(res, {
          success: true,
          data: wilayas,
          count: wilayas.length,
          source: 'firebase'
        });
      } catch (error) {
        sendJSON(res, {
          success: false,
          error: error.message
        }, 500);
      }
      return;
    }

    // البلديات
    if (path.startsWith('/api/locations/communes/') && method === 'GET') {
      try {
        const wilayaCode = parseInt(path.split('/').pop());
        const communes = await firebaseService.getCommunesByWilaya(wilayaCode);
        
        sendJSON(res, {
          success: true,
          data: communes,
          wilayaCode,
          count: communes.length,
          source: 'firebase'
        });
      } catch (error) {
        sendJSON(res, {
          success: false,
          error: error.message
        }, 500);
      }
      return;
    }

    // إضافة بلدية
    if (path === '/api/locations/commune' && method === 'POST') {
      try {
        const body = await parseJSON(req);
        const { wilayaCode, communeData } = body;
        
        const result = await firebaseService.addCommune(wilayaCode, communeData);
        
        sendJSON(res, {
          success: true,
          data: result,
          message: 'تم إضافة البلدية بنجاح',
          source: 'firebase'
        }, 201);
      } catch (error) {
        sendJSON(res, {
          success: false,
          error: error.message
        }, 500);
      }
      return;
    }

    // المنتجات
    if (path === '/api/products' && method === 'GET') {
      try {
        const searchTerm = parsedUrl.query.q || '';
        const limit = parseInt(parsedUrl.query.limit) || 50;
        
        const products = await firebaseService.searchProducts(searchTerm, limit);
        
        sendJSON(res, {
          success: true,
          data: products,
          count: products.length,
          searchTerm,
          source: 'firebase'
        });
      } catch (error) {
        sendJSON(res, {
          success: false,
          error: error.message
        }, 500);
      }
      return;
    }

    // إضافة منتج
    if (path === '/api/products' && method === 'POST') {
      try {
        const body = await parseJSON(req);
        const result = await firebaseService.saveProduct(body);
        
        sendJSON(res, {
          success: true,
          data: result,
          message: 'تم إضافة المنتج بنجاح',
          source: 'firebase'
        }, 201);
      } catch (error) {
        sendJSON(res, {
          success: false,
          error: error.message
        }, 500);
      }
      return;
    }

    // أسعار التوصيل
    if (path === '/api/delivery-pricing' && method === 'GET') {
      try {
        const service = parsedUrl.query.service || 'yalidine';
        const pricing = await firebaseService.getServicePricing(service);
        
        sendJSON(res, {
          success: true,
          data: pricing,
          count: pricing.length,
          service,
          source: 'firebase'
        });
      } catch (error) {
        sendJSON(res, {
          success: false,
          error: error.message
        }, 500);
      }
      return;
    }

    // إضافة سعر توصيل
    if (path === '/api/delivery-pricing' && method === 'POST') {
      try {
        const body = await parseJSON(req);
        const result = await firebaseService.savePricing(body);
        
        sendJSON(res, {
          success: true,
          data: result,
          message: 'تم إضافة السعر بنجاح',
          source: 'firebase'
        }, 201);
      } catch (error) {
        sendJSON(res, {
          success: false,
          error: error.message
        }, 500);
      }
      return;
    }

    // إدراج مجمع
    if (path === '/api/bulk-insert' && method === 'POST') {
      try {
        const body = await parseJSON(req);
        const { collection, data } = body;
        
        if (!collection || !data || !Array.isArray(data)) {
          sendJSON(res, {
            success: false,
            error: 'يجب تحديد collection و data (array)'
          }, 400);
          return;
        }
        
        const result = await firebaseService.bulkInsert(collection, data);
        
        sendJSON(res, {
          success: true,
          message: `تم إدراج ${result.length} عنصر في ${collection}`,
          insertedCount: result.length,
          source: 'firebase'
        }, 201);
      } catch (error) {
        sendJSON(res, {
          success: false,
          error: error.message
        }, 500);
      }
      return;
    }

    // Route غير موجود
    sendJSON(res, {
      success: false,
      error: 'المسار غير موجود',
      path,
      method,
      availableEndpoints: [
        'GET /',
        'GET /health',
        'GET /api/locations/wilayas',
        'GET /api/locations/communes/:wilayaCode',
        'POST /api/locations/commune',
        'GET /api/products',
        'POST /api/products',
        'GET /api/delivery-pricing',
        'POST /api/delivery-pricing',
        'POST /api/bulk-insert'
      ]
    }, 404);

  } catch (error) {
    console.error('❌ خطأ في الخادم:', error);
    sendJSON(res, {
      success: false,
      error: 'خطأ داخلي في الخادم',
      message: error.message
    }, 500);
  }
});

// بدء الخادم
server.listen(PORT, () => {
  console.log('🔥 خادم Firebase لـ BebeClick يعمل');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`💚 الصحة: http://localhost:${PORT}/health`);
  console.log(`🗺️ الولايات: http://localhost:${PORT}/api/locations/wilayas`);
  console.log('');
  console.log('⚠️ تأكد من إعداد قواعد Firestore للسماح بالقراءة والكتابة');
});

export default server;
