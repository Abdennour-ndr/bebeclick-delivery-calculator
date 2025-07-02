/**
 * استيراد أسعار التوصيل من Google Sheets إلى Firebase
 * يضيف الأسعار فقط للولايات والبلديات الموجودة مسبقاً
 */

import firebaseService from './src/services/firebaseService.js';

// معرف Google Sheets
const SHEETS_ID = '1xRMDz8RjTxvWIokT2ao2Er4CitgSJu_f5oiD59DHt2I';
const API_KEY = 'AIzaSyASWDtFcs32CmVyjLJxkoTpyy2KBxa-gM4'; // من الذاكرة

// دالة لقراءة البيانات من Google Sheets
const fetchSheetsData = async () => {
  try {
    console.log(' قراءة البيانات من Google Sheets...');
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/Sheet1?key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.values) {
      throw new Error('لا توجد بيانات في الجدول');
    }
    
    console.log(`✅ تم قراءة ${data.values.length} صف من Google Sheets`);
    return data.values;
    
  } catch (error) {
    console.error('❌ خطأ في قراءة Google Sheets:', error.message);
    throw error;
  }
};

// دالة لتحليل البيانات وتحويلها لتنسيق مناسب
const parseSheetData = (rows) => {
  console.log('🔍 تحليل بيانات الجدول...');
  
  if (rows.length < 2) {
    throw new Error('الجدول يجب أن يحتوي على رأس وبيانات');
  }
  
  const headers = rows[0];
  console.log('📋 أعمدة الجدول:', headers);
  
  const pricingData = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // تخطي الصفوف الفارغة
    if (!row || row.length === 0 || !row[0]) {
      continue;
    }
    
    try {
      // استخراج البيانات (تحتاج تعديل حسب تنسيق الجدول)
      const wilayaName = row[0]?.trim();
      const communeName = row[1]?.trim();
      const homePrice = parseFloat(row[2]) || 0;
      const officePrice = parseFloat(row[3]) || 0;
      
      if (wilayaName && homePrice > 0) {
        pricingData.push({
          wilayaName,
          communeName: communeName || wilayaName, // إذا لم تكن هناك بلدية، استخدم اسم الولاية
          homePrice,
          officePrice: officePrice > 0 ? officePrice : homePrice - 100, // إذا لم يكن هناك سعر مكتب، اجعله أقل بـ100
          service: 'yalidine' // افتراضي
        });
      }
      
    } catch (error) {
      console.warn(`⚠️ خطأ في تحليل الصف ${i + 1}:`, error.message);
    }
  }
  
  console.log(`✅ تم تحليل ${pricingData.length} سعر من الجدول`);
  return pricingData;
};

// دالة للبحث عن الولاية في Firebase
const findWilayaByName = async (wilayaName) => {
  try {
    const wilayas = await firebaseService.getWilayas();
    
    // البحث بالاسم الإنجليزي أو العربي
    const found = wilayas.find(w => 
      w.name?.toLowerCase().includes(wilayaName.toLowerCase()) ||
      w.nameAr?.includes(wilayaName) ||
      wilayaName.toLowerCase().includes(w.name?.toLowerCase())
    );
    
    return found;
  } catch (error) {
    console.warn('⚠️ خطأ في البحث عن الولاية:', error.message);
    return null;
  }
};

// دالة للبحث عن البلدية في Firebase
const findCommuneByName = async (wilayaCode, communeName) => {
  try {
    const communes = await firebaseService.getCommunesByWilaya(wilayaCode);
    
    // البحث بالاسم
    const found = communes.find(c => 
      c.name?.toLowerCase().includes(communeName.toLowerCase()) ||
      communeName.toLowerCase().includes(c.name?.toLowerCase())
    );
    
    return found;
  } catch (error) {
    console.warn('⚠️ خطأ في البحث عن البلدية:', error.message);
    return null;
  }
};

