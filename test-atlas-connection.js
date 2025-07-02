/**
 * اختبار اتصال MongoDB Atlas مبسط
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const testAtlasConnection = async () => {
  const uri = process.env.MONGODB_URI;
  
  console.log('🔗 اختبار اتصال MongoDB Atlas...');
  console.log('📍 URI:', uri.replace(/\/\/.*@/, '//***:***@'));
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000, // 10 ثواني
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  });

  try {
    console.log('⏳ محاولة الاتصال...');
    
    // محاولة الاتصال
    await client.connect();
    console.log('✅ تم الاتصال بنجاح!');
    
    // اختبار ping
    const adminDb = client.db('admin');
    const pingResult = await adminDb.command({ ping: 1 });
    console.log('🏓 Ping نجح:', pingResult);
    
    // الحصول على معلومات قاعدة البيانات
    const db = client.db('bebeclick-delivery');
    const collections = await db.listCollections().toArray();
    console.log('📊 قاعدة البيانات: bebeclick-delivery');
    console.log('📋 المجموعات الموجودة:', collections.length);
    
    if (collections.length > 0) {
      console.log('📂 أسماء المجموعات:');
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    } else {
      console.log('📭 لا توجد مجموعات (قاعدة بيانات فارغة)');
    }
    
    // إنشاء مجموعة اختبار
    console.log('\n🧪 إنشاء مجموعة اختبار...');
    const testCollection = db.collection('test');
    
    // إدراج وثيقة اختبار
    const testDoc = {
      message: 'اختبار اتصال BebeClick',
      timestamp: new Date(),
      source: 'test-atlas-connection'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ تم إدراج وثيقة اختبار:', insertResult.insertedId);
    
    // قراءة الوثيقة
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ تم قراءة الوثيقة:', foundDoc.message);
    
    // حذف الوثيقة
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ تم حذف وثيقة الاختبار');
    
    console.log('\n🎉 جميع الاختبارات نجحت! قاعدة البيانات تعمل بشكل مثالي');
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n💡 نصائح لحل المشكلة:');
      console.log('1. تأكد من إضافة 0.0.0.0/0 في Network Access');
      console.log('2. انتظر 2-3 دقائق لتفعيل التغييرات');
      console.log('3. تأكد من صحة اسم المستخدم وكلمة المرور');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n🔐 مشكلة في المصادقة:');
      console.log('1. تحقق من اسم المستخدم: inncomm16');
      console.log('2. تحقق من كلمة المرور في ملف .env');
      console.log('3. تأكد من صلاحيات المستخدم في MongoDB Atlas');
    }
    
  } finally {
    await client.close();
    console.log('👋 تم إغلاق الاتصال');
  }
};

testAtlasConnection();
