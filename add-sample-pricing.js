/**
 * إضافة أسعار تجريبية للولايات الموجودة في Firebase
 */

import firebaseService from './src/services/firebaseService.js';

// أسعار تجريبية للولايات الرئيسية
const SAMPLE_PRICING = [
  // الجزائر
  { wilayaName: 'Alger', commune: 'Alger Centre', home: 950, office: 850 },
  { wilayaName: 'Alger', commune: 'Sidi M\'Hamed', home: 950, office: 850 },
  { wilayaName: 'Alger', commune: 'El Madania', home: 950, office: 850 },
  { wilayaName: 'Alger', commune: 'Bab El Oued', home: 950, office: 850 },
  { wilayaName: 'Alger', commune: 'El Harrach', home: 1000, office: 900 },
  
  // وهران
  { wilayaName: 'Oran', commune: 'Oran', home: 1200, office: 1100 },
  { wilayaName: 'Oran', commune: 'Es Senia', home: 1250, office: 1150 },
  { wilayaName: 'Oran', commune: 'Arzew', home: 1300, office: 1200 },
  { wilayaName: 'Oran', commune: 'Bethioua', home: 1350, office: 1250 },
  { wilayaName: 'Oran', commune: 'Bir El Djir', home: 1200, office: 1100 },
  
  // قسنطينة
  { wilayaName: 'Constantine', commune: 'Constantine', home: 1100, office: 1000 },
  { wilayaName: 'Constantine', commune: 'El Khroub', home: 1150, office: 1050 },
  { wilayaName: 'Constantine', commune: 'Ain Smara', home: 1200, office: 1100 },
  
  // البليدة
  { wilayaName: 'Blida', commune: 'Blida', home: 900, office: 800 },
  { wilayaName: 'Blida', commune: 'Boufarik', home: 950, office: 850 },
  { wilayaName: 'Blida', commune: 'Larbaa', home: 1000, office: 900 },
  
  // بجاية
  { wilayaName: 'Béjaïa', commune: 'Béjaïa', home: 1300, office: 1200 },
  { wilayaName: 'Béjaïa', commune: 'Akbou', home: 1350, office: 1250 },
  { wilayaName: 'Béjaïa', commune: 'El Kseur', home: 1400, office: 1300 },
  
  // سطيف
  { wilayaName: 'Sétif', commune: 'Sétif', home: 1250, office: 1150 },
  { wilayaName: 'Sétif', commune: 'El Eulma', home: 1300, office: 1200 },
  { wilayaName: 'Sétif', commune: 'Ain Oulmene', home: 1350, office: 1250 },
  
  // تلمسان
  { wilayaName: 'Tlemcen', commune: 'Tlemcen', home: 1400, office: 1300 },
  { wilayaName: 'Tlemcen', commune: 'Maghnia', home: 1450, office: 1350 },
  { wilayaName: 'Tlemcen', commune: 'Nedroma', home: 1500, office: 1400 },
  
  // عنابة
  { wilayaName: 'Annaba', commune: 'Annaba', home: 1350, office: 1250 },
  { wilayaName: 'Annaba', commune: 'El Hadjar', home: 1400, office: 1300 },
  { wilayaName: 'Annaba', commune: 'Sidi Amar', home: 1450, office: 1350 },
  
  // مستغانم
  { wilayaName: 'Mostaganem', commune: 'Mostaganem', home: 1300, office: 1200 },
  { wilayaName: 'Mostaganem', commune: 'Relizane', home: 1350, office: 1250 },
  
  // باتنة
  { wilayaName: 'Batna', commune: 'Batna', home: 1400, office: 1300 },
  { wilayaName: 'Batna', commune: 'Barika', home: 1450, office: 1350 },
  { wilayaName: 'Batna', commune: 'Ain Touta', home: 1500, office: 1400 }
];

// دالة للبحث عن الولاية
const findWilayaByName = async (wilayaName) => {
  try {
    const wilayas = await firebaseService.getWilayas();
    
    const found = wilayas.find(w => 
      w.name?.toLowerCase() === wilayaName.toLowerCase() ||
      w.nameAr?.includes(wilayaName) ||
      wilayaName.toLowerCase().includes(w.name?.toLowerCase())
    );
    
    return found;
  } catch (error) {
    console.warn('⚠️ خطأ في البحث عن الولاية:', error.message);
    return null;
  }
};

// دالة للبحث عن البلدية
const findCommuneByName = async (wilayaCode, communeName) => {
  try {
    const communes = await firebaseService.getCommunesByWilaya(wilayaCode);
    
    const found = communes.find(c => 
      c.name?.toLowerCase() === communeName.toLowerCase() ||
      communeName.toLowerCase().includes(c.name?.toLowerCase()) ||
      c.name?.toLowerCase().includes(communeName.toLowerCase())
    );
    
    return found;
  } catch (error) {
    console.warn('⚠️ خطأ في البحث عن البلدية:', error.message);
    return null;
  }
};

