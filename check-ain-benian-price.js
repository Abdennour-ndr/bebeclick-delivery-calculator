/**
 * فحص سعر Aïn Benian في Firebase
 */

import firebaseService from './src/services/firebaseService.js';

const checkAinBenianPrice = async () => {
  try {
    console.log('🔍 فحص سعر Aïn Benian...');
    
    // جلب بلديات الجزائر
    const algerCommunes = await firebaseService.getCommunesByWilaya(16);
    console.log(`📍 تم جلب ${algerCommunes.length} بلدية للجزائر`);
    
    // البحث عن Aïn Benian
    const ainBenian = algerCommunes.find(c => c.name === 'Aïn Benian');
    
    if (ainBenian) {
      console.log('\n✅ تم العثور على Aïn Benian:');
      console.log(`📍 الاسم: ${ainBenian.name}`);
      console.log(`🏢 سعر المكتب: ${ainBenian.pricing?.yalidine?.office}DA`);
      console.log(`🏠 سعر المنزل: ${ainBenian.pricing?.yalidine?.home}DA`);
      console.log(`📊 البيانات الكاملة:`, ainBenian.pricing?.yalidine);
      
      // مقارنة مع السعر المعروض (400DA)
      const actualOfficePrice = ainBenian.pricing?.yalidine?.office;
      const displayedPrice = 400;
      
      console.log(`\n🔍 مقارنة الأسعار:`);
      console.log(`   السعر في Firebase: ${actualOfficePrice}DA`);
      console.log(`   السعر المعروض: ${displayedPrice}DA`);
      console.log(`   ${actualOfficePrice === displayedPrice ? '✅ متطابق' : '❌ غير متطابق'}`);
      
      if (actualOfficePrice !== displayedPrice) {
        console.log(`\n⚠️ المشكلة: التطبيق يعرض ${displayedPrice}DA بدلاً من ${actualOfficePrice}DA`);
        console.log('🔧 الحل: التأكد من أن DeliveryForm يستخدم الأسعار من Firebase مباشرة');
      }
      
    } else {
      console.log('❌ لم يتم العثور على Aïn Benian في قاعدة البيانات');
      
      // عرض أسماء البلديات المتاحة للمقارنة
      console.log('\n📋 البلديات المتاحة:');
      algerCommunes.slice(0, 10).forEach(c => {
        console.log(`   - ${c.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص سعر Aïn Benian:', error);
  }
};

// تشغيل الفحص
checkAinBenianPrice();
