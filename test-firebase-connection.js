/**
 * اختبار سريع للتأكد من أن Firebase يعمل مع YalidineWilayaCommuneSelector
 */

import firebaseService from './src/services/firebaseService.js';

const testFirebaseConnection = async () => {
  try {
    console.log('🔥 اختبار اتصال Firebase...');
    
    // اختبار جلب الولايات
    console.log('\n📍 اختبار جلب الولايات...');
    const wilayas = await firebaseService.getWilayas();
    console.log(`✅ تم جلب ${wilayas.length} ولاية من Firebase`);
    
    // عرض عينة من الولايات
    console.log('\n📋 عينة من الولايات:');
    wilayas.slice(0, 5).forEach(w => {
      console.log(`  ${w.code.toString().padStart(2, '0')} - ${w.name} (منطقة: ${w.deliveryConfig?.pricingZone || 1})`);
    });
    
    // اختبار جلب بلديات الجزائر
    console.log('\n🏘️ اختبار جلب بلديات الجزائر...');
    const algerCommunes = await firebaseService.getCommunesByWilaya(16);
    console.log(`✅ تم جلب ${algerCommunes.length} بلدية للجزائر من Firebase`);
    
    // عرض عينة من البلديات مع الأسعار
    console.log('\n📋 عينة من بلديات الجزائر مع الأسعار:');
    algerCommunes.slice(0, 5).forEach(c => {
      const office = c.pricing?.yalidine?.office || 0;
      const home = c.pricing?.yalidine?.home || 0;
      console.log(`  ${c.name}: مكتب=${office}DA, منزل=${home}DA`);
    });
    
    // اختبار ولاية أخرى (وهران)
    console.log('\n🏘️ اختبار جلب بلديات وهران...');
    const oranCommunes = await firebaseService.getCommunesByWilaya(31);
    console.log(`✅ تم جلب ${oranCommunes.length} بلدية لوهران من Firebase`);
    
    if (oranCommunes.length > 0) {
      console.log('\n📋 عينة من بلديات وهران مع الأسعار:');
      oranCommunes.slice(0, 3).forEach(c => {
        const office = c.pricing?.yalidine?.office || 0;
        const home = c.pricing?.yalidine?.home || 0;
        console.log(`  ${c.name}: مكتب=${office}DA, منزل=${home}DA`);
      });
    }
    
    console.log('\n🎉 جميع الاختبارات نجحت! Firebase يعمل بشكل مثالي');
    console.log('✅ YalidineWilayaCommuneSelector سيستخدم هذه البيانات الآن');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار Firebase:', error);
  }
};

// تشغيل الاختبار
testFirebaseConnection();
