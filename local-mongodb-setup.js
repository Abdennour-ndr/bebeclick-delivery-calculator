/**
 * إعداد MongoDB محلي كبديل مؤقت
 */

import { MongoClient } from 'mongodb';

// جرب الاتصال المحلي أولاً
const localUri = 'mongodb://localhost:27017/bebeclick-delivery';

const testLocalMongoDB = async () => {
  console.log('🔍 البحث عن MongoDB محلي...');
  
  const client = new MongoClient(localUri, {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
  });

  try {
    await client.connect();
    console.log('✅ تم العثور على MongoDB محلي!');
    
    const db = client.db('bebeclick-delivery');
    await db.admin().ping();
    console.log('🏓 MongoDB المحلي يعمل بشكل مثالي');
    
    return true;
    
  } catch (error) {
    console.log('❌ MongoDB محلي غير متاح:', error.message);
    return false;
    
  } finally {
    await client.close();
  }
};

// إنشاء نظام ملفات JSON كبديل
const createJSONDatabase = () => {
  console.log('📁 إنشاء نظام قاعدة بيانات JSON...');
  
  const fs = await import('fs');
  const path = await import('path');
  
  const dbDir = './json-database';
  
  // إنشاء مجلد قاعدة البيانات
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✅ تم إنشاء مجلد قاعدة البيانات');
  }
  
  // إنشاء ملفات JSON للمجموعات
  const collections = {
    locations: [],
    products: [],
    delivery_pricing: [],
    orders: [],
    users: []
  };
  
  for (const [name, data] of Object.entries(collections)) {
    const filePath = path.join(dbDir, `${name}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✅ تم إنشاء ملف: ${name}.json`);
    }
  }
  
  // إنشاء ملف إعدادات
  const config = {
    database: 'json-files',
    version: '1.0',
    created: new Date().toISOString(),
    collections: Object.keys(collections)
  };
  
  fs.writeFileSync(path.join(dbDir, 'config.json'), JSON.stringify(config, null, 2));
  console.log('✅ تم إنشاء ملف الإعدادات');
  
  return true;
};

const setupDatabase = async () => {
  console.log('🚀 إعداد قاعدة البيانات...');
  console.log('=' .repeat(50));
  
  // جرب MongoDB محلي أولاً
  const localAvailable = await testLocalMongoDB();
  
  if (localAvailable) {
    console.log('\n🎉 سيتم استخدام MongoDB المحلي');
    console.log('📍 URI: mongodb://localhost:27017/bebeclick-delivery');
    return 'local-mongodb';
  }
  
  // إذا لم يكن متاحاً، أنشئ نظام JSON
  console.log('\n📁 إنشاء نظام قاعدة بيانات JSON...');
  const jsonCreated = await createJSONDatabase();
  
  if (jsonCreated) {
    console.log('\n🎉 تم إنشاء نظام قاعدة بيانات JSON');
    console.log('📍 المجلد: ./json-database/');
    return 'json-files';
  }
  
  console.log('\n❌ فشل في إعداد أي نوع من قواعد البيانات');
  return null;
};

setupDatabase();
