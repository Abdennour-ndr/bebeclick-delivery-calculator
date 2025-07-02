/**
 * سكريبت تشخيص شامل لقسم المنتجات
 * BebeClick Delivery Calculator
 */

import firebaseService from './src/services/firebaseService.js';
import productsGoogleSheetsService from './src/services/productsGoogleSheetsService.js';

console.log('🔍 بدء تشخيص قسم المنتجات...\n');

async function diagnoseProducts() {
  const diagnosis = {
    firebase: {
      status: 'unknown',
      products: 0,
      errors: [],
      sampleProducts: []
    },
    googleSheets: {
      status: 'unknown',
      products: 0,
      errors: [],
      sampleProducts: []
    },
    recommendations: []
  };

  // 1. تشخيص Firebase
  console.log('🔥 تشخيص Firebase...');
  try {
    // اختبار الاتصال
    const connectionTest = await firebaseService.testConnection();
    if (connectionTest.success) {
      diagnosis.firebase.status = 'connected';
      console.log('✅ Firebase متصل');
      
      // جلب المنتجات
      try {
        const firebaseProducts = await firebaseService.getProducts();
        diagnosis.firebase.products = firebaseProducts.length;
        diagnosis.firebase.sampleProducts = firebaseProducts.slice(0, 3);
        console.log(`📦 ${firebaseProducts.length} منتج في Firebase`);
        
        // اختبار البحث
        if (firebaseProducts.length > 0) {
          const searchTest = await firebaseService.searchProducts('test', 5);
          console.log(`🔍 اختبار البحث: ${searchTest.length} نتيجة`);
        }
        
      } catch (productsError) {
        diagnosis.firebase.errors.push(`خطأ في جلب المنتجات: ${productsError.message}`);
        console.error('❌ خطأ في جلب المنتجات من Firebase:', productsError);
      }
      
    } else {
      diagnosis.firebase.status = 'error';
      diagnosis.firebase.errors.push(connectionTest.error);
      console.error('❌ Firebase غير متصل:', connectionTest.error);
    }
  } catch (firebaseError) {
    diagnosis.firebase.status = 'error';
    diagnosis.firebase.errors.push(firebaseError.message);
    console.error('❌ خطأ في Firebase:', firebaseError);
  }

  // 2. تشخيص Google Sheets
  console.log('\n📊 تشخيص Google Sheets...');
  try {
    // اختبار الاتصال
    const sheetsConnection = await productsGoogleSheetsService.testConnection();
    if (sheetsConnection) {
      diagnosis.googleSheets.status = 'connected';
      console.log('✅ Google Sheets متصل');
      
      // جلب المنتجات
      try {
        const sheetsProducts = await productsGoogleSheetsService.loadAllProducts();
        diagnosis.googleSheets.products = sheetsProducts.length;
        diagnosis.googleSheets.sampleProducts = sheetsProducts.slice(0, 3);
        console.log(`📦 ${sheetsProducts.length} منتج في Google Sheets`);
        
        // اختبار البحث
        if (sheetsProducts.length > 0) {
          const searchTest = await productsGoogleSheetsService.searchProducts('test');
          console.log(`🔍 اختبار البحث: ${searchTest.length} نتيجة`);
        }
        
      } catch (productsError) {
        diagnosis.googleSheets.errors.push(`خطأ في جلب المنتجات: ${productsError.message}`);
        console.error('❌ خطأ في جلب المنتجات من Google Sheets:', productsError);
      }
      
    } else {
      diagnosis.googleSheets.status = 'error';
      diagnosis.googleSheets.errors.push('فشل في الاتصال');
      console.error('❌ Google Sheets غير متصل');
    }
  } catch (sheetsError) {
    diagnosis.googleSheets.status = 'error';
    diagnosis.googleSheets.errors.push(sheetsError.message);
    console.error('❌ خطأ في Google Sheets:', sheetsError);
  }

  // 3. تحليل النتائج وإعطاء توصيات
  console.log('\n📋 تحليل النتائج...');
  
  if (diagnosis.firebase.status === 'connected' && diagnosis.firebase.products > 0) {
    diagnosis.recommendations.push('✅ Firebase يعمل بشكل مثالي - استخدمه كمصدر أساسي');
  } else if (diagnosis.firebase.status === 'connected' && diagnosis.firebase.products === 0) {
    diagnosis.recommendations.push('⚠️ Firebase متصل لكن لا يحتوي على منتجات - قم بالاستيراد');
  } else {
    diagnosis.recommendations.push('❌ Firebase لا يعمل - استخدم Google Sheets كبديل');
  }
  
  if (diagnosis.googleSheets.status === 'connected' && diagnosis.googleSheets.products > 0) {
    diagnosis.recommendations.push('✅ Google Sheets يعمل ويحتوي على منتجات');
  } else {
    diagnosis.recommendations.push('❌ Google Sheets لا يعمل أو فارغ');
  }
  
  if (diagnosis.firebase.products === 0 && diagnosis.googleSheets.products > 0) {
    diagnosis.recommendations.push('🔄 يُنصح بنقل المنتجات من Google Sheets إلى Firebase');
  }
  
  if (diagnosis.firebase.products > 0 && diagnosis.googleSheets.products > 0) {
    diagnosis.recommendations.push('🔄 تأكد من تزامن البيانات بين Firebase و Google Sheets');
  }

  // 4. عرض التقرير النهائي
  console.log('\n📊 تقرير التشخيص النهائي:');
  console.log('=====================================');
  
  console.log('\n🔥 Firebase:');
  console.log(`   الحالة: ${diagnosis.firebase.status}`);
  console.log(`   عدد المنتجات: ${diagnosis.firebase.products}`);
  if (diagnosis.firebase.errors.length > 0) {
    console.log(`   الأخطاء: ${diagnosis.firebase.errors.join(', ')}`);
  }
  if (diagnosis.firebase.sampleProducts.length > 0) {
    console.log('   عينة من المنتجات:');
    diagnosis.firebase.sampleProducts.forEach((product, index) => {
      console.log(`     ${index + 1}. ${product.name} (${product.sku || 'بدون SKU'})`);
    });
  }
  
  console.log('\n📊 Google Sheets:');
  console.log(`   الحالة: ${diagnosis.googleSheets.status}`);
  console.log(`   عدد المنتجات: ${diagnosis.googleSheets.products}`);
  if (diagnosis.googleSheets.errors.length > 0) {
    console.log(`   الأخطاء: ${diagnosis.googleSheets.errors.join(', ')}`);
  }
  if (diagnosis.googleSheets.sampleProducts.length > 0) {
    console.log('   عينة من المنتجات:');
    diagnosis.googleSheets.sampleProducts.forEach((product, index) => {
      console.log(`     ${index + 1}. ${product.name} (${product.sku || 'بدون SKU'})`);
    });
  }
  
  console.log('\n💡 التوصيات:');
  diagnosis.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
  
  console.log('\n=====================================');
  console.log('✅ انتهى التشخيص');
  
  return diagnosis;
}

// تشغيل التشخيص
diagnoseProducts().catch(error => {
  console.error('❌ خطأ في التشخيص:', error);
});
