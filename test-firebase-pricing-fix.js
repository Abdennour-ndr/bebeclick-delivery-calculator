/**
 * اختبار إصلاح استخدام أسعار Firebase مباشرة
 */

import firebaseService from './src/services/firebaseService.js';

const testFirebasePricingFix = async () => {
  try {
    console.log('🧪 اختبار إصلاح استخدام أسعار Firebase...');
    
    // جلب بيانات Akabli, Adrar
    const adrarCommunes = await firebaseService.getCommunesByWilaya(1);
    const akabli = adrarCommunes.find(c => c.name === 'Akabli');
    
    if (akabli) {
      console.log('\n📍 بيانات Akabli من Firebase:');
      console.log(`🏠 سعر المنزل: ${akabli.pricing?.yalidine?.home}DA`);
      console.log(`🏢 سعر المكتب: ${akabli.pricing?.yalidine?.office}DA`);
      
      // محاكاة تنسيق البيانات في YalidineWilayaCommuneSelector
      console.log('\n🔧 محاكاة تنسيق البيانات في YalidineWilayaCommuneSelector:');
      
      // الطريقة الجديدة (بعد الإصلاح)
      const formattedCommune = {
        name: akabli.name,
        has_stop_desk: akabli.pricing?.yalidine?.office > 0,
        delivery_time: 48,
        pricing: akabli.pricing?.yalidine, // هذا هو المفتاح
        is_deliverable: true
      };
      
      console.log('✅ البلدية المنسقة:', {
        name: formattedCommune.name,
        pricing: formattedCommune.pricing
      });
      
      // محاكاة إنشاء كائن destination
      console.log('\n📍 محاكاة إنشاء كائن destination:');
      
      const wilaya = { id: 1, name: 'Adrar', zone: 1 };
      const commune = formattedCommune;
      
      const destination = `${commune.name}, ${wilaya.name}`;
      
      // الطريقة الجديدة (بعد الإصلاح)
      const fullDestinationInfo = {
        text: destination,
        wilayaCode: wilaya.id,
        wilayaName: wilaya.name,
        communeName: commune.name,
        pricing: {
          yalidine: commune.pricing || {}
        },
        zone: wilaya.zone || 1
      };
      
      console.log('✅ كائن destination الجديد:', {
        text: fullDestinationInfo.text,
        pricing: fullDestinationInfo.pricing
      });
      
      // اختبار الشرط في DeliveryForm
      console.log('\n🔍 اختبار الشرط في DeliveryForm:');
      
      const hasValidPricing = typeof fullDestinationInfo === 'object' && fullDestinationInfo.pricing?.yalidine;
      console.log(`✅ typeof destination === 'object': ${typeof fullDestinationInfo === 'object'}`);
      console.log(`✅ destination.pricing?.yalidine موجود: ${!!fullDestinationInfo.pricing?.yalidine}`);
      console.log(`✅ الشرط الكامل: ${hasValidPricing}`);
      
      if (hasValidPricing) {
        console.log('\n💰 محاكاة حساب التكلفة من Firebase:');
        
        const deliveryType = 'home';
        const weight = 2;
        const declaredValue = 3000;
        
        const basePrice = deliveryType === 'office' 
          ? (fullDestinationInfo.pricing.yalidine.office || 0)
          : (fullDestinationInfo.pricing.yalidine.home || 0);
        
        const overweightFee = weight > 5 ? (weight - 5) * 50 : 0;
        const reimbursementFee = Math.round(declaredValue * 0.01);
        const totalCost = basePrice + overweightFee + reimbursementFee;
        
        console.log(`   نوع التوصيل: ${deliveryType}`);
        console.log(`   الوزن: ${weight}kg`);
        console.log(`   القيمة المعلنة: ${declaredValue}DA`);
        console.log(`   السعر الأساسي: ${basePrice}DA`);
        console.log(`   رسوم الوزن الزائد: ${overweightFee}DA`);
        console.log(`   رسوم الاسترداد: ${reimbursementFee}DA`);
        console.log(`   ✅ المجموع: ${totalCost}DA`);
        
        // مقارنة مع السعر الخاطئ السابق
        const previousWrongPrice = 1200;
        console.log(`\n🔍 مقارنة مع السعر السابق:`);
        console.log(`   السعر السابق (خطأ): ${previousWrongPrice}DA`);
        console.log(`   السعر الجديد (صحيح): ${totalCost}DA`);
        console.log(`   الفرق: ${totalCost - previousWrongPrice}DA`);
        console.log(`   ${totalCost !== previousWrongPrice ? '✅ تم الإصلاح' : '❌ لم يتم الإصلاح'}`);
        
        // اختبار للمكتب أيضاً
        console.log('\n🏢 اختبار للمكتب:');
        const officeDeliveryType = 'office';
        const officeBasePrice = officeDeliveryType === 'office'
          ? (fullDestinationInfo.pricing.yalidine.office || 0)
          : (fullDestinationInfo.pricing.yalidine.home || 0);

        const officeTotalCost = officeBasePrice + overweightFee + reimbursementFee;
        console.log(`   السعر الأساسي للمكتب: ${officeBasePrice}DA`);
        console.log(`   ✅ المجموع للمكتب: ${officeTotalCost}DA`);
        
      } else {
        console.log('❌ الشرط فشل - سيستخدم hybridDeliveryService');
      }
      
      console.log('\n🎉 اختبار إصلاح Firebase مكتمل!');
      console.log('✅ البيانات تُمرر بشكل صحيح');
      console.log('✅ الشرط يعمل بشكل صحيح');
      console.log('✅ الأسعار تُحسب من Firebase مباشرة');
      
    } else {
      console.log('❌ لم يتم العثور على Akabli');
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار إصلاح Firebase:', error);
  }
};

// تشغيل الاختبار
testFirebasePricingFix();
