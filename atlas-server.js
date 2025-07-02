/**
 * خادم MongoDB Atlas بدون Express (HTTP خام)
 */

import http from 'http';
import url from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3001;
let mongoClient = null;
let db = null;

// الاتصال بـ MongoDB Atlas
const connectToMongoDB = async () => {
  try {
    console.log('🔗 الاتصال بـ MongoDB Atlas...');
    
    mongoClient = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    
    await mongoClient.connect();
    db = mongoClient.db('bebeclick-delivery');
    
    console.log('✅ تم الاتصال بـ MongoDB Atlas بنجاح!');
    console.log('💾 قاعدة البيانات: bebeclick-delivery');
    
    // اختبار ping
    await db.admin().ping();
    console.log('🏓 Ping نجح - قاعدة البيانات تعمل');
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في الاتصال بـ MongoDB Atlas:', error.message);
    return false;
  }
};

// Helper لـ JSON
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

// Helper للاستجابة
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
        message: 'BebeClick MongoDB Atlas API',
        version: '1.0.0',
        database: db ? 'Connected to Atlas' : 'Disconnected',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // فحص الصحة
    if (path === '/health' && method === 'GET') {
      if (!db) {
        sendJSON(res, {
          status: 'unhealthy',
          database: 'disconnected',
          message: 'قاعدة البيانات غير متصلة'
        }, 503);
        return;
      }

      try {
        await db.admin().ping();
        sendJSON(res, {
          status: 'healthy',
          database: {
            status: 'connected',
            name: 'bebeclick-delivery',
            host: 'MongoDB Atlas'
          },
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        });
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
      if (!db) {
        sendJSON(res, { success: false, error: 'قاعدة البيانات غير متصلة' }, 503);
        return;
      }

      const wilayas = await db.collection('locations')
        .find({ type: 'wilaya' })
        .sort({ code: 1 })
        .toArray();

      sendJSON(res, {
        success: true,
        data: wilayas,
        count: wilayas.length,
        source: 'mongodb-atlas'
      });
      return;
    }

    // البلديات
    if (path.startsWith('/api/locations/communes/') && method === 'GET') {
      if (!db) {
        sendJSON(res, { success: false, error: 'قاعدة البيانات غير متصلة' }, 503);
        return;
      }

      const wilayaCode = parseInt(path.split('/').pop());
      const communes = await db.collection('locations')
        .find({ 
          type: 'commune',
          'hierarchy.wilayaCode': wilayaCode
        })
        .sort({ name: 1 })
        .toArray();

      sendJSON(res, {
        success: true,
        data: communes,
        wilayaCode,
        count: communes.length,
        source: 'mongodb-atlas'
      });
      return;
    }

    // إضافة بلدية
    if (path === '/api/locations/commune' && method === 'POST') {
      if (!db) {
        sendJSON(res, { success: false, error: 'قاعدة البيانات غير متصلة' }, 503);
        return;
      }

      const body = await parseJSON(req);
      const { wilayaCode, communeData } = body;

      const fullCommuneData = {
        ...communeData,
        type: 'commune',
        hierarchy: {
          wilayaCode: wilayaCode,
          wilayaName: communeData.wilayaName || 'غير محدد'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('locations').insertOne(fullCommuneData);

      sendJSON(res, {
        success: true,
        data: { _id: result.insertedId, ...fullCommuneData },
        message: 'تم إضافة البلدية بنجاح',
        source: 'mongodb-atlas'
      }, 201);
      return;
    }

    // المنتجات
    if (path === '/api/products' && method === 'GET') {
      if (!db) {
        sendJSON(res, { success: false, error: 'قاعدة البيانات غير متصلة' }, 503);
        return;
      }

      const limit = parseInt(parsedUrl.query.limit) || 50;
      const products = await db.collection('products')
        .find({ status: { $ne: 'deleted' } })
        .limit(limit)
        .toArray();

      sendJSON(res, {
        success: true,
        data: products,
        count: products.length,
        source: 'mongodb-atlas'
      });
      return;
    }

    // إضافة منتج
    if (path === '/api/products' && method === 'POST') {
      if (!db) {
        sendJSON(res, { success: false, error: 'قاعدة البيانات غير متصلة' }, 503);
        return;
      }

      const body = await parseJSON(req);
      const productData = {
        ...body,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('products').insertOne(productData);

      sendJSON(res, {
        success: true,
        data: { _id: result.insertedId, ...productData },
        message: 'تم إضافة المنتج بنجاح',
        source: 'mongodb-atlas'
      }, 201);
      return;
    }

    // أسعار التوصيل
    if (path === '/api/delivery-pricing' && method === 'GET') {
      if (!db) {
        sendJSON(res, { success: false, error: 'قاعدة البيانات غير متصلة' }, 503);
        return;
      }

      const pricing = await db.collection('delivery_pricing')
        .find({ status: 'active' })
        .limit(50)
        .toArray();

      sendJSON(res, {
        success: true,
        data: pricing,
        count: pricing.length,
        source: 'mongodb-atlas'
      });
      return;
    }

    // إضافة سعر توصيل
    if (path === '/api/delivery-pricing' && method === 'POST') {
      if (!db) {
        sendJSON(res, { success: false, error: 'قاعدة البيانات غير متصلة' }, 503);
        return;
      }

      const body = await parseJSON(req);
      const pricingData = {
        ...body,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('delivery_pricing').insertOne(pricingData);

      sendJSON(res, {
        success: true,
        data: { _id: result.insertedId, ...pricingData },
        message: 'تم إضافة السعر بنجاح',
        source: 'mongodb-atlas'
      }, 201);
      return;
    }

    // اختبار الاتصال
    if (path === '/api/test-connection' && method === 'GET') {
      if (!db) {
        sendJSON(res, { success: false, error: 'قاعدة البيانات غير متصلة' }, 503);
        return;
      }

      try {
        await db.admin().ping();
        const collections = await db.listCollections().toArray();
        
        sendJSON(res, {
          success: true,
          message: 'اتصال MongoDB Atlas ناجح',
          database: 'bebeclick-delivery',
          collections: collections.map(c => c.name),
          timestamp: new Date().toISOString()
        });
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
      method
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
const startServer = async () => {
  console.log('🚀 بدء خادم BebeClick MongoDB Atlas...');
  
  const connected = await connectToMongoDB();
  
  server.listen(PORT, () => {
    console.log(`✅ الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`💚 الصحة: http://localhost:${PORT}/health`);
    console.log(`🧪 اختبار: http://localhost:${PORT}/api/test-connection`);
    
    if (connected) {
      console.log('🎉 متصل بـ MongoDB Atlas - جاهز للاستخدام!');
    } else {
      console.log('⚠️ الخادم يعمل بدون قاعدة بيانات');
    }
  });
};

// إغلاق نظيف
process.on('SIGINT', async () => {
  console.log('\n🛑 إيقاف الخادم...');
  if (mongoClient) {
    await mongoClient.close();
    console.log('👋 تم إغلاق اتصال MongoDB');
  }
  process.exit(0);
});

startServer();
