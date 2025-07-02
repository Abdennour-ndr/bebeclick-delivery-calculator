/**
 * التحقق من أن الأسعار في Firebase تطابق ملف CSV
 */

import fs from 'fs';
import firebaseService from './src/services/firebaseService.js';

// قراءة وتحليل ملف CSV
const parseCSV = (filePath) => {
  console.log(`📄 قراءة ملف CSV: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // تخطي الأسطر الفارغة والعناوين
  const dataLines = lines.slice(2); // تخطي السطرين الأولين
  
  const data = [];
  
  for (const line of dataLines) {
    const columns = line.split(',');
    
    if (columns.length >= 5) {
      const region = columns[0]?.trim();
      const wilayaName = columns[1]?.trim();
      const communeName = columns[2]?.trim();
      const officePrice = columns[3]?.trim();
      const homePrice = columns[4]?.trim();
      
      if (wilayaName && communeName && region) {
        data.push({
          region,
          wilayaName,
          communeName,
          officePrice: parsePrice(officePrice),
          homePrice: parsePrice(homePrice)
        });
      }
    }
  }
  
  console.log(`✅ تم تحليل ${data.length} سجل من CSV`);
  return data;
};

// تحويل السعر من نص إلى رقم
const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  
  // إزالة "DA" والمسافات والفواصل
  const cleanPrice = priceStr.replace(/DA|,|\s/g, '');
  const price = parseInt(cleanPrice);
  
  return isNaN(price) ? 0 : price;
};

// التحقق من أسعار ولاية الجزائر
const verifyAlgerPricing = async () => {
  console.log('\n🔍 التحقق من أسعار ولاية الجزائر...');
  
  try {
    // جلب بلديات الجزائر من Firebase
    const firebaseCommunes = await firebaseService.getCommunesByWilaya(16);
    console.log(`📍 ${firebaseCommunes.length} بلدية في Firebase`);
    
    // قراءة بيانات CSV
    const csvData = parseCSV('Wilaya Commune DB.xlsx - Copie de Feuille 1.csv');
    const algerCSVData = csvData.filter(item => item.wilayaName === 'Alger');
    console.log(`📄 ${algerCSVData.length} بلدية في CSV`);
    
    console.log('\n📊 مقارنة الأسعار:');
    console.log('=' .repeat(80));
    
    let matchCount = 0;
    let mismatchCount = 0;
    
    // فحص عينة من البلديات
    const sampleCommunes = firebaseCommunes.slice(0, 10);
    
    for (const fbCommune of sampleCommunes) {
      const csvCommune = algerCSVData.find(c => 
        c.communeName.toLowerCase() === fbCommune.name.toLowerCase()
      );
      
      if (csvCommune) {
        const fbOffice = fbCommune.pricing?.yalidine?.office || 0;
        const fbHome = fbCommune.pricing?.yalidine?.home || 0;
        const csvOffice = csvCommune.officePrice;
        const csvHome = csvCommune.homePrice;
        
        const officeMatch = fbOffice === csvOffice;
        const homeMatch = fbHome === csvHome;
        
        if (officeMatch && homeMatch) {
          matchCount++;
          console.log(`✅ ${fbCommune.name}: مكتب=${fbOffice}DA, منزل=${fbHome}DA`);
        } else {
          mismatchCount++;
          console.log(`❌ ${fbCommune.name}:`);
          console.log(`   Firebase: مكتب=${fbOffice}DA, منزل=${fbHome}DA`);
          console.log(`   CSV:      مكتب=${csvOffice}DA, منزل=${csvHome}DA`);
        }
      } else {
        console.log(`⚠️ ${fbCommune.name}: غير موجود في CSV`);
      }
    }
    
    console.log('\n📈 النتائج:');
    console.log(`✅ متطابق: ${matchCount}`);
    console.log(`❌ غير متطابق: ${mismatchCount}`);
    
    return { matchCount, mismatchCount };
    
  } catch (error) {
    console.error('💥 خطأ في التحقق:', error);
    return null;
  }
};

// التحقق من أسعار عشوائية من ولايات مختلفة
const verifyRandomPricing = async () => {
  console.log('\n🎲 التحقق من أسعار عشوائية...');
  
  try {
    const csvData = parseCSV('Wilaya Commune DB.xlsx - Copie de Feuille 1.csv');
    
    // اختيار عينة عشوائية
    const randomSamples = [
      { wilayaCode: 31, wilayaName: 'Oran' },
      { wilayaCode: 25, wilayaName: 'Constantine' },
      { wilayaCode: 9, wilayaName: 'Blida' }
    ];
    
    for (const sample of randomSamples) {
      console.log(`\n📍 فحص ${sample.wilayaName}:`);
      
      const firebaseCommunes = await firebaseService.getCommunesByWilaya(sample.wilayaCode);
      const csvCommunes = csvData.filter(c => c.wilayaName === sample.wilayaName);
      
      if (firebaseCommunes.length > 0 && csvCommunes.length > 0) {
        const fbCommune = firebaseCommunes[0];
        const csvCommune = csvCommunes[0];
        
        console.log(`Firebase: ${fbCommune.name} - مكتب=${fbCommune.pricing?.yalidine?.office}DA, منزل=${fbCommune.pricing?.yalidine?.home}DA`);
        console.log(`CSV: ${csvCommune.communeName} - مكتب=${csvCommune.officePrice}DA, منزل=${csvCommune.homePrice}DA`);
      }
    }
    
  } catch (error) {
    console.error('💥 خطأ في الفحص العشوائي:', error);
  }
};

// الدالة الرئيسية
const runVerification = async () => {
  try {
    console.log('🔍 بدء التحقق من صحة الأسعار...');
    console.log('=' .repeat(60));
    
    // اختبار الاتصال
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.success) {
      console.error('❌ فشل الاتصال بـ Firebase:', connectionTest.error);
      return;
    }
    
    console.log('✅ Firebase متصل ويعمل');
    
    // التحقق من أسعار الجزائر
    const algerResults = await verifyAlgerPricing();
    
    // التحقق من أسعار عشوائية
    await verifyRandomPricing();
    
    console.log('\n🎉 انتهى التحقق!');
    
    if (algerResults && algerResults.matchCount > algerResults.mismatchCount) {
      console.log('✅ الأسعار تبدو صحيحة ومطابقة لملف CSV');
    } else {
      console.log('⚠️ هناك اختلافات في الأسعار تحتاج مراجعة');
    }
    
  } catch (error) {
    console.error('💥 خطأ في التحقق:', error);
  }
};

// تشغيل التحقق
runVerification();