// دالة لتحديد المنطقة
const getZoneByRegion = (region) => {
  const zoneMapping = {
    'centre': 1,
    'nord': 2,
    'est': 3,
    'ouest': 3,
    'sud': 4
  };
  return zoneMapping[region] || 2;
};

// دالة لإضافة الأسعار
const addSamplePricing = async () => {
  console.log('💰 بدء إضافة الأسعار التجريبية...');
  
  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  
  for (const pricing of SAMPLE_PRICING) {
    try {
      console.log(`\n🔍 معالجة: ${pricing.wilayaName} - ${pricing.commune}`);
      
      // البحث عن الولاية
      const wilaya = await findWilayaByName(pricing.wilayaName);
      if (!wilaya) {
        console.log(`❌ لم يتم العثور على ولاية: ${pricing.wilayaName}`);
        notFoundCount++;
        continue;
      }
      
      console.log(`✅ تم العثور على ولاية: ${wilaya.name} (${wilaya.code})`);
      
      // البحث عن البلدية
      const commune = await findCommuneByName(wilaya.code, pricing.commune);
      if (!commune) {
        console.log(`⚠️ لم يتم العثور على بلدية: ${pricing.commune}`);
        // سنضيف السعر للولاية بدلاً من البلدية
      } else {
        console.log(`✅ تم العثور على بلدية: ${commune.name}`);
      }
      
      // إنشاء بيانات السعر
      const pricingRecord = {
        service: 'yalidine',
        wilayaCode: wilaya.code,
        wilayaName: wilaya.name,
        commune: commune ? commune.name : pricing.commune,
        communeCode: commune ? commune.code : wilaya.code,
        pricing: {
          home: pricing.home,
          office: pricing.office,
          supplements: {
            codFeePercentage: 1,
            codFeeFixed: 0,
            overweightFee: 250,
            overweightThreshold: 5
          }
        },
        zone: getZoneByRegion(wilaya.geography?.region),
        metadata: {
          dataSource: 'sample-pricing',
          createdBy: 'sample-pricing-script'
        }
      };
      
      // حفظ السعر
      const result = await firebaseService.savePricing(pricingRecord);
      
      successCount++;
      console.log(`✅ تم حفظ السعر - ID: ${result.id}`);
      console.log(`   📍 ${pricingRecord.wilayaName} - ${pricingRecord.commune}`);
      console.log(`   🏠 منزل: ${pricingRecord.pricing.home} دج`);
      console.log(`   🏢 مكتب: ${pricingRecord.pricing.office} دج`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ خطأ في معالجة ${pricing.wilayaName}:`, error.message);
    }
  }
  
  console.log(`\n📊 نتائج إضافة الأسعار:`);
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  console.log(`🔍 غير موجود: ${notFoundCount}`);
  console.log(`📍 المجموع: ${SAMPLE_PRICING.length}`);
  
  return { successCount, errorCount, notFoundCount };
};

// دالة لعرض الأسعار المضافة
const showAddedPricing = async () => {
  try {
    console.log('\n📋 الأسعار المضافة:');
    
    const yalidinePrice = await firebaseService.getServicePricing('yalidine');
    
    if (yalidinePrice.length > 0) {
      console.log(`💰 تم العثور على ${yalidinePrice.length} سعر ليالدين`);
      
      // تجميع حسب الولاية
      const byWilaya = {};
      yalidinePrice.forEach(price => {
        if (!byWilaya[price.wilayaName]) {
          byWilaya[price.wilayaName] = [];
        }
        byWilaya[price.wilayaName].push(price);
      });
      
      Object.entries(byWilaya).forEach(([wilayaName, prices]) => {
        console.log(`\n🗺️ ${wilayaName} (${prices.length} أسعار):`);
        prices.slice(0, 3).forEach(price => {
          console.log(`   🏘️ ${price.commune}: 🏠 ${price.pricing.home} دج | 🏢 ${price.pricing.office} دج`);
        });
        if (prices.length > 3) {
          console.log(`   ... و ${prices.length - 3} أسعار أخرى`);
        }
      });
    } else {
      console.log('⚠️ لم يتم العثور على أسعار');
    }
    
  } catch (error) {
    console.error('❌ خطأ في عرض الأسعار:', error.message);
  }
};

// الدالة الرئيسية
const main = async () => {
  try {
    console.log('🚀 بدء إضافة الأسعار التجريبية...');
    console.log('=' .repeat(50));
    
    // اختبار Firebase
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.success) {
      throw new Error('فشل الاتصال بـ Firebase');
    }
    console.log('✅ Firebase متصل ويعمل');
    
    // إضافة الأسعار
    const results = await addSamplePricing();
    
    // عرض النتائج
    await showAddedPricing();
    
    console.log('\n🎉 تم الانتهاء بنجاح!');
    console.log(`✅ تم إضافة ${results.successCount} سعر`);
    console.log('🔥 Firebase جاهز مع أسعار التوصيل');
    
  } catch (error) {
    console.error('💥 خطأ:', error.message);
  }
};

main();
