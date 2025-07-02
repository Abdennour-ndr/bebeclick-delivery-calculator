/**
 * اختبار المستخدم الجديد bebeclick_admin
 */

import { MongoClient } from 'mongodb';

const newUri = 'mongodb+srv://bebeclick_admin:BebeClick2024!@bebeclickdb.n55xdah.mongodb.net/?retryWrites=true&w=majority&appName=BebeclickDB';

console.log('🔗 اختبار المستخدم الجديد bebeclick_admin...');
console.log('📍 URI:', newUri.replace(/\/\/.*@/, '//***:***@'));

const client = new MongoClient(newUri, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
});

try {
  console.log('⏳ محاولة الاتصال (15 ثانية)...');
  
  await client.connect();
  console.log('✅ نجح الاتصال مع المستخدم الجديد!');
  
  // اختبار ping
  const adminDb = client.db('admin');
  const pingResult = await adminDb.command({ ping: 1 });
  console.log('🏓 Ping نجح:', pingResult);
  
  // اختبار قاعدة البيانات
  const db = client.db('bebeclick-delivery');
  console.log('💾 متصل بقاعدة البيانات: bebeclick-delivery');
  
  // عرض المجموعات
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
  console.log('\n🧪 اختبار الكتابة...');
  const testCollection = db.collection('connection_test');
  
  const testDoc = {
    message: 'اختبار المستخدم الجديد bebeclick_admin',
    timestamp: new Date(),
    user: 'bebeclick_admin',
    status: 'success'
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
  console.log('✅ MongoDB Atlas يعمل مع المستخدم الجديد');
  console.log('✅ يمكن الآن استخدام قاعدة البيانات الحقيقية');
  
} catch (error) {
  console.error('❌ خطأ مع المستخدم الجديد:', error.message);
  
  if (error.message.includes('authentication')) {
    console.log('\n🔐 مشكلة مصادقة:');
    console.log('- تحقق من اسم المستخدم: bebeclick_admin');
    console.log('- تحقق من كلمة المرور: BebeClick2024!');
    console.log('- تأكد من صلاحيات atlasAdmin');
  }
  
  if (error.message.includes('timeout')) {
    console.log('\n⏰ مشكلة شبكة:');
    console.log('- قد تحتاج بضع دقائق لتفعيل المستخدم الجديد');
    console.log('- تحقق من أن الـ Cluster يعمل');
    console.log('- تأكد من Network Access');
  }
  
  console.log('\n💡 اقتراحات:');
  console.log('1. انتظر 2-3 دقائق وأعد المحاولة');
  console.log('2. تحقق من أن الـ Cluster ليس متوقف (Paused)');
  console.log('3. تأكد من إعدادات Network Access');
  
} finally {
  await client.close();
  console.log('👋 تم إغلاق الاتصال');
}
