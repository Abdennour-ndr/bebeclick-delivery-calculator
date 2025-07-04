/**
 * استيراد الأسعار الصحيحة من الملف الجديد إلى Firebase
 * التنسيق: البلدية سعر_منزل/سعر_مكتب
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, getDocs } from 'firebase/firestore';
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

// تحليل سعر من التنسيق "البلدية سعر_منزل/سعر_مكتب"
function parsePrice(priceStr) {
  const match = priceStr.match(/(.+?)\s+(\d+)\/(\d+)/);
  if (match) {
    return {
      commune: match[1].trim(),
      home: parseInt(match[2]),
      office: parseInt(match[3])
    };
  }
  return null;
}

// مسح جميع البيانات الموجودة
async function clearAllPricing() {
  console.log('🧹 مسح جميع أسعار التوصيل من Firebase...');
  
  const collectionRef = collection(db, 'delivery_pricing');
  const snapshot = await getDocs(collectionRef);
  
  console.log(`📊 تم العثور على ${snapshot.size} وثيقة للمسح`);
  
  if (snapshot.size === 0) {
    console.log('✅ لا توجد وثائق للمسح');
    return;
  }
  
  const batchSize = 500;
  let deletedCount = 0;
  
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const batchDocs = docs.slice(i, i + batchSize);
    
    batchDocs.forEach((docSnapshot) => {
      batch.delete(doc(db, 'delivery_pricing', docSnapshot.id));
    });
    
    await batch.commit();
    deletedCount += batchDocs.length;
    console.log(`🗑️ تم مسح ${deletedCount}/${docs.length} وثيقة`);
  }
  
  console.log(`✅ تم مسح جميع الوثائق بنجاح: ${deletedCount} وثيقة`);
}

// قراءة وتحليل الملف الجديد
function parseNewCSV() {
  const filePath = path.join(process.cwd(), 'Feuille de calcul sans titre - Sheet2.csv');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  const lines = fileContent.split('\n');
  const pricingData = [];
  
  // تخطي السطر الأول (العناوين)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length < 3) continue;
    
    const wilayaCode = parseInt(columns[0]);
    const wilayaName = columns[1];
    
    if (!wilayaCode || !wilayaName) continue;
    
    const zone = getWilayaZone(wilayaCode);
    
    // تحليل جميع البلديات في هذا السطر
    for (let j = 2; j < columns.length; j++) {
      const priceStr = columns[j].trim();
      if (!priceStr) continue;
      
      const priceData = parsePrice(priceStr);
      if (!priceData) continue;
      
      pricingData.push({
        service: 'yalidine',
        wilayaCode: wilayaCode,
        wilayaName: wilayaName,
        commune: priceData.commune,
        zone: zone,
        pricing: {
          home: priceData.home,
          office: priceData.office,
          supplements: {
            codFeePercentage: 2,
            codFeeFixed: 0,
            overweightFee: getOverweightFee(zone),
            overweightThreshold: 5
          }
        },
        status: 'active',
        metadata: {
          dataSource: 'csv-new-correct-prices',
          createdBy: 'new-csv-import-script',
          lastUpdated: new Date()
        }
      });
    }
  }
  
  return pricingData;
}

// إضافة البيانات إلى Firebase
async function addPricesToFirebase(pricingData) {
  console.log('📝 إضافة الأسعار الصحيحة إلى Firebase...');
  
  const batchSize = 500;
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

// الدالة الرئيسية
async function importCorrectPricesNew() {
  try {
    console.log('🚀 بدء استيراد الأسعار الصحيحة من الملف الجديد...');
    
    // 1. مسح البيانات القديمة
    await clearAllPricing();
    
    // 2. قراءة وتحليل الملف الجديد
    console.log('📖 قراءة الملف الجديد...');
    const pricingData = parseNewCSV();
    console.log(`✅ تم تحليل ${pricingData.length} سعر من الملف الجديد`);
    
    // 3. عرض عينة من البيانات
    console.log('\n📋 عينة من الأسعار الصحيحة:');
    const oranPrices = pricingData.filter(p => p.wilayaName === 'Oran').slice(0, 5);
    oranPrices.forEach((item) => {
      console.log(`   ${item.wilayaName} - ${item.commune}: ${item.pricing.home}دج (منزل), ${item.pricing.office}دج (مكتب)`);
    });
    
    // 4. إضافة البيانات إلى Firebase
    const addedCount = await addPricesToFirebase(pricingData);
    
    console.log('\n🎉 تم الانتهاء من الاستيراد بنجاح!');
    console.log(`📊 الإحصائيات:`);
    
    // إحصائيات
    const wilayas = [...new Set(pricingData.map(p => p.wilayaName))];
    const communes = [...new Set(pricingData.map(p => p.commune))];
    
    console.log(`   - عدد الولايات: ${wilayas.length}`);
    console.log(`   - عدد البلديات: ${communes.length}`);
    console.log(`   - عدد الأسعار المضافة: ${addedCount}`);
    
    // التحقق من أسعار وهران
    const oranAllPrices = pricingData.filter(p => p.wilayaName === 'Oran');
    console.log(`\n🔍 أسعار وهران (${oranAllPrices.length} بلدية):`);
    const oranCity = oranAllPrices.find(p => p.commune === 'Oran');
    const esSenia = oranAllPrices.find(p => p.commune === 'Es Senia');
    
    if (oranCity) {
      console.log(`   - وهران: ${oranCity.pricing.home}دج (منزل), ${oranCity.pricing.office}دج (مكتب)`);
    }
    if (esSenia) {
      console.log(`   - السانيا: ${esSenia.pricing.home}دج (منزل), ${esSenia.pricing.office}دج (مكتب)`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاستيراد:', error);
    throw error;
  }
}

// تشغيل الاستيراد
importCorrectPricesNew()
  .then(() => {
    console.log('\n✅ تم استيراد الأسعار الصحيحة الجديدة بنجاح - Firebase محدث بالبيانات الصحيحة');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل في الاستيراد:', error);
    process.exit(1);
  });
