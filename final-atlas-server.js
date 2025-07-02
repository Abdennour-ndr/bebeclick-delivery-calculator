/**
 * خادم MongoDB Atlas النهائي لـ BebeClick
 * يستخدم الـ cluster الجديد: BebeClick-Cluster
 */

import http from 'http';
import url from 'url';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3001;
let mongoClient = null;
let db = null;
let connectionStatus = 'disconnected';

// الاتصال بـ MongoDB Atlas الجديد
const connectToAtlas = async () => {
  try {
    console.log('🔗 الاتصال بـ MongoDB Atlas الجديد...');
    console.log('📍 Cluster: BebeClick-Cluster');
    console.log('👤 المستخدم: bebeclick_user');
    
    const uri = process.env.MONGODB_URI;
    console.log('🌐 URI:', uri.replace(/\/\/.*@/, '//***:***@'));
    
    mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
    });
    
    await mongoClient.connect();
    console.log('✅ تم الاتصال بـ MongoDB Atlas!');
    
    // اختبار ping
    await mongoClient.db("admin").command({ ping: 1 });
    console.log('🏓 Ping نجح!');
    
    db = mongoClient.db('bebeclick-delivery');
    connectionStatus = 'connected';
    
    console.log('💾 قاعدة البيانات: bebeclick-delivery');
    
    // إنشاء المجموعات الأساسية
    await initializeCollections();
    
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    connectionStatus = 'error';
    
    if (error.message.includes('timeout')) {
      console.log('⏰ مشكلة timeout - قد يحتاج الـ cluster وقت إضافي');
    }
    
    if (error.message.includes('authentication')) {
      console.log('🔐 مشكلة مصادقة - تحقق من المستخدم وكلمة المرور');
    }
    
    return false;
  }
};

// إنشاء المجموعات الأساسية
const initializeCollections = async () => {
  try {
    console.log('📦 إنشاء المجموعات الأساسية...');
    
    const collections = await db.listCollections().toArray();
    const existingNames = collections.map(c => c.name);
    
    const requiredCollections = [
      'locations',
      'products', 
      'delivery_pricing',
      'orders',
      'users'
    ];
    
    for (const collectionName of requiredCollections) {
      if (!existingNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`  ✅ تم إنشاء: ${collectionName}`);
      } else {
        console.log(`  📋 موجود: ${collectionName}`);
      }
    }
    
    // إنشاء فهارس أساسية
    await createIndexes();
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المجموعات:', error.message);
  }
};

// إنشاء فهارس
const createIndexes = async () => {
  try {
    console.log('🔍 إنشاء فهارس...');
    
    // فهارس المواقع
    await db.collection('locations').createIndex({ type: 1, code: 1 });
    await db.collection('locations').createIndex({ 'hierarchy.wilayaCode': 1 });
    
    // فهارس المنتجات
    await db.collection('products').createIndex({ sku: 1 }, { unique: true });
    await db.collection('products').createIndex({ name: 'text', brand: 'text' });
    
    // فهارس أسعار التوصيل
    await db.collection('delivery_pricing').createIndex({ 
      service: 1, 
      wilayaCode: 1, 
      commune: 1 
    });
    
    console.log('✅ تم إنشاء الفهارس');
    
  } catch (error) {
    console.log('⚠️ تحذير: بعض الفهارس موجودة مسبقاً');
  }
};

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
        message: 'BebeClick MongoDB Atlas API - Final Version',
        version: '2.0.0',
        cluster: 'BebeClick-Cluster',
        database: connectionStatus === 'connected' ? 'Connected to Atlas' : 'Disconnected',
        status: connectionStatus,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // فحص الصحة
    if (path === '/health' && method === 'GET') {
      if (connectionStatus !== 'connected' || !db) {
        sendJSON(res, {
          status: 'unhealthy',
          database: connectionStatus,
          message: 'قاعدة البيانات غير متصلة',
          cluster: 'BebeClick-Cluster'
        }, 503);
        return;
      }

      try {
        await db.admin().ping();
        const collections = await db.listCollections().toArray();
        
        sendJSON(res, {
          status: 'healthy',
          database: {
            status: 'connected',
            name: 'bebeclick-delivery',
            cluster: 'BebeClick-Cluster',
            collections: collections.length
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

    // اختبار الاتصال المفصل
    if (path === '/api/test-connection' && method === 'GET') {
      if (!db) {
        sendJSON(res, { 
          success: false, 
          error: 'قاعدة البيانات غير متصلة',
          status: connectionStatus 
        }, 503);
        return;
      }

      try {
        await db.admin().ping();
        const collections = await db.listCollections().toArray();
        const stats = await db.stats();
        
        sendJSON(res, {
          success: true,
          message: 'اتصال MongoDB Atlas ناجح',
          cluster: 'BebeClick-Cluster',
          database: 'bebeclick-delivery',
          collections: collections.map(c => ({
            name: c.name,
            type: c.type
          })),
          stats: {
            collections: stats.collections,
            dataSize: stats.dataSize,
            storageSize: stats.storageSize
          },
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
        source: 'mongodb-atlas-final'
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
        source: 'mongodb-atlas-final'
      });
      return;
    }

    // إضافة بيانات (ولايات، بلديات، منتجات، أسعار)
    if (path === '/api/bulk-insert' && method === 'POST') {
      if (!db) {
        sendJSON(res, { success: false, error: 'قاعدة البيانات غير متصلة' }, 503);
        return;
      }

      const body = await parseJSON(req);
      const { collection, data } = body;

      if (!collection || !data || !Array.isArray(data)) {
        sendJSON(res, { 
          success: false, 
          error: 'يجب تحديد collection و data (array)' 
        }, 400);
        return;
      }

      const result = await db.collection(collection).insertMany(data);

      sendJSON(res, {
        success: true,
        message: `تم إدراج ${result.insertedCount} عنصر في ${collection}`,
        insertedCount: result.insertedCount,
        insertedIds: Object.values(result.insertedIds)
      }, 201);
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
        'GET /api/test-connection',
        'GET /api/locations/wilayas',
        'GET /api/locations/communes/:wilayaCode',
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
const startServer = async () => {
  console.log('🚀 بدء خادم BebeClick MongoDB Atlas النهائي...');
  console.log('=' .repeat(60));
  
  // محاولة الاتصال بقاعدة البيانات
  const connected = await connectToAtlas();
  
  server.listen(PORT, () => {
    console.log(`\n✅ الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`💚 الصحة: http://localhost:${PORT}/health`);
    console.log(`🧪 اختبار: http://localhost:${PORT}/api/test-connection`);
    
    if (connected) {
      console.log('🎉 متصل بـ MongoDB Atlas - جاهز للاستخدام!');
      console.log('📊 يمكن الآن تعبئة البيانات');
    } else {
      console.log('⚠️ الخادم يعمل بدون قاعدة بيانات');
      console.log('🔄 سيعيد المحاولة تلقائياً');
    }
  });
};

// إعادة محاولة الاتصال
const retryConnection = async () => {
  if (connectionStatus !== 'connected') {
    console.log('\n🔄 إعادة محاولة الاتصال...');
    await connectToAtlas();
  }
};

// إعادة المحاولة كل دقيقة
setInterval(retryConnection, 60000);

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
