/**
 * تعبئة Firebase بجميع الولايات والبلديات الجزائرية
 */

import firebaseService from './src/services/firebaseService.js';

// بيانات الولايات الجزائرية الكاملة (58 ولاية)
const ALGERIA_WILAYAS = [
  { code: 1, name: 'Adrar', nameAr: 'أدرار', region: 'sud' },
  { code: 2, name: 'Chlef', nameAr: 'الشلف', region: 'nord' },
  { code: 3, name: 'Laghouat', nameAr: 'الأغواط', region: 'centre' },
  { code: 4, name: 'Oum El Bouaghi', nameAr: 'أم البواقي', region: 'est' },
  { code: 5, name: 'Batna', nameAr: 'باتنة', region: 'est' },
  { code: 6, name: 'Béjaïa', nameAr: 'بجاية', region: 'nord' },
  { code: 7, name: 'Biskra', nameAr: 'بسكرة', region: 'centre' },
  { code: 8, name: 'Béchar', nameAr: 'بشار', region: 'sud' },
  { code: 9, name: 'Blida', nameAr: 'البليدة', region: 'centre' },
  { code: 10, name: 'Bouira', nameAr: 'البويرة', region: 'centre' },
  { code: 11, name: 'Tamanrasset', nameAr: 'تمنراست', region: 'sud' },
  { code: 12, name: 'Tébessa', nameAr: 'تبسة', region: 'est' },
  { code: 13, name: 'Tlemcen', nameAr: 'تلمسان', region: 'ouest' },
  { code: 14, name: 'Tiaret', nameAr: 'تيارت', region: 'ouest' },
  { code: 15, name: 'Tizi Ouzou', nameAr: 'تيزي وزو', region: 'nord' },
  { code: 16, name: 'Alger', nameAr: 'الجزائر', region: 'centre' },
  { code: 17, name: 'Djelfa', nameAr: 'الجلفة', region: 'centre' },
  { code: 18, name: 'Jijel', nameAr: 'جيجل', region: 'nord' },
  { code: 19, name: 'Sétif', nameAr: 'سطيف', region: 'est' },
  { code: 20, name: 'Saïda', nameAr: 'سعيدة', region: 'ouest' },
  { code: 21, name: 'Skikda', nameAr: 'سكيكدة', region: 'nord' },
  { code: 22, name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', region: 'ouest' },
  { code: 23, name: 'Annaba', nameAr: 'عنابة', region: 'est' },
  { code: 24, name: 'Guelma', nameAr: 'قالمة', region: 'est' },
  { code: 25, name: 'Constantine', nameAr: 'قسنطينة', region: 'est' },
  { code: 26, name: 'Médéa', nameAr: 'المدية', region: 'centre' },
  { code: 27, name: 'Mostaganem', nameAr: 'مستغانم', region: 'ouest' },
  { code: 28, name: 'M\'Sila', nameAr: 'المسيلة', region: 'centre' },
  { code: 29, name: 'Mascara', nameAr: 'معسكر', region: 'ouest' },
  { code: 30, name: 'Ouargla', nameAr: 'ورقلة', region: 'sud' },
  { code: 31, name: 'Oran', nameAr: 'وهران', region: 'ouest' },
  { code: 32, name: 'El Bayadh', nameAr: 'البيض', region: 'ouest' },
  { code: 33, name: 'Illizi', nameAr: 'إليزي', region: 'sud' },
  { code: 34, name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج', region: 'est' },
  { code: 35, name: 'Boumerdès', nameAr: 'بومرداس', region: 'nord' },
  { code: 36, name: 'El Tarf', nameAr: 'الطارف', region: 'est' },
  { code: 37, name: 'Tindouf', nameAr: 'تندوف', region: 'sud' },
  { code: 38, name: 'Tissemsilt', nameAr: 'تيسمسيلت', region: 'ouest' },
  { code: 39, name: 'El Oued', nameAr: 'الوادي', region: 'sud' },
  { code: 40, name: 'Khenchela', nameAr: 'خنشلة', region: 'est' },
  { code: 41, name: 'Souk Ahras', nameAr: 'سوق أهراس', region: 'est' },
  { code: 42, name: 'Tipaza', nameAr: 'تيبازة', region: 'nord' },
  { code: 43, name: 'Mila', nameAr: 'ميلة', region: 'est' },
  { code: 44, name: 'Aïn Defla', nameAr: 'عين الدفلى', region: 'centre' },
  { code: 45, name: 'Naâma', nameAr: 'النعامة', region: 'ouest' },
  { code: 46, name: 'Aïn Témouchent', nameAr: 'عين تموشنت', region: 'ouest' },
  { code: 47, name: 'Ghardaïa', nameAr: 'غرداية', region: 'sud' },
  { code: 48, name: 'Relizane', nameAr: 'غليزان', region: 'ouest' },
  { code: 49, name: 'Timimoun', nameAr: 'تيميمون', region: 'sud' },
  { code: 50, name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', region: 'sud' },
  { code: 51, name: 'Ouled Djellal', nameAr: 'أولاد جلال', region: 'centre' },
  { code: 52, name: 'Béni Abbès', nameAr: 'بني عباس', region: 'sud' },
  { code: 53, name: 'In Salah', nameAr: 'عين صالح', region: 'sud' },
  { code: 54, name: 'In Guezzam', nameAr: 'عين قزام', region: 'sud' },
  { code: 55, name: 'Touggourt', nameAr: 'تقرت', region: 'sud' },
  { code: 56, name: 'Djanet', nameAr: 'جانت', region: 'sud' },
  { code: 57, name: 'El M\'Ghair', nameAr: 'المغير', region: 'sud' },
  { code: 58, name: 'El Meniaa', nameAr: 'المنيعة', region: 'sud' }
];

// بلديات مختارة لكل ولاية
const SAMPLE_COMMUNES = {
  16: ['Alger Centre', 'Sidi M\'Hamed', 'El Madania', 'Bab El Oued', 'El Harrach', 'Hussein Dey', 'Kouba', 'Dar El Beida', 'Bab Ezzouar', 'Bordj El Kiffan'],
  31: ['Oran', 'Es Senia', 'Arzew', 'Bethioua', 'Bir El Djir', 'Hassi Bounif', 'Sidi Chami', 'Hassi Mefsoukh', 'Boutlelis', 'Ain El Turck'],
  25: ['Constantine', 'El Khroub', 'Ain Smara', 'Didouche Mourad', 'Zighoud Youcef', 'Hamma Bouziane', 'Ibn Ziad', 'Messaoud Boudjeriou', 'Ouled Rahmoun', 'Ain Abid'],
  9: ['Blida', 'Boufarik', 'Larbaa', 'Bouinan', 'Oued El Alleug', 'Chiffa', 'Meftah', 'El Affroun', 'Beni Mered', 'Soumaa'],
  6: ['Béjaïa', 'Akbou', 'El Kseur', 'Sidi Aich', 'Amizour', 'Tazmalt', 'Seddouk', 'Aokas', 'Tichy', 'Souk El Tenine'],
  19: ['Sétif', 'El Eulma', 'Ain Oulmene', 'Bougaa', 'Bordj Ghedir', 'Ain Arnat', 'Djemila', 'Hammam Guergour', 'Salah Bey', 'Mezloug'],
  13: ['Tlemcen', 'Maghnia', 'Nedroma', 'Ghazaouet', 'Remchi', 'Sebdou', 'Marsa Ben M\'Hidi', 'Mansourah', 'Chetouane', 'Hennaya'],
  23: ['Annaba', 'El Hadjar', 'Sidi Amar', 'El Bouni', 'Berrahal', 'Ain Berda', 'Chetaibi', 'Treat', 'Eulma', 'Cheurfa'],
  27: ['Mostaganem', 'Relizane', 'Ain Tedeles', 'Hassi Mameche', 'Sidi Ali', 'Fornaka', 'Stidia', 'Ain Nouissy', 'Mesra', 'Souaflia'],
  5: ['Batna', 'Barika', 'Ain Touta', 'N\'Gaous', 'Arris', 'Timgad', 'Ras El Aioun', 'Merouana', 'El Madher', 'Tazoult']
};

// دالة لتحديد منطقة التسعير
const getPricingZone = (region) => {
  const zoneMapping = {
    'centre': 1,  // المنطقة الوسطى
    'nord': 2,    // الشمال
    'est': 3,     // الشرق
    'ouest': 3,   // الغرب
    'sud': 4      // الجنوب
  };
  return zoneMapping[region] || 2;
};

// دالة لحفظ الولايات
const saveWilayas = async () => {
  console.log('🗺️ بدء حفظ الولايات في Firebase...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const wilaya of ALGERIA_WILAYAS) {
    try {
      const wilayaData = {
        code: wilaya.code,
        name: wilaya.name,
        nameAr: wilaya.nameAr,
        geography: {
          region: wilaya.region
        },
        deliveryConfig: {
          pricingZone: getPricingZone(wilaya.region),
          availableServices: [
            { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true },
            { service: 'zaki', available: wilaya.region === 'centre', homeDelivery: true, officeDelivery: true },
            { service: 'jamal-delivery', available: wilaya.region === 'centre', homeDelivery: true, officeDelivery: true }
          ],
          averageDeliveryTime: wilaya.region === 'centre' ? 2 : wilaya.region === 'sud' ? 5 : 3
        },
        metadata: {
          dataSource: 'official-algeria',
          createdBy: 'firebase-import'
        }
      };
      
      const result = await firebaseService.addWilaya(wilayaData);
      successCount++;
      console.log(`✅ تم حفظ ولاية: ${wilaya.name} (${wilaya.code}) - ID: ${result.id}`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ خطأ في حفظ ولاية ${wilaya.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 نتائج حفظ الولايات:`);
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  console.log(`📍 المجموع: ${ALGERIA_WILAYAS.length}`);
  
  return successCount;
};

// دالة لحفظ البلديات
const saveCommunes = async () => {
  console.log('\n🏘️ بدء حفظ البلديات في Firebase...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [wilayaCode, communes] of Object.entries(SAMPLE_COMMUNES)) {
    const wilaya = ALGERIA_WILAYAS.find(w => w.code === parseInt(wilayaCode));
    if (!wilaya) continue;
    
    console.log(`\n📍 حفظ بلديات ولاية ${wilaya.name}...`);
    
    for (let i = 0; i < communes.length; i++) {
      try {
        const commune = communes[i];
        const communeCode = parseInt(wilayaCode) * 1000 + (i + 1);
        
        const communeData = {
          code: communeCode,
          name: commune,
          geography: {
            region: wilaya.region
          },
          deliveryConfig: {
            pricingZone: getPricingZone(wilaya.region),
            availableServices: [
              { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true },
              { service: 'zaki', available: wilaya.region === 'centre', homeDelivery: true, officeDelivery: true },
              { service: 'jamal-delivery', available: wilaya.region === 'centre', homeDelivery: true, officeDelivery: true }
            ],
            averageDeliveryTime: wilaya.region === 'centre' ? 2 : wilaya.region === 'sud' ? 5 : 3
          },
          metadata: {
            dataSource: 'official-algeria',
            createdBy: 'firebase-import'
          }
        };
        
        const result = await firebaseService.addCommune(parseInt(wilayaCode), communeData);
        successCount++;
        console.log(`  ✅ ${commune} (${communeCode}) - ID: ${result.id}`);
        
      } catch (error) {
        errorCount++;
        console.error(`  ❌ خطأ في حفظ بلدية ${commune}:`, error.message);
      }
    }
  }
  
  console.log(`\n📊 نتائج حفظ البلديات:`);
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  
  return successCount;
};

// دالة لعرض الإحصائيات
const showStats = async () => {
  console.log('\n📊 إحصائيات Firebase:');
  
  try {
    const wilayas = await firebaseService.getWilayas();
    console.log(`🗺️ الولايات: ${wilayas.length}`);
    
    // إحصائيات حسب المنطقة
    const regionStats = {};
    wilayas.forEach(wilaya => {
      const region = wilaya.geography?.region || 'غير محدد';
      regionStats[region] = (regionStats[region] || 0) + 1;
    });
    
    console.log('\n📍 توزيع الولايات حسب المنطقة:');
    Object.entries(regionStats).forEach(([region, count]) => {
      console.log(`  ${region}: ${count} ولاية`);
    });
    
    // عد البلديات لبعض الولايات
    let totalCommunes = 0;
    for (const wilayaCode of [16, 31, 25]) {
      const communes = await firebaseService.getCommunesByWilaya(wilayaCode);
      totalCommunes += communes.length;
    }
    
    console.log(`🏘️ البلديات (عينة): ${totalCommunes}`);
    
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error.message);
  }
};

// تشغيل السكريبت
const populateFirebaseAlgeria = async () => {
  try {
    console.log('🔥 بدء تعبئة Firebase بالمواقع الجزائرية...');
    console.log('=' .repeat(60));
    
    // اختبار الاتصال
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.success) {
      console.error('❌ فشل الاتصال بـ Firebase:', connectionTest.error);
      return;
    }
    
    console.log('✅ Firebase متصل ويعمل');
    
    // حفظ الولايات
    const wilayasCount = await saveWilayas();
    
    // حفظ البلديات
    const communesCount = await saveCommunes();
    
    // عرض الإحصائيات
    await showStats();
    
    console.log('\n🎉 تم الانتهاء من تعبئة Firebase بنجاح!');
    console.log(`✅ تم حفظ ${wilayasCount} ولاية و ${communesCount} بلدية`);
    console.log('✅ يمكنك الآن استخدام الواجهة لرؤية جميع البيانات');
    console.log('🔥 Firebase جاهز لاستقبال أسعار التوصيل');
    
  } catch (error) {
    console.error('💥 خطأ في تعبئة Firebase:', error);
  }
};

// تشغيل السكريبت
populateFirebaseAlgeria();
