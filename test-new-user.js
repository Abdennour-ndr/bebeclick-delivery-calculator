/**
 * اختبار مع مستخدم جديد
 */

import { MongoClient } from 'mongodb';

// جرب مع المستخدم الجديد
const newUri = 'mongodb+srv://bebeclick_admin:BebeClick2024!@bebeclickdb.n55xdah.mongodb.net/bebeclick-delivery?retryWrites=true&w=majority&appName=BebeclickDB';

console.log('🔗 اختبار مع مستخدم جديد...');

const client = new MongoClient(newUri, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
});

try {
  console.log('⏳ محاولة الاتصال (15 ثانية)...');
  await client.connect();
  console.log('✅ نجح الاتصال مع المستخدم الجديد!');
  
  const db = client.db('bebeclick-delivery');
  await db.admin().ping();
  console.log('🏓 Ping نجح!');
  
  // إنشاء مجموعة اختبار
  const testCollection = db.collection('test_connection');
  const result = await testCollection.insertOne({
    message: 'اختبار اتصال ناجح',
    timestamp: new Date(),
    user: 'bebeclick_admin'
  });
  
  console.log('✅ تم إدراج وثيقة اختبار:', result.insertedId);
  
  // قراءة الوثيقة
  const doc = await testCollection.findOne({ _id: result.insertedId });
  console.log('✅ تم قراءة الوثيقة:', doc.message);
  
  console.log('\n🎉 MongoDB Atlas يعمل بشكل مثالي!');
  console.log('✅ يمكنك الآن استخدام قاعدة البيانات الحقيقية');
  
} catch (error) {
  console.error('❌ خطأ مع المستخدم الجديد:', error.message);
  
  console.log('\n🔍 إذا فشل هذا أيضاً، فالمشكلة قد تكون:');
  console.log('1. الـ Cluster متوقف (Paused) - تحقق من Database → Clusters');
  console.log('2. مشكلة في الشبكة المحلية أو جدار الحماية');
  console.log('3. مشكلة مؤقتة في MongoDB Atlas');
  
} finally {
  await client.close();
  console.log('👋 تم إغلاق الاتصال');
}
