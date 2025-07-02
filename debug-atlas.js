/**
 * تشخيص مفصل لمشكلة MongoDB Atlas
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config();

const lookup = promisify(dns.lookup);

const debugAtlasConnection = async () => {
  console.log('🔍 تشخيص مفصل لـ MongoDB Atlas...');
  console.log('=' .repeat(50));
  
  // 1. التحقق من متغيرات البيئة
  console.log('\n📋 1. فحص متغيرات البيئة:');
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.log('❌ MONGODB_URI غير موجود في ملف .env');
    return;
  }
  
  console.log('✅ MONGODB_URI موجود');
  
  // استخراج معلومات الاتصال
  const uriParts = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
  if (uriParts) {
    console.log(`📊 المستخدم: ${uriParts[1]}`);
    console.log(`🔐 كلمة المرور: ${uriParts[2].substring(0, 4)}***`);
    console.log(`🌐 الخادم: ${uriParts[3]}`);
    console.log(`💾 قاعدة البيانات: ${uriParts[4].split('?')[0]}`);
  }
  
  // 2. اختبار DNS
  console.log('\n🌐 2. اختبار DNS:');
  try {
    const hostname = 'bebeclickdb.n55xdah.mongodb.net';
    const address = await lookup(hostname);
    console.log(`✅ DNS يعمل: ${hostname} -> ${address.address}`);
  } catch (error) {
    console.log(`❌ مشكلة DNS: ${error.message}`);
    return;
  }
  
  // 3. اختبار الاتصال مع timeout قصير
  console.log('\n🔌 3. اختبار الاتصال:');
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    maxPoolSize: 1,
    retryWrites: false,
    retryReads: false
  });

  try {
    console.log('⏳ محاولة الاتصال (5 ثواني)...');
    
    await client.connect();
    console.log('✅ نجح الاتصال!');
    
    // اختبار المصادقة
    console.log('\n🔐 4. اختبار المصادقة:');
    const adminDb = client.db('admin');
    await adminDb.command({ ping: 1 });
    console.log('✅ المصادقة نجحت!');
    
    // اختبار قاعدة البيانات
    console.log('\n💾 5. اختبار قاعدة البيانات:');
    const db = client.db('bebeclick-delivery');
    const collections = await db.listCollections().toArray();
    console.log(`✅ قاعدة البيانات متاحة، المجموعات: ${collections.length}`);
    
    // اختبار الكتابة
    console.log('\n✍️ 6. اختبار الكتابة:');
    const testCollection = db.collection('connection_test');
    const result = await testCollection.insertOne({
      test: 'connection_test',
      timestamp: new Date(),
      ip: 'unknown'
    });
    console.log(`✅ الكتابة نجحت: ${result.insertedId}`);
    
    // تنظيف
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ تم تنظيف البيانات التجريبية');
    
    console.log('\n🎉 جميع الاختبارات نجحت! MongoDB Atlas يعمل بشكل مثالي');
    
  } catch (error) {
    console.log(`❌ فشل الاتصال: ${error.message}`);
    
    // تشخيص نوع الخطأ
    console.log('\n🔍 تشخيص الخطأ:');
    
    if (error.message.includes('authentication')) {
      console.log('🔐 مشكلة مصادقة:');
      console.log('  - تحقق من اسم المستخدم وكلمة المرور');
      console.log('  - تأكد من وجود المستخدم في Database Access');
      console.log('  - تحقق من صلاحيات المستخدم');
    }
    
    if (error.message.includes('timeout') || error.message.includes('selection')) {
      console.log('⏰ مشكلة شبكة/timeout:');
      console.log('  - تحقق من Network Access (0.0.0.0/0)');
      console.log('  - تأكد من أن الـ Cluster يعمل');
      console.log('  - قد تكون مشكلة في جدار الحماية المحلي');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('🌐 مشكلة DNS:');
      console.log('  - تحقق من اتصال الإنترنت');
      console.log('  - قد تكون مشكلة في DNS المحلي');
    }
    
    // اقتراحات الحل
    console.log('\n💡 اقتراحات الحل:');
    console.log('1. انتظر 5-10 دقائق بعد تغيير إعدادات Atlas');
    console.log('2. تأكد من أن الـ Cluster ليس متوقف (paused)');
    console.log('3. جرب إنشاء مستخدم جديد بصلاحيات Atlas Admin');
    console.log('4. تحقق من إعدادات جدار الحماية المحلي');
    console.log('5. جرب من شبكة مختلفة (mobile hotspot)');
    
  } finally {
    await client.close();
    console.log('\n👋 تم إغلاق الاتصال');
  }
};

debugAtlasConnection();
