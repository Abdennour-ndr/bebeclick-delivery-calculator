/**
 * تصحيح الأسعار - تبديل سعر المنزل والمكتب
 */

import firebaseService from './src/services/firebaseService.js';

const fixPricingSwap = async () => {
  try {
    console.log('🔧 بدء تصحيح الأسعار - تبديل المنزل والمكتب...');
    console.log('=' .repeat(60));
    
    // 1. اختبار Firebase
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.success) {
      throw new Error('فشل الاتصال بـ Firebase');
    }
    console.log('✅ Firebase متصل ويعمل');
    
    // 2. جلب جميع الأسعار
    console.log('\n📊 جلب جميع الأسعار من Firebase...');
    const allPricing = await firebaseService.getAllPricing();
    
    console.log(`✅ تم جلب ${allPricing.length} سعر`);
    
    if (allPricing.length === 0) {
      console.log('⚠️ لا توجد أسعار للتصحيح');
      return;
    }
    
    // 3. عرض عينة من الأسعار الحالية
    console.log('\n📋 عينة من الأسعار الحالية (قبل التصحيح):');
    allPricing.slice(0, 5).forEach((price, index) => {
      console.log(`${index + 1}. ${price.wilayaName} - ${price.commune}`);
      console.log(`   🏠 منزل: ${price.pricing.home} دج | 🏢 مكتب: ${price.pricing.office} دج`);
    });
    
    // 4. تصحيح الأسعار
    console.log('\n🔄 بدء تصحيح الأسعار...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const pricing of allPricing) {
      try {
        // تبديل الأسعار
        const originalHome = pricing.pricing.home;
        const originalOffice = pricing.pricing.office;
        
        // المنطق الصحيح: المكتب أرخص من المنزل
        const correctedHome = Math.max(originalHome, originalOffice); // الأعلى للمنزل
        const correctedOffice = Math.min(originalHome, originalOffice); // الأقل للمكتب
        
        // تحديث السعر
        const updatedPricing = {
          ...pricing,
          pricing: {
            ...pricing.pricing,
            home: correctedHome,
            office: correctedOffice
          },
          metadata: {
            ...pricing.metadata,
            correctedBy: 'pricing-fix-script',
            correctedAt: new Date().toISOString(),
            originalHome: originalHome,
            originalOffice: originalOffice
          }
        };
        
        // حفظ السعر المصحح
        await firebaseService.updatePricing(pricing.id, updatedPricing);
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`✅ تم تصحيح ${successCount} سعر...`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ خطأ في تصحيح ${pricing.wilayaName}:`, error.message);
      }
    }
    
    console.log(`\n📊 نتائج التصحيح:`);
    console.log(`✅ تم تصحيح: ${successCount}`);
    console.log(`❌ فشل: ${errorCount}`);
    console.log(`📍 المجموع: ${allPricing.length}`);
    
    // 5. عرض عينة من الأسعار المصححة
    console.log('\n📋 عينة من الأسعار بعد التصحيح:');
    const correctedPricing = await firebaseService.getAllPricing();
    correctedPricing.slice(0, 5).forEach((price, index) => {
      console.log(`${index + 1}. ${price.wilayaName} - ${price.commune}`);
      console.log(`   🏠 منزل: ${price.pricing.home} دج | 🏢 مكتب: ${price.pricing.office} دج`);
      
      if (price.pricing.home < price.pricing.office) {
        console.log(`   ⚠️ تحذير: سعر المنزل أقل من المكتب!`);
      } else {
        console.log(`   ✅ الأسعار صحيحة`);
      }
    });
    
    console.log('\n🎉 تم الانتهاء من تصحيح الأسعار بنجاح!');
    console.log('✅ الآن سعر المنزل أعلى من سعر المكتب (كما هو مطلوب)');
    
  } catch (error) {
    console.error('💥 خطأ في تصحيح الأسعار:', error.message);
  }
};

// تشغيل السكريبت
fixPricingSwap();
