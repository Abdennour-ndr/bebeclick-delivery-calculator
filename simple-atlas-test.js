/**
 * اختبار بسيط لـ MongoDB Atlas
 */

import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://inncomm16:mDrRFM2wZO8NOyjA@bebeclickdb.n55xdah.mongodb.net/bebeclick-delivery?retryWrites=true&w=majority&appName=BebeclickDB';

console.log('🔗 اختبار MongoDB Atlas...');

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
});

try {
  console.log('⏳ محاولة الاتصال...');
  await client.connect();
  console.log('✅ نجح الاتصال!');
  
  const db = client.db('bebeclick-delivery');
  const result = await db.admin().ping();
  console.log('🏓 Ping نجح:', result);
  
  console.log('🎉 MongoDB Atlas يعمل بشكل مثالي!');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  
  if (error.message.includes('authentication')) {
    console.log('\n🔐 مشكلة مصادقة - تحقق من:');
    console.log('1. اسم المستخدم: inncomm16');
    console.log('2. كلمة المرور صحيحة');
    console.log('3. المستخدم موجود في Database Access');
    console.log('4. صلاحيات المستخدم كافية');
  }
  
  if (error.message.includes('timeout')) {
    console.log('\n⏰ مشكلة شبكة - تحقق من:');
    console.log('1. Network Access يحتوي على 0.0.0.0/0');
    console.log('2. الـ Cluster يعمل (ليس متوقف)');
    console.log('3. اتصال الإنترنت');
  }
  
} finally {
  await client.close();
  console.log('👋 تم إغلاق الاتصال');
}
