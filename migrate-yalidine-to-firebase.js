/**
 * توحيد أسعار Yalidine من yalidineService.js إلى Firebase
 * مسح البيانات المتضاربة وإضافة البيانات الصحيحة
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDzv7w2s--bZMIVdmg0Aog0l3vtmNhJPEI",
  authDomain: "bebeclick-delivery-calculator.firebaseapp.com",
  projectId: "bebeclick-delivery-calculator",
  storageBucket: "bebeclick-delivery-calculator.firebasestorage.app",
  messagingSenderId: "840872804453",
  appId: "1:840872804453:web:d1afbd0fab5dc904e9868c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// قراءة بيانات yalidineService.js
function extractYalidinePricing() {
  const filePath = path.join(process.cwd(), 'src/services/yalidineService.js');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // استخراج البيانات من الملف
  const pricingMatch = fileContent.match(/const YALIDINE_PRICING\s*=\s*{([\s\S]*?)};/);
  if (!pricingMatch) {
    throw new Error('لم يتم العثور على بيانات YALIDINE_PRICING في yalidineService.js');
  }

  // تحويل النص إلى كائن JavaScript
  const pricingText = `{${pricingMatch[1]}}`;
  const pricing = eval(`(${pricingText})`);

  return pricing;
}

// تحويل بيانات yalidineService إلى تنسيق Firebase
function convertToFirebaseFormat(yalidineData) {
  const firebaseData = [];
  
  Object.entries(yalidineData).forEach(([wilayaCode, wilayaData]) => {
    const wilayaCodeNum = parseInt(wilayaCode);
    
    Object.entries(wilayaData.communes).forEach(([communeName, pricing]) => {
      firebaseData.push({
        service: 'yalidine',
        wilayaCode: wilayaCodeNum,
        wilayaName: wilayaData.name,
        commune: communeName,
        zone: getWilayaZone(wilayaCodeNum),
        pricing: {
          home: pricing.home,
          office: pricing.office,
          supplements: {
            codFeePercentage: 2,
            codFeeFixed: 0,
            overweightFee: getOverweightFee(getWilayaZone(wilayaCodeNum)),
            overweightThreshold: 5
          }
        },
        status: 'active',
        metadata: {
          dataSource: 'yalidine-service-migration',
          createdBy: 'migration-script',
          lastUpdated: new Date()
        }
      });
    });
  });
  
  return firebaseData;
}

// تحديد المنطقة حسب الولاية
function getWilayaZone(wilayaCode) {
  const zoneMapping = {
    // Zone 1: Alger, Blida, Boumerdes, Tipaza
    16: 1, 9: 1, 35: 1, 42: 1,
    
    // Zone 2: Nord du pays
    2: 2, 6: 2, 13: 2, 15: 2, 18: 2, 19: 2, 21: 2, 22: 2, 23: 2, 24: 2, 25: 2, 26: 2, 27: 2, 29: 2, 31: 2, 34: 2, 36: 2, 38: 2, 41: 2, 43: 2, 44: 2, 46: 2, 48: 2,
    
    // Zone 3: Centre du pays
    4: 3, 5: 3, 12: 3, 14: 3, 17: 3, 20: 3, 28: 3, 40: 3,
    
    // Zone 4: Sud du pays
    1: 4, 3: 4, 7: 4, 8: 4, 11: 4, 30: 4, 32: 4, 33: 4, 37: 4, 39: 4, 45: 4, 47: 4
  };
  
  return zoneMapping[wilayaCode] || 3;
}

// تحديد رسوم الوزن الزائد حسب المنطقة
function getOverweightFee(zone) {
  return (zone === 4 || zone === 5) ? 100 : 50;
}

// مسح جميع أسعار Yalidine الموجودة في Firebase
async function clearExistingYalidinePrices() {
  console.log('🗑️ مسح أسعار Yalidine الموجودة في Firebase...');
  
  const q = query(
    collection(db, 'delivery_pricing'),
    where('service', '==', 'yalidine')
  );
  
  const querySnapshot = await getDocs(q);
  const deletePromises = [];
  
  querySnapshot.forEach((docSnapshot) => {
    deletePromises.push(deleteDoc(doc(db, 'delivery_pricing', docSnapshot.id)));
  });
  
  await Promise.all(deletePromises);
  console.log(`✅ تم مسح ${deletePromises.length} سعر Yalidine من Firebase`);
}

// إضافة البيانات الجديدة إلى Firebase
async function addPricesToFirebase(pricingData) {
  console.log('📝 إضافة أسعار Yalidine الجديدة إلى Firebase...');
  
  const batchSize = 500; // حد Firebase للـ batch
  let addedCount = 0;
  
  for (let i = 0; i < pricingData.length; i += batchSize) {
    const batch = writeBatch(db);
    const batchData = pricingData.slice(i, i + batchSize);
    
    batchData.forEach((priceData) => {
      const docRef = doc(collection(db, 'delivery_pricing'));
      batch.set(docRef, {
        ...priceData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await batch.commit();
    addedCount += batchData.length;
    console.log(`✅ تم إضافة ${addedCount}/${pricingData.length} سعر`);
  }
  
  return addedCount;
}

// الدالة الرئيسية للتوحيد
async function migrateYalidineToFirebase() {
  try {
    console.log('🚀 بدء توحيد أسعار Yalidine إلى Firebase...');
    
    // 1. قراءة البيانات من yalidineService.js
    console.log('📖 قراءة البيانات من yalidineService.js...');
    const yalidineData = extractYalidinePricing();
    console.log(`✅ تم العثور على ${Object.keys(yalidineData).length} ولاية`);
    
    // 2. تحويل البيانات إلى تنسيق Firebase
    console.log('🔄 تحويل البيانات إلى تنسيق Firebase...');
    const firebaseData = convertToFirebaseFormat(yalidineData);
    console.log(`✅ تم تحويل ${firebaseData.length} سعر`);
    
    // 3. مسح البيانات الموجودة
    await clearExistingYalidinePrices();
    
    // 4. إضافة البيانات الجديدة
    const addedCount = await addPricesToFirebase(firebaseData);
    
    console.log('\n🎉 تم الانتهاء من التوحيد بنجاح!');
    console.log(`📊 الإحصائيات:`);
    console.log(`   - عدد الولايات: ${Object.keys(yalidineData).length}`);
    console.log(`   - عدد الأسعار المضافة: ${addedCount}`);
    
    // 5. عرض عينة من البيانات
    console.log('\n📋 عينة من البيانات المضافة:');
    firebaseData.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.wilayaName} - ${item.commune}: ${item.pricing.home}دج (منزل), ${item.pricing.office}دج (مكتب)`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في التوحيد:', error);
    throw error;
  }
}

// تشغيل التوحيد
migrateYalidineToFirebase()
  .then(() => {
    console.log('\n✅ تم التوحيد بنجاح - Firebase هو الآن المصدر الوحيد للأسعار');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل التوحيد:', error);
    process.exit(1);
  });
