/**
 * فحص أسعار Akabli, Adrar في Firebase
 */

import firebaseService from './src/services/firebaseService.js';

const checkAkabliAdrarPrice = async () => {
  try {
    console.log('🔍 فحص أسعار Akabli, Adrar...');
    
    // جلب بلديات أدرار (ولاية 1)
    const adrarCommunes = await firebaseService.getCommunesByWilaya(1);
    console.log(`📍 تم جلب ${adrarCommunes.length} بلدية لأدرار`);
    
    // البحث عن Akabli
    const akabli = adrarCommunes.find(c => c.name === 'Akabli');
    
    if (akabli) {
      console.log('\n✅ تم العثور على Akabli:');
      console.log(`📍 الاسم: ${akabli.name}`);
      console.log(`🏠 سعر المنزل: ${akabli.pricing?.yalidine?.home}DA`);
      console.log(`🏢 سعر المكتب: ${akabli.pricing?.yalidine?.office}DA`);
      console.log(`📊 البيانات الكاملة:`, akabli.pricing?.yalidine);
      
      // التحقق من المشكلة
      const homePrice = akabli.pricing?.yalidine?.home;
      const officePrice = akabli.pricing?.yalidine?.office;
      const displayedPrice = 1200;
      
      console.log(`\n🔍 تحليل المشكلة:`);
      console.log(`   السعر المعروض للمنزل: ${displayedPrice}DA`);
      console.log(`   السعر المعروض للمكتب: ${displayedPrice}DA`);
      console.log(`   السعر الفعلي للمنزل في Firebase: ${homePrice}DA`);
      console.log(`   السعر الفعلي للمكتب في Firebase: ${officePrice}DA`);
      
      if (homePrice === officePrice) {
        console.log(`\n⚠️ مشكلة في البيانات: سعر المنزل والمكتب متطابقان (${homePrice}DA)`);
        console.log('🔧 هذا غير طبيعي - عادة سعر المكتب أقل من سعر المنزل');
      } else {
        console.log(`\n✅ الأسعار مختلفة كما هو متوقع`);
        console.log(`   الفرق: ${homePrice - officePrice}DA`);
      }
      
      // فحص بلديات أخرى في أدرار للمقارنة
      console.log(`\n📋 مقارنة مع بلديات أخرى في أدرار:`);
      const otherCommunes = ['Adrar', 'Reggane', 'Tamantit'];
      
      otherCommunes.forEach(communeName => {
        const commune = adrarCommunes.find(c => c.name === communeName);
        if (commune) {
          const home = commune.pricing?.yalidine?.home || 0;
          const office = commune.pricing?.yalidine?.office || 0;
          console.log(`   ${communeName}: منزل=${home}DA, مكتب=${office}DA (فرق: ${home - office}DA)`);
        }
      });
      
      // فحص ولاية أدرار نفسها
      const adrarCity = adrarCommunes.find(c => c.name === 'Adrar');
      if (adrarCity) {
        console.log(`\n🏜️ مدينة أدرار (المركز):`);
        console.log(`   منزل: ${adrarCity.pricing?.yalidine?.home}DA`);
        console.log(`   مكتب: ${adrarCity.pricing?.yalidine?.office}DA`);
      }
      
      // محاكاة حساب التكلفة
      console.log(`\n💰 محاكاة حساب التكلفة لـ Akabli:`);
      const weight = 2; // 2 كيلو
      const declaredValue = 3000; // 3000 دينار
      
      // للمنزل
      let deliveryType = 'home';
      let basePrice = deliveryType === 'office' ? officePrice : homePrice;
      let overweightFee = weight > 5 ? (weight - 5) * 50 : 0;
      let reimbursementFee = Math.round(declaredValue * 0.01);
      let totalCost = basePrice + overweightFee + reimbursementFee;
      
      console.log(`   للمنزل: ${basePrice} + ${overweightFee} + ${reimbursementFee} = ${totalCost}DA`);
      
      // للمكتب
      deliveryType = 'office';
      basePrice = deliveryType === 'office' ? officePrice : homePrice;
      totalCost = basePrice + overweightFee + reimbursementFee;
      
      console.log(`   للمكتب: ${basePrice} + ${overweightFee} + ${reimbursementFee} = ${totalCost}DA`);
      
    } else {
      console.log('❌ لم يتم العثور على Akabli في قاعدة البيانات');
      
      // عرض البلديات المتاحة
      console.log('\n📋 البلديات المتاحة في أدرار:');
      adrarCommunes.forEach(c => {
        console.log(`   - ${c.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص أسعار Akabli, Adrar:', error);
  }
};

// تشغيل الفحص
checkAkabliAdrarPrice();
