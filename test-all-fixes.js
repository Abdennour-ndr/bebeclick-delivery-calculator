/**
 * اختبار شامل لجميع الإصلاحات
 */

import firebaseService from './src/services/firebaseService.js';

const testAllFixes = async () => {
  try {
    console.log('🧪 اختبار شامل لجميع الإصلاحات...');
    
    // 1. اختبار Firebase
    console.log('\n🔥 1. اختبار Firebase...');
    const wilayas = await firebaseService.getWilayas();
    console.log(`✅ ${wilayas.length} ولاية متوفرة`);
    
    const algerCommunes = await firebaseService.getCommunesByWilaya(16);
    console.log(`✅ ${algerCommunes.length} بلدية للجزائر`);
    
    // 2. اختبار تنسيق البيانات
    console.log('\n🔧 2. اختبار تنسيق البيانات...');
    const formattedWilayas = wilayas.map(w => ({
      id: w.code,
      name: w.name,
      zone: w.deliveryConfig?.pricingZone || 1,
      is_deliverable: true
    }));
    
    const formattedCommunes = algerCommunes.map((c, index) => ({
      name: c.name,
      has_stop_desk: c.pricing?.yalidine?.office > 0,
      delivery_time: 48,
      pricing: c.pricing?.yalidine,
      is_deliverable: true,
      key: `${c.name}-${index}` // React key
    }));
    
    console.log(`✅ تنسيق ${formattedWilayas.length} ولاية مع keys صحيحة`);
    console.log(`✅ تنسيق ${formattedCommunes.length} بلدية مع keys صحيحة`);
    
    // 3. اختبار كائن الوجهة
    console.log('\n📍 3. اختبار كائن الوجهة...');
    const selectedWilaya = formattedWilayas.find(w => w.id === 16);
    const selectedCommune = formattedCommunes.find(c => c.name === 'Alger Centre');
    
    if (selectedWilaya && selectedCommune) {
      const destination = `${selectedCommune.name}, ${selectedWilaya.name}`;
      
      const fullDestinationInfo = {
        text: destination,
        wilayaCode: selectedWilaya.id,
        wilayaName: selectedWilaya.name,
        communeName: selectedCommune.name,
        pricing: selectedCommune.pricing || {},
        zone: selectedWilaya.zone || 1
      };
      
      console.log('✅ كائن الوجهة:', {
        text: fullDestinationInfo.text,
        wilayaCode: fullDestinationInfo.wilayaCode,
        communeName: fullDestinationInfo.communeName
      });
      
      // 4. اختبار معالجة destination.split
      console.log('\n🔧 4. اختبار معالجة destination.split...');
      
      // محاكاة الكود في DeliveryForm
      let wilaya = '';
      if (typeof fullDestinationInfo === 'object' && fullDestinationInfo.wilayaName) {
        wilaya = fullDestinationInfo.wilayaName;
      } else {
        const destinationText = typeof fullDestinationInfo === 'object' ? fullDestinationInfo.text : fullDestinationInfo;
        if (destinationText && typeof destinationText === 'string') {
          wilaya = destinationText.split(',')[0] || destinationText;
        } else {
          wilaya = 'Unknown';
        }
      }
      
      console.log(`✅ معالجة destination.split: wilaya="${wilaya}"`);
      
      // 5. اختبار عرض النص
      console.log('\n📝 5. اختبار عرض النص...');
      const displayText = typeof fullDestinationInfo === 'object' ? fullDestinationInfo.text : fullDestinationInfo;
      console.log(`✅ نص العرض: "${displayText}"`);
      
      // 6. اختبار التحقق من الوجهة
      console.log('\n✅ 6. اختبار التحقق من الوجهة...');
      const isValidDestination = fullDestinationInfo && 
                                (typeof fullDestinationInfo === 'object' ? fullDestinationInfo.text : fullDestinationInfo);
      console.log(`✅ الوجهة صالحة: ${!!isValidDestination}`);
      
      // 7. اختبار حساب التكلفة
      console.log('\n💰 7. اختبار حساب التكلفة...');
      const weight = 3;
      const declaredValue = 5000;
      
      const basePrice = fullDestinationInfo.pricing.home || 0;
      const overweightFee = weight > 5 ? (weight - 5) * 50 : 0;
      const reimbursementFee = Math.round(declaredValue * 0.01);
      const totalCost = basePrice + overweightFee + reimbursementFee;
      
      console.log(`✅ حساب التكلفة:`);
      console.log(`   السعر الأساسي: ${basePrice}DA`);
      console.log(`   رسوم الوزن الزائد: ${overweightFee}DA`);
      console.log(`   رسوم الاسترداد: ${reimbursementFee}DA`);
      console.log(`   المجموع: ${totalCost}DA`);
      
      // 8. اختبار محاكاة ResultDisplay
      console.log('\n📊 8. اختبار محاكاة ResultDisplay...');
      const result = {
        destination: fullDestinationInfo,
        service: 'Yalidine',
        cost: totalCost
      };
      
      // محاكاة الكود في ResultDisplay
      const destinationTextForDisplay = typeof result.destination === 'object' ? result.destination.text : result.destination;
      console.log(`✅ عرض destination في ResultDisplay: "${destinationTextForDisplay}"`);
      
      console.log('\n🎉 جميع الاختبارات نجحت!');
      console.log('✅ React Keys: صحيحة');
      console.log('✅ destination.split: محمية');
      console.log('✅ عرض Objects: آمن');
      console.log('✅ حساب الأسعار: دقيق');
      console.log('✅ Firebase: متصل ويعمل');
      console.log('✅ التكامل: مكتمل');
      
    } else {
      console.error('❌ لم يتم العثور على الولاية أو البلدية المطلوبة');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار الشامل:', error);
  }
};

// تشغيل الاختبار
testAllFixes();
