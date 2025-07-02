/**
 * استيراد أسعار التوصيل من ملف Excel إلى Firebase
 */

import XLSX from 'xlsx';
import firebaseService from './src/services/firebaseService.js';
import path from 'path';

// مسار ملف Excel
const EXCEL_FILE_PATH = './PFA Yal 06_25.xlsx';

// دالة لقراءة ملف Excel
const readExcelFile = (filePath) => {
  try {
    console.log('📊 قراءة ملف Excel...');
    console.log('📁 المسار:', filePath);
    
    // قراءة الملف
    const workbook = XLSX.readFile(filePath);
    
    // الحصول على أسماء الأوراق
    const sheetNames = workbook.SheetNames;
    console.log('📋 أوراق العمل الموجودة:', sheetNames);
    
    // قراءة الورقة الأولى
    const firstSheetName = sheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // تحويل إلى JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`✅ تم قراءة ${data.length} صف من الورقة: ${firstSheetName}`);
    
    // عرض أول 3 صفوف للمراجعة
    console.log('\n📋 عينة من البيانات:');
    data.slice(0, 3).forEach((row, index) => {
      console.log(`الصف ${index + 1}:`, row);
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ خطأ في قراءة ملف Excel:', error.message);
    throw error;
  }
};

// دالة لتحليل البيانات
const parseExcelData = (data) => {
  console.log('\n🔍 تحليل بيانات Excel...');
  
  if (data.length < 2) {
    throw new Error('الملف يجب أن يحتوي على رأس وبيانات');
  }
  
  // البحث عن صف الرأس
  let headerRowIndex = -1;
  let headers = [];
  
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (row && row.length > 0) {
      // البحث عن كلمات مفتاحية في الرأس
      const rowStr = row.join(' ').toLowerCase();
      if (rowStr.includes('wilaya') || rowStr.includes('ولاية') || 
          rowStr.includes('commune') || rowStr.includes('بلدية') ||
          rowStr.includes('home') || rowStr.includes('منزل') ||
          rowStr.includes('office') || rowStr.includes('مكتب')) {
        headerRowIndex = i;
        headers = row;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) {
    console.log('⚠️ لم يتم العثور على رأس واضح، سأستخدم الصف الأول');
    headerRowIndex = 0;
    headers = data[0];
  }
  
  console.log('📋 رأس الجدول:', headers);
  
  // تحديد مؤشرات الأعمدة
  const columnIndices = {
    wilaya: -1,
    commune: -1,
    home: -1,
    office: -1
  };
  
  headers.forEach((header, index) => {
    if (!header) return;
    
    const headerStr = header.toString().toLowerCase();
    
    // البحث عن عمود الولاية
    if (headerStr.includes('wilaya') || headerStr.includes('ولاية') || 
        headerStr.includes('gouvernorat') || headerStr.includes('province')) {
      columnIndices.wilaya = index;
    }
    
    // البحث عن عمود البلدية
    if (headerStr.includes('commune') || headerStr.includes('بلدية') || 
        headerStr.includes('city') || headerStr.includes('ville')) {
      columnIndices.commune = index;
    }
    
    // البحث عن عمود سعر المنزل
    if (headerStr.includes('home') || headerStr.includes('منزل') || 
        headerStr.includes('domicile') || headerStr.includes('maison')) {
      columnIndices.home = index;
    }
    
    // البحث عن عمود سعر المكتب
    if (headerStr.includes('office') || headerStr.includes('مكتب') || 
        headerStr.includes('bureau') || headerStr.includes('desk')) {
      columnIndices.office = index;
    }
  });
  
  console.log('📍 مؤشرات الأعمدة:', columnIndices);
  
  // إذا لم نجد أعمدة واضحة، نحاول التخمين
  if (columnIndices.wilaya === -1 || columnIndices.home === -1) {
    console.log('⚠️ لم يتم العثور على أعمدة واضحة، سأحاول التخمين...');
    
    // افتراض أن الأعمدة الأولى هي: ولاية، بلدية، منزل، مكتب
    if (headers.length >= 3) {
      columnIndices.wilaya = 0;
      columnIndices.commune = 1;
      columnIndices.home = 2;
      columnIndices.office = headers.length > 3 ? 3 : 2;
    }
  }
  
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
  
  // عرض عينة من البيانات المحللة
  if (pricingData.length > 0) {
    console.log('\n📋 عينة من البيانات المحللة:');
    pricingData.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.wilayaName} - ${item.communeName}: 🏠 ${item.homePrice} دج | 🏢 ${item.officePrice} دج`);
    });
  }
  
  return pricingData;
};

// دالة للبحث عن الولاية في Firebase
const findWilayaByName = async (wilayaName) => {
  try {
    const wilayas = await firebaseService.getWilayas();
    
    // تنظيف اسم الولاية
    const cleanWilayaName = wilayaName.toLowerCase()
      .replace(/wilaya/gi, '')
      .replace(/ولاية/gi, '')
      .trim();
    
    // البحث بطرق متعددة
    const found = wilayas.find(w => {
      const wName = w.name?.toLowerCase();
      const wNameAr = w.nameAr?.toLowerCase();
      
      return wName === cleanWilayaName ||
             wNameAr?.includes(cleanWilayaName) ||
             cleanWilayaName.includes(wName) ||
             wName?.includes(cleanWilayaName);
    });
    
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
    
    const cleanCommuneName = communeName.toLowerCase().trim();
    
    const found = communes.find(c => {
      const cName = c.name?.toLowerCase();
      return cName === cleanCommuneName ||
             cName?.includes(cleanCommuneName) ||
             cleanCommuneName.includes(cName);
    });
    
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
      console.log(`\n🔍 معالجة الصف ${pricing.rowNumber}: ${pricing.wilayaName} - ${pricing.communeName}`);
      
      // البحث عن الولاية
      const wilaya = await findWilayaByName(pricing.wilayaName);
      if (!wilaya) {
        console.log(`❌ لم يتم العثور على ولاية: ${pricing.wilayaName}`);
        notFoundCount++;
        continue;
      }
      
      console.log(`✅ تم العثور على ولاية: ${wilaya.name} (${wilaya.code})`);
      
      // البحث عن البلدية
      let commune = null;
      if (pricing.communeName !== pricing.wilayaName) {
        commune = await findCommuneByName(wilaya.code, pricing.communeName);
        if (!commune) {
          console.log(`⚠️ لم يتم العثور على بلدية: ${pricing.communeName}`);
        } else {
          console.log(`✅ تم العثور على بلدية: ${commune.name}`);
        }
      }
      
      // إنشاء بيانات السعر
      const pricingRecord = {
        service: pricing.service,
        wilayaCode: wilaya.code,
        wilayaName: wilaya.name,
        commune: commune ? commune.name : pricing.communeName,
        communeCode: commune ? commune.code : wilaya.code,
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
        zone: getZoneByRegion(wilaya.geography?.region),
        metadata: {
          dataSource: 'excel-import',
          createdBy: 'excel-import-script',
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
  
  console.log(`\n📊 نتائج إضافة الأسعار:`);
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  console.log(`🔍 غير موجود: ${notFoundCount}`);
  console.log(`📍 المجموع: ${pricingData.length}`);
  
  return { successCount, errorCount, notFoundCount };
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

// الدالة الرئيسية
const importExcelPricing = async () => {
  try {
    console.log('🚀 بدء استيراد أسعار التوصيل من Excel...');
    console.log('=' .repeat(60));
    
    // 1. اختبار اتصال Firebase
    console.log('\n🔥 1. اختبار اتصال Firebase...');
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.success) {
      throw new Error('فشل الاتصال بـ Firebase: ' + connectionTest.error);
    }
    console.log('✅ Firebase متصل ويعمل');
    
    // 2. قراءة ملف Excel
    console.log('\n📊 2. قراءة ملف Excel...');
    const excelData = readExcelFile(EXCEL_FILE_PATH);
    
    // 3. تحليل البيانات
    console.log('\n🔍 3. تحليل البيانات...');
    const pricingData = parseExcelData(excelData);
    
    if (pricingData.length === 0) {
      throw new Error('لا توجد بيانات أسعار صالحة في الملف');
    }
    
    // 4. إضافة الأسعار إلى Firebase
    console.log('\n💰 4. إضافة الأسعار إلى Firebase...');
    const results = await addPricingToFirebase(pricingData);
    
    console.log('\n🎉 تم الانتهاء من استيراد الأسعار بنجاح!');
    console.log(`✅ تم إضافة ${results.successCount} سعر من أصل ${pricingData.length}`);
    console.log('🔥 Firebase جاهز مع أسعار التوصيل من Excel');
    
  } catch (error) {
    console.error('💥 خطأ في استيراد الأسعار:', error.message);
  }
};

// تشغيل السكريبت
importExcelPricing();