// دالة لإضافة الأسعار إلى Firebase
const addPricingToFirebase = async (pricingData) => {
  console.log('\n💰 بدء إضافة الأسعار إلى Firebase...');
  
  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  
  for (const pricing of pricingData) {
    try {
      console.log(`\n🔍 معالجة: ${pricing.wilayaName} - ${pricing.communeName}`);
      
      // البحث عن الولاية
      const wilaya = await findWilayaByName(pricing.wilayaName);
      if (!wilaya) {
        console.log(`❌ لم يتم العثور على ولاية: ${pricing.wilayaName}`);
        notFoundCount++;
        continue;
      }
      
      console.log(`✅ تم العثور على ولاية: ${wilaya.name} (${wilaya.code})`);
      
      // البحث عن البلدية (إذا كانت مختلفة عن الولاية)
      let commune = null;
      if (pricing.communeName !== pricing.wilayaName) {
        commune = await findCommuneByName(wilaya.code, pricing.communeName);
        if (!commune) {
          console.log(`⚠️ لم يتم العثور على بلدية: ${pricing.communeName} في ${wilaya.name}`);
          // سنضيف السعر للولاية بدلاً من البلدية
        } else {
          console.log(`✅ تم العثور على بلدية: ${commune.name}`);
        }
      }
      
      // إنشاء بيانات السعر
      const pricingRecord = {
        service: pricing.service,
        wilayaCode: wilaya.code,
        wilayaName: wilaya.name,
        commune: commune ? commune.name : wilaya.name,
        communeCode: commune ? commune.code : wilaya.code,
        pricing: {
          home: Math.round(pricing.homePrice),
          office: Math.round(pricing.officePrice),
          supplements: {
            codFeePercentage: 1, // 1% من القيمة المعلنة
            codFeeFixed: 0,
            overweightFee: 250, // رسوم الوزن الزائد
            overweightThreshold: 5 // أكثر من 5 كيلو
          }
        },
        zone: getZoneByRegion(wilaya.geography?.region),
        metadata: {
          dataSource: 'google-sheets-import',
          createdBy: 'pricing-import-script',
          originalWilayaName: pricing.wilayaName,
          originalCommuneName: pricing.communeName
        }
      };
      
      // حفظ السعر في Firebase
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
  console.log(`📍 المجموع: ${pricingData.length}`);
  
  return { successCount, errorCount, notFoundCount };
};

// دالة لتحديد المنطقة حسب الإقليم
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

// دالة لعرض عينة من الأسعار المضافة
const showSamplePricing = async () => {
  try {
    console.log('\n📋 عينة من الأسعار المضافة:');
    
    const yalidinePrice = await firebaseService.getServicePricing('yalidine');
    
    if (yalidinePrice.length > 0) {
      console.log(`💰 تم العثور على ${yalidinePrice.length} سعر ليالدين`);
      
      // عرض أول 5 أسعار
      const sample = yalidinePrice.slice(0, 5);
      sample.forEach((price, index) => {
        console.log(`${index + 1}. ${price.wilayaName} - ${price.commune}`);
        console.log(`   🏠 ${price.pricing.home} دج | 🏢 ${price.pricing.office} دج`);
      });
    } else {
      console.log('⚠️ لم يتم العثور على أسعار');
    }
    
  } catch (error) {
    console.error('❌ خطأ في عرض الأسعار:', error.message);
  }
};

// الدالة الرئيسية
const importPricingFromSheets = async () => {
  try {
    console.log('🚀 بدء استيراد أسعار التوصيل من Google Sheets...');
    console.log('=' .repeat(60));
    
    // 1. اختبار اتصال Firebase
    console.log('\n🔥 1. اختبار اتصال Firebase...');
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.success) {
      throw new Error('فشل الاتصال بـ Firebase: ' + connectionTest.error);
    }
    console.log('✅ Firebase متصل ويعمل');
    
    // 2. قراءة البيانات من Google Sheets
    console.log('\n 2. قراءة البيانات من Google Sheets...');
    const sheetsData = await fetchSheetsData();
    
    // 3. تحليل البيانات
    console.log('\n🔍 3. تحليل البيانات...');
    const pricingData = parseSheetData(sheetsData);
    
    if (pricingData.length === 0) {
      throw new Error('لا توجد بيانات أسعار صالحة في الجدول');
    }
    
    // 4. إضافة الأسعار إلى Firebase
    console.log('\n💰 4. إضافة الأسعار إلى Firebase...');
    const results = await addPricingToFirebase(pricingData);
    
    // 5. عرض عينة من النتائج
    console.log('\n📋 5. عرض عينة من النتائج...');
    await showSamplePricing();
    
    console.log('\n🎉 تم الانتهاء من استيراد الأسعار بنجاح!');
    console.log(`✅ تم إضافة ${results.successCount} سعر من أصل ${pricingData.length}`);
    console.log('🔥 Firebase جاهز مع أسعار التوصيل الكاملة');
    
  } catch (error) {
    console.error('💥 خطأ في استيراد الأسعار:', error.message);
  }
};

// تشغيل السكريبت
importPricingFromSheets();
