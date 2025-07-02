/**
 * اختبار Firebase لـ BebeClick
 */

import firebaseService from './src/services/firebaseService.js';

const testFirebase = async () => {
  console.log('🔥 اختبار Firebase لـ BebeClick...');
  console.log('=' .repeat(50));
  
  try {
    // 1. اختبار الاتصال
    console.log('\n🧪 1. اختبار الاتصال...');
    const connectionTest = await firebaseService.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ Firebase متصل ويعمل بشكل مثالي!');
    } else {
      console.log('❌ مشكلة في الاتصال:', connectionTest.error);
      return;
    }
    
    // 2. اختبار إضافة ولاية
    console.log('\n🗺️ 2. اختبار إضافة ولاية...');
    const testWilaya = {
      code: 16,
      name: 'Alger',
      nameAr: 'الجزائر',
      region: 'centre',
      geography: {
        region: 'centre'
      },
      deliveryConfig: {
        pricingZone: 1,
        availableServices: [
          { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true }
        ],
        averageDeliveryTime: 2
      },
      metadata: {
        dataSource: 'firebase-test',
        createdBy: 'test-script'
      }
    };
    
    const wilayaResult = await firebaseService.addWilaya(testWilaya);
    console.log('✅ تم إضافة ولاية الجزائر:', wilayaResult.id);
    
    // 3. اختبار إضافة بلدية
    console.log('\n🏘️ 3. اختبار إضافة بلدية...');
    const testCommune = {
      code: 16001,
      name: 'Alger Centre',
      geography: {
        region: 'centre'
      },
      deliveryConfig: {
        pricingZone: 1,
        availableServices: [
          { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true }
        ],
        averageDeliveryTime: 2
      },
      metadata: {
        dataSource: 'firebase-test',
        createdBy: 'test-script'
      }
    };
    
    const communeResult = await firebaseService.addCommune(16, testCommune);
    console.log('✅ تم إضافة بلدية الجزائر الوسط:', communeResult.id);
    
    // 4. اختبار جلب الولايات
    console.log('\n📋 4. اختبار جلب الولايات...');
    const wilayas = await firebaseService.getWilayas();
    console.log(`✅ تم جلب ${wilayas.length} ولاية`);
    
    if (wilayas.length > 0) {
      console.log('📍 أول ولاية:', wilayas[0].name);
    }
    
    // 5. اختبار جلب البلديات
    console.log('\n🏘️ 5. اختبار جلب بلديات الجزائر...');
    const communes = await firebaseService.getCommunesByWilaya(16);
    console.log(`✅ تم جلب ${communes.length} بلدية للجزائر`);
    
    if (communes.length > 0) {
      console.log('📍 أول بلدية:', communes[0].name);
    }
    
    // 6. اختبار إضافة منتج
    console.log('\n📦 6. اختبار إضافة منتج...');
    const testProduct = {
      sku: 'TEST-FIREBASE-001',
      name: 'منتج اختبار Firebase',
      brand: 'BebeClick',
      category: 'Test',
      dimensions: {
        length: 30,
        width: 20,
        height: 10,
        weight: 1.5
      },
      pricing: {
        salePrice: 25000,
        costPrice: 20000
      },
      metadata: {
        dataSource: 'firebase-test',
        createdBy: 'test-script'
      }
    };
    
    const productResult = await firebaseService.saveProduct(testProduct);
    console.log('✅ تم إضافة منتج اختبار:', productResult.id);
    
    // 7. اختبار البحث في المنتجات
    console.log('\n🔍 7. اختبار البحث في المنتجات...');
    const products = await firebaseService.searchProducts('اختبار');
    console.log(`✅ تم العثور على ${products.length} منتج`);
    
    // 8. اختبار إضافة سعر توصيل
    console.log('\n💰 8. اختبار إضافة سعر توصيل...');
    const testPricing = {
      service: 'yalidine',
      wilayaCode: 16,
      wilayaName: 'Alger',
      commune: 'Alger Centre',
      pricing: {
        home: 950,
        office: 850,
        supplements: {
          codFeePercentage: 1,
          codFeeFixed: 0,
          overweightFee: 250,
          overweightThreshold: 5
        }
      },
      zone: 1,
      metadata: {
        dataSource: 'firebase-test',
        createdBy: 'test-script'
      }
    };
    
    const pricingResult = await firebaseService.savePricing(testPricing);
    console.log('✅ تم إضافة سعر توصيل:', pricingResult.id);
    
    // 9. اختبار جلب أسعار الخدمة
    console.log('\n💰 9. اختبار جلب أسعار يالدين...');
    const yalidinePrice = await firebaseService.getServicePricing('yalidine');
    console.log(`✅ تم جلب ${yalidinePrice.length} سعر ليالدين`);
    
    // 10. اختبار البحث عن سعر توصيل
    console.log('\n🔍 10. اختبار البحث عن سعر توصيل...');
    const deliveryPrice = await firebaseService.getDeliveryPrice('Alger Centre, Alger', 'home', 2, {}, 25000);
    
    if (deliveryPrice) {
      console.log('✅ تم العثور على سعر توصيل:', deliveryPrice.pricing.home, 'دج');
    } else {
      console.log('⚠️ لم يتم العثور على سعر مطابق');
    }
    
    console.log('\n🎉 جميع اختبارات Firebase نجحت!');
    console.log('✅ Firebase جاهز للاستخدام مع BebeClick');
    console.log('✅ يمكن الآن تعبئة البيانات الكاملة');
    
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في اختبار Firebase:', error);
    
    if (error.message.includes('permission')) {
      console.log('\n🔐 مشكلة صلاحيات:');
      console.log('- تأكد من إعداد Firestore في وضع Test mode');
      console.log('- تحقق من قواعد الأمان في Firebase Console');
    }
    
    if (error.message.includes('network')) {
      console.log('\n🌐 مشكلة شبكة:');
      console.log('- تحقق من اتصال الإنترنت');
      console.log('- تأكد من إعدادات Firebase صحيحة');
    }
    
    return false;
  }
};

// تشغيل الاختبار
testFirebase();
