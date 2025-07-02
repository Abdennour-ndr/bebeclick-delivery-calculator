/**
 * استيراد مباشر من Excel إلى Firebase بدون البحث في الولايات
 */

import XLSX from 'xlsx';
import firebaseService from './src/services/firebaseService.js';

const EXCEL_FILE_PATH = './PFA Yal 06_25.xlsx';

// قراءة ملف Excel
const readExcelFile = (filePath) => {
  try {
    console.log('📊 قراءة ملف Excel...');
    
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`✅ تم قراءة ${data.length} صف من ${firstSheetName}`);
    
    // عرض أول 5 صفوف
    console.log('\n📋 عينة من البيانات:');
    data.slice(0, 5).forEach((row, index) => {
      console.log(`الصف ${index + 1}:`, row);
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ خطأ في قراءة Excel:', error.message);
    throw error;
  }
};

// تحليل البيانات
const parseExcelData = (data) => {
  console.log('\n🔍 تحليل بيانات Excel...');
  
  if (data.length < 2) {
    throw new Error('الملف يجب أن يحتوي على رأس وبيانات');
  }
  
  // البحث عن صف الرأس
  let headerRowIndex = 0;
  let headers = data[0];
  
  // إذا كان الصف الأول فارغ، جرب الثاني
  if (!headers || headers.length === 0) {
    headerRowIndex = 1;
    headers = data[1];
  }
  
  console.log('📋 رأس الجدول:', headers);
  
  // تحديد مؤشرات الأعمدة (تخمين ذكي)
  const columnIndices = {
    wilaya: 0,    // العمود الأول عادة الولاية
    commune: 1,   // العمود الثاني البلدية
    home: 2,      // العمود الثالث سعر المنزل
    office: 3     // العمود الرابع سعر المكتب
  };
  
  // إذا كان هناك أعمدة أكثر، جرب تحديد أفضل
  if (headers.length > 4) {
    headers.forEach((header, index) => {
      if (!header) return;
      
      const headerStr = header.toString().toLowerCase();
      
      if (headerStr.includes('home') || headerStr.includes('منزل') || 
          headerStr.includes('domicile') || headerStr.includes('maison')) {
        columnIndices.home = index;
      }
      
      if (headerStr.includes('office') || headerStr.includes('مكتب') || 
          headerStr.includes('bureau') || headerStr.includes('desk')) {
        columnIndices.office = index;
      }
    });
  }
  
  console.log('📍 مؤشرات الأعمدة:', columnIndices);
  
  const pricingData = [];
  
  // معالجة البيانات
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    
    if (!row || row.length === 0) continue;
    
    try {
      const wilayaName = row[columnIndices.wilaya]?.toString().trim();
      const communeName = row[columnIndices.commune]?.toString().trim();
      const homePrice = parseFloat(row[columnIndices.home]) || 0;
      const officePrice = parseFloat(row[columnIndices.office]) || 0;
      
      if (wilayaName && homePrice > 0) {
        pricingData.push({
          wilayaName,
          communeName: communeName || wilayaName,
          homePrice,
          officePrice: officePrice > 0 ? officePrice : homePrice - 100,
          service: 'yalidine',
          rowNumber: i + 1
        });
      }
      
    } catch (error) {
      console.warn(`⚠️ خطأ في تحليل الصف ${i + 1}:`, error.message);
    }
  }
  
  console.log(`✅ تم تحليل ${pricingData.length} سعر من الملف`);
  
  // عرض عينة
  if (pricingData.length > 0) {
    console.log('\n📋 عينة من البيانات المحللة:');
    pricingData.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.wilayaName} - ${item.communeName}: 🏠 ${item.homePrice} دج | 🏢 ${item.officePrice} دج`);
    });
  }
  
  return pricingData;
};

// إضافة الأسعار مباشرة إلى Firebase
const addPricingDirectly = async (pricingData) => {
  console.log('\n💰 إضافة الأسعار مباشرة إلى Firebase...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const pricing of pricingData) {
    try {
      console.log(`\n💾 إضافة: ${pricing.wilayaName} - ${pricing.communeName}`);
      
      // إنشاء بيانات السعر مباشرة
      const pricingRecord = {
        service: pricing.service,
        wilayaName: pricing.wilayaName,
        commune: pricing.communeName,
        pricing: {
          home: Math.round(pricing.homePrice),
          office: Math.round(pricing.officePrice),
          supplements: {
            codFeePercentage: 1,
            codFeeFixed: 0,
            overweightFee: 250,
            overweightThreshold: 5
          }
        },
        zone: getZoneByWilayaName(pricing.wilayaName),
        metadata: {
          dataSource: 'excel-direct-import',
          createdBy: 'direct-import-script',
          originalWilayaName: pricing.wilayaName,
          originalCommuneName: pricing.communeName,
          excelRowNumber: pricing.rowNumber
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
      console.error(`❌ خطأ في معالجة الصف ${pricing.rowNumber}:`, error.message);
    }
  }
  
  console.log(`\n📊 نتائج الإضافة المباشرة:`);
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  console.log(`📍 المجموع: ${pricingData.length}`);
  
  return { successCount, errorCount };
};

// تحديد المنطقة حسب اسم الولاية
const getZoneByWilayaName = (wilayaName) => {
  const wilayaLower = wilayaName.toLowerCase();
  
  // المنطقة الوسطى (1)
  const centre = ['alger', 'blida', 'bouira', 'médéa', 'djelfa', 'laghouat', 'biskra', 'msila', 'ain defla'];
  if (centre.some(w => wilayaLower.includes(w))) return 1;
  
  // الشمال (2)
  const nord = ['béjaïa', 'tizi ouzou', 'boumerdès', 'tipaza', 'chlef', 'jijel', 'skikda', 'annaba'];
  if (nord.some(w => wilayaLower.includes(w))) return 2;
  
  // الشرق والغرب (3)
  const estOuest = ['constantine', 'sétif', 'batna', 'oum el bouaghi', 'guelma', 'souk ahras', 'tébessa', 'khenchela', 'mila', 'bordj bou arréridj', 'el tarf', 'oran', 'tlemcen', 'sidi bel abbès', 'mostaganem', 'mascara', 'relizane', 'saïda', 'tiaret', 'tissemsilt', 'aïn témouchent', 'el bayadh', 'naâma'];
  if (estOuest.some(w => wilayaLower.includes(w))) return 3;
  
  // الجنوب (4)
  return 4;
};

// الدالة الرئيسية
const importDirectly = async () => {
  try {
    console.log('🚀 استيراد مباشر من Excel إلى Firebase...');
    console.log('=' .repeat(60));
    
    // 1. اختبار Firebase
    console.log('\n🔥 1. اختبار اتصال Firebase...');
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.success) {
      throw new Error('فشل الاتصال بـ Firebase: ' + connectionTest.error);
    }
    console.log('✅ Firebase متصل ويعمل');
    
    // 2. قراءة Excel
    console.log('\n📊 2. قراءة ملف Excel...');
    const excelData = readExcelFile(EXCEL_FILE_PATH);
    
    // 3. تحليل البيانات
    console.log('\n🔍 3. تحليل البيانات...');
    const pricingData = parseExcelData(excelData);
    
    if (pricingData.length === 0) {
      throw new Error('لا توجد بيانات أسعار صالحة في الملف');
    }
    
    // 4. إضافة الأسعار مباشرة
    console.log('\n💰 4. إضافة الأسعار مباشرة إلى Firebase...');
    const results = await addPricingDirectly(pricingData);
    
    console.log('\n🎉 تم الانتهاء من الاستيراد المباشر!');
    console.log(`✅ تم إضافة ${results.successCount} سعر من أصل ${pricingData.length}`);
    console.log('🔥 Firebase يحتوي الآن على أسعار التوصيل من Excel');
    console.log('📝 ملاحظة: الأسعار مضافة مباشرة بدون ربط بالولايات الموجودة');
    
  } catch (error) {
    console.error('💥 خطأ في الاستيراد المباشر:', error.message);
  }
};

// تشغيل السكريبت
importDirectly();
