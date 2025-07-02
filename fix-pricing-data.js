/**
 * إصلاح بيانات الأسعار في Firebase
 */

import fs from 'fs';
import firebaseService from './src/services/firebaseService.js';
import { db } from './src/config/firebase.js';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

// حذف جميع البيانات الموجودة
const clearAllData = async () => {
  console.log('\n🗑️ حذف جميع البيانات الموجودة...');
  
  try {
    const locationsRef = collection(db, 'locations');
    const snapshot = await getDocs(locationsRef);
    
    console.log(`📊 عدد المستندات للحذف: ${snapshot.size}`);
    
    let deletedCount = 0;
    const deletePromises = [];
    
    snapshot.forEach((docSnapshot) => {
      const deletePromise = deleteDoc(doc(db, 'locations', docSnapshot.id));
      deletePromises.push(deletePromise);
    });
    
    await Promise.all(deletePromises);
    deletedCount = snapshot.size;
    
    console.log(`✅ تم حذف ${deletedCount} مستند`);
    return deletedCount;
    
  } catch (error) {
    console.error('❌ خطأ في حذف البيانات:', error);
    return 0;
  }
};

// إعادة حفظ البيانات بشكل صحيح
const reimportData = async () => {
  console.log('\n📥 إعادة حفظ البيانات...');
  
  try {
    // قراءة CSV
    const csvData = parseCSV('Wilaya Commune DB.xlsx - Copie de Feuille 1.csv');
    
    // فلترة بيانات الجزائر للاختبار
    const algerData = csvData.filter(item => item.wilayaName === 'Alger');
    console.log(`📍 بيانات الجزائر: ${algerData.length} بلدية`);
    
    // عرض عينة من البيانات
    console.log('\n📋 عينة من البيانات:');
    algerData.slice(0, 5).forEach(item => {
      console.log(`  ${item.communeName}: مكتب=${item.officePrice}DA, منزل=${item.homePrice}DA`);
    });
    
    // حفظ ولاية الجزائر أولاً
    const wilayaDoc = {
      code: 16,
      name: 'Alger',
      nameAr: 'الجزائر',
      geography: {
        region: 'centre'
      },
      deliveryConfig: {
        pricingZone: 1,
        availableServices: [
          { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true }
        ]
      },
      metadata: {
        dataSource: 'csv-import-fixed',
        createdBy: 'fix-pricing-script',
        communesCount: algerData.length
      }
    };
    
    await firebaseService.addWilaya(wilayaDoc);
    console.log(`✅ تم حفظ ولاية الجزائر`);
    
    // حفظ البلديات
    let successCount = 0;
    for (let i = 0; i < algerData.length; i++) {
      try {
        const commune = algerData[i];
        const communeCode = 16000 + (i + 1);
        
        const communeDoc = {
          code: communeCode,
          name: commune.communeName,
          geography: {
            region: 'centre'
          },
          hierarchy: {
            wilayaCode: 16
          },
          pricing: {
            yalidine: {
              office: commune.officePrice,
              home: commune.homePrice
            }
          },
          deliveryConfig: {
            pricingZone: 1,
            availableServices: [
              { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: commune.officePrice > 0 }
            ]
          },
          metadata: {
            dataSource: 'csv-import-fixed',
            createdBy: 'fix-pricing-script'
          }
        };
        
        await firebaseService.addCommune(16, communeDoc);
        successCount++;
        console.log(`  ✅ ${commune.communeName} (${communeCode}) - مكتب: ${commune.officePrice}DA, منزل: ${commune.homePrice}DA`);
        
      } catch (error) {
        console.error(`  ❌ خطأ في حفظ ${commune.communeName}:`, error.message);
      }
    }
    
    console.log(`\n📊 نتائج إعادة الحفظ:`);
    console.log(`✅ نجح: ${successCount}`);
    console.log(`❌ فشل: ${algerData.length - successCount}`);
    
    return successCount;
    
  } catch (error) {
    console.error('💥 خطأ في إعادة الحفظ:', error);
    return 0;
  }
};

// التحقق من النتائج
const verifyResults = async () => {
  console.log('\n🔍 التحقق من النتائج...');
  
  try {
    const firebaseCommunes = await firebaseService.getCommunesByWilaya(16);
    console.log(`📍 عدد البلديات في Firebase: ${firebaseCommunes.length}`);
    
    // فحص عينة من البلديات
    const sampleCommunes = firebaseCommunes.slice(0, 5);
    console.log('\n📋 عينة من النتائج:');
    
    sampleCommunes.forEach(commune => {
      const office = commune.pricing?.yalidine?.office || 0;
      const home = commune.pricing?.yalidine?.home || 0;
      console.log(`  ${commune.name}: مكتب=${office}DA, منزل=${home}DA`);
    });
    
    // التحقق من أن جميع الأسعار صحيحة
    const correctPrices = firebaseCommunes.filter(c => 
      c.pricing?.yalidine?.office === 700 && c.pricing?.yalidine?.home === 500
    );
    
    console.log(`\n📊 إحصائيات التحقق:`);
    console.log(`✅ بلديات بأسعار صحيحة: ${correctPrices.length}`);
    console.log(`❌ بلديات بأسعار خاطئة: ${firebaseCommunes.length - correctPrices.length}`);
    
    if (correctPrices.length === firebaseCommunes.length) {
      console.log('🎉 جميع الأسعار صحيحة!');
      return true;
    } else {
      console.log('⚠️ هناك أسعار خاطئة تحتاج إصلاح');
      return false;
    }
    
  } catch (error) {
    console.error('💥 خطأ في التحقق:', error);
    return false;
  }
};

// الدالة الرئيسية
const fixPricingData = async () => {
  try {
    console.log('🔧 بدء إصلاح بيانات الأسعار...');
    console.log('=' .repeat(60));
    
    // اختبار الاتصال
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.success) {
      console.error('❌ فشل الاتصال بـ Firebase:', connectionTest.error);
      return;
    }
    
    console.log('✅ Firebase متصل ويعمل');
    
    // حذف البيانات الموجودة
    const deletedCount = await clearAllData();
    
    // إعادة حفظ البيانات
    const savedCount = await reimportData();
    
    // التحقق من النتائج
    const isCorrect = await verifyResults();
    
    console.log('\n🎉 انتهى إصلاح البيانات!');
    console.log(`🗑️ تم حذف: ${deletedCount} مستند`);
    console.log(`💾 تم حفظ: ${savedCount} بلدية`);
    console.log(`✅ النتيجة: ${isCorrect ? 'الأسعار صحيحة' : 'تحتاج مراجعة'}`);
    
  } catch (error) {
    console.error('💥 خطأ في إصلاح البيانات:', error);
  }
};

// تشغيل الإصلاح
fixPricingData();
