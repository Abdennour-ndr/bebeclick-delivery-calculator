/**
 * اختبار MongoDB Atlas الجديد
 */

import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const testNewCluster = async () => {
  const uri = process.env.MONGODB_URI;
  
  console.log('🚀 اختبار MongoDB Atlas الجديد...');
  console.log('📍 Cluster: BebeClick-Cluster');
  console.log('👤 المستخدم: bebeclick_user');
  console.log('🔗 URI:', uri.replace(/\/\/.*@/, '//***:***@'));
  
  // إنشاء client مع Stable API
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log('\n⏳ محاولة الاتصال...');
    
    // الاتصال بالخادم
    await client.connect();
    console.log('✅ تم الاتصال بنجاح!');
    
    // اختبار ping
    await client.db("admin").command({ ping: 1 });
    console.log('🏓 Ping نجح - MongoDB Atlas يعمل!');
    
    // اختبار قاعدة البيانات
    const db = client.db('bebeclick-delivery');
    console.log('💾 متصل بقاعدة البيانات: bebeclick-delivery');
    
    // عرض المجموعات الموجودة
    const collections = await db.listCollections().toArray();
    console.log(`📋 المجموعات الموجودة: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('📂 أسماء المجموعات:');
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    } else {
      console.log('📭 قاعدة البيانات فارغة (جاهزة للاستخدام)');
    }
    
    // اختبار الكتابة
    console.log('\n🧪 اختبار الكتابة والقراءة...');
    const testCollection = db.collection('connection_test');
    
    const testDoc = {
      message: 'اختبار BebeClick Atlas الجديد',
      timestamp: new Date(),
      cluster: 'BebeClick-Cluster',
      user: 'bebeclick_user',
      status: 'success',
      version: '1.0'
    };
    
    // إدراج وثيقة
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ تم إدراج وثيقة اختبار:', insertResult.insertedId);
    
    // قراءة الوثيقة
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ تم قراءة الوثيقة:', foundDoc.message);
    
    // تحديث الوثيقة
    await testCollection.updateOne(
      { _id: insertResult.insertedId },
      { $set: { updated: true, updateTime: new Date() } }
    );
    console.log('✅ تم تحديث الوثيقة');
    
    // حذف الوثيقة التجريبية
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ تم حذف الوثيقة التجريبية');
    
    // اختبار إنشاء مجموعات المشروع
    console.log('\n📦 إنشاء مجموعات المشروع...');
    
    const collections_to_create = [
      'locations',      // الولايات والبلديات
      'products',       // المنتجات
      'delivery_pricing', // أسعار التوصيل
      'orders',         // الطلبات (للمستقبل)
      'users'           // المستخدمين (للمستقبل)
    ];
    
    for (const collectionName of collections_to_create) {
      await db.createCollection(collectionName);
      console.log(`  ✅ تم إنشاء مجموعة: ${collectionName}`);
    }
    
    // إنشاء فهارس أساسية
    console.log('\n🔍 إنشاء فهارس أساسية...');
    
    // فهرس للمواقع
    await db.collection('locations').createIndex({ type: 1, code: 1 });
    await db.collection('locations').createIndex({ 'hierarchy.wilayaCode': 1 });
    console.log('  ✅ فهارس المواقع');
    
    // فهرس للمنتجات
    await db.collection('products').createIndex({ sku: 1 }, { unique: true });
    await db.collection('products').createIndex({ name: 'text', brand: 'text' });
    console.log('  ✅ فهارس المنتجات');
    
    // فهرس لأسعار التوصيل
    await db.collection('delivery_pricing').createIndex({ service: 1, wilayaCode: 1, commune: 1 });
    console.log('  ✅ فهارس أسعار التوصيل');
    
    console.log('\n🎉 جميع الاختبارات نجحت!');
    console.log('✅ MongoDB Atlas الجديد جاهز للاستخدام');
    console.log('✅ قاعدة البيانات مُعدة ومُفهرسة');
    console.log('✅ يمكن الآن تشغيل النظام الحقيقي');
    
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n🔐 مشكلة مصادقة:');
      console.log('- تحقق من اسم المستخدم: bebeclick_user');
      console.log('- تحقق من كلمة المرور: BebeClick2025!');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n⏰ مشكلة شبكة:');
      console.log('- تحقق من Network Access في Atlas');
      console.log('- تأكد من أن الـ Cluster يعمل');
    }
    
    return false;
    
  } finally {
    await client.close();
    console.log('\n👋 تم إغلاق الاتصال');
  }
};

testNewCluster();
