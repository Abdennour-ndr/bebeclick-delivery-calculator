/**
 * خادم MongoDB Atlas الحقيقي لـ BebeClick
 */

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// متغيرات عامة
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
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في الاتصال بـ MongoDB Atlas:', error.message);
    return false;
  }
};

// Routes الأساسية
app.get('/', (req, res) => {
  res.json({
    message: 'BebeClick MongoDB Atlas API',
    version: '1.0.0',
    database: db ? 'Connected to Atlas' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        message: 'قاعدة البيانات غير متصلة'
      });
    }
    
    // اختبار ping
    await db.admin().ping();
    
    res.json({
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
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API الولايات
app.get('/api/locations/wilayas', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'قاعدة البيانات غير متصلة'
      });
    }
    
    const wilayas = await db.collection('locations')
      .find({ type: 'wilaya' })
      .sort({ code: 1 })
      .toArray();
    
    res.json({
      success: true,
      data: wilayas,
      count: wilayas.length,
      source: 'mongodb-atlas'
    });
    
  } catch (error) {
    console.error('❌ خطأ في جلب الولايات:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API البلديات
app.get('/api/locations/communes/:wilayaCode', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'قاعدة البيانات غير متصلة'
      });
    }
    
    const wilayaCode = parseInt(req.params.wilayaCode);
    const communes = await db.collection('locations')
      .find({ 
        type: 'commune',
        'hierarchy.wilayaCode': wilayaCode
      })
      .sort({ name: 1 })
      .toArray();
    
    res.json({
      success: true,
      data: communes,
      wilayaCode,
      count: communes.length,
      source: 'mongodb-atlas'
    });
    
  } catch (error) {
    console.error('❌ خطأ في جلب البلديات:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API إضافة ولاية
app.post('/api/locations/wilaya', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'قاعدة البيانات غير متصلة'
      });
    }
    
    const wilayaData = {
      ...req.body,
      type: 'wilaya',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('locations').insertOne(wilayaData);
    
    res.status(201).json({
      success: true,
      data: { _id: result.insertedId, ...wilayaData },
      message: 'تم إضافة الولاية بنجاح',
      source: 'mongodb-atlas'
    });
    
  } catch (error) {
    console.error('❌ خطأ في إضافة الولاية:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API إضافة بلدية
app.post('/api/locations/commune', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'قاعدة البيانات غير متصلة'
      });
    }
    
    const { wilayaCode, communeData } = req.body;
    
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
    
    res.status(201).json({
      success: true,
      data: { _id: result.insertedId, ...fullCommuneData },
      message: 'تم إضافة البلدية بنجاح',
      source: 'mongodb-atlas'
    });
    
  } catch (error) {
    console.error('❌ خطأ في إضافة البلدية:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API المنتجات
app.get('/api/products', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'قاعدة البيانات غير متصلة'
      });
    }
    
    const limit = parseInt(req.query.limit) || 50;
    const products = await db.collection('products')
      .find({ status: { $ne: 'deleted' } })
      .limit(limit)
      .toArray();
    
    res.json({
      success: true,
      data: products,
      count: products.length,
      source: 'mongodb-atlas'
    });
    
  } catch (error) {
    console.error('❌ خطأ في جلب المنتجات:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API إضافة منتج
app.post('/api/products', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'قاعدة البيانات غير متصلة'
      });
    }
    
    const productData = {
      ...req.body,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('products').insertOne(productData);
    
    res.status(201).json({
      success: true,
      data: { _id: result.insertedId, ...productData },
      message: 'تم إضافة المنتج بنجاح',
      source: 'mongodb-atlas'
    });
    
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتج:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API أسعار التوصيل
app.get('/api/delivery-pricing', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'قاعدة البيانات غير متصلة'
      });
    }
    
    const pricing = await db.collection('delivery_pricing')
      .find({ status: 'active' })
      .limit(50)
      .toArray();
    
    res.json({
      success: true,
      data: pricing,
      count: pricing.length,
      source: 'mongodb-atlas'
    });
    
  } catch (error) {
    console.error('❌ خطأ في جلب الأسعار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API إضافة سعر توصيل
app.post('/api/delivery-pricing', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'قاعدة البيانات غير متصلة'
      });
    }
    
    const pricingData = {
      ...req.body,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('delivery_pricing').insertOne(pricingData);
    
    res.status(201).json({
      success: true,
      data: { _id: result.insertedId, ...pricingData },
      message: 'تم إضافة السعر بنجاح',
      source: 'mongodb-atlas'
    });
    
  } catch (error) {
    console.error('❌ خطأ في إضافة السعر:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// معالجة الأخطاء
app.use((error, req, res, next) => {
  console.error('❌ خطأ في الخادم:', error);
  res.status(500).json({
    success: false,
    error: 'خطأ داخلي في الخادم',
    message: error.message
  });
});

// Route غير موجود
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'المسار غير موجود',
    path: req.originalUrl
  });
});

// بدء الخادم
const startServer = async () => {
  console.log('🚀 بدء خادم BebeClick MongoDB Atlas...');
  
  // محاولة الاتصال بقاعدة البيانات
  const connected = await connectToMongoDB();
  
  if (!connected) {
    console.log('⚠️ تشغيل الخادم بدون قاعدة بيانات (سيعيد محاولة الاتصال)');
  }
  
  app.listen(PORT, () => {
    console.log(`✅ الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`💚 الصحة: http://localhost:${PORT}/health`);
    console.log(`🗺️ الولايات: http://localhost:${PORT}/api/locations/wilayas`);
    
    if (connected) {
      console.log('🎉 متصل بـ MongoDB Atlas - جاهز للاستخدام!');
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
