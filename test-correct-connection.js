/**
 * اختبار مع connection string الصحيح
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔗 اختبار MongoDB Atlas مع الإعدادات الصحيحة...');

const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
});

try {
  console.log('⏳ محاولة الاتصال...');
  await client.connect();
  console.log('✅ نجح الاتصال مع MongoDB Atlas!');
  
  // اختبار ping
  const adminDb = client.db('admin');
  const pingResult = await adminDb.command({ ping: 1 });
  console.log('🏓 Ping نجح:', pingResult);
  
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
  
  // إنشاء مجموعة اختبار
  console.log('\n🧪 اختبار الكتابة...');
  const testCollection = db.collection('connection_test');
  
  const testDoc = {
    message: 'اختبار اتصال BebeClick ناجح',
    timestamp: new Date(),
    version: '1.0',
    status: 'connected'
  };
  
  const insertResult = await testCollection.insertOne(testDoc);
  console.log('✅ تم إدراج وثيقة اختبار:', insertResult.insertedId);
  
  // قراءة الوثيقة
  const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
  console.log('✅ تم قراءة الوثيقة:', foundDoc.message);
  
  // حذف الوثيقة التجريبية
  await testCollection.deleteOne({ _id: insertResult.insertedId });
  console.log('✅ تم تنظيف البيانات التجريبية');
  
  console.log('\n🎉 جميع الاختبارات نجحت!');
  console.log('✅ MongoDB Atlas جاهز للاستخدام');
  console.log('✅ يمكن الآن تشغيل الخادم الحقيقي');
  
} catch (error) {
  console.error('❌ خطأ في الاتصال:', error.message);
  
  if (error.message.includes('authentication')) {
    console.log('\n🔐 مشكلة مصادقة:');
    console.log('- تحقق من اسم المستخدم: inncomm16');
    console.log('- تحقق من كلمة المرور: mDrRFM2wZO8NOyjA');
    console.log('- تأكد من وجود المستخدم في Database Access');
  }
  
  if (error.message.includes('timeout')) {
    console.log('\n⏰ مشكلة شبكة:');
    console.log('- تحقق من Network Access (0.0.0.0/0)');
    console.log('- تأكد من أن الـ Cluster يعمل');
  }
  
} finally {
  await client.close();
  console.log('👋 تم إغلاق الاتصال');
}
