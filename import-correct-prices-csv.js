/**
 * استيراد الأسعار الصحيحة من ملف CSV إلى Firebase
 * مسح جميع البيانات القديمة واستبدالها بالأسعار الصحيحة
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
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

// خريطة أكواد الولايات
const WILAYA_CODES = {
  'Adrar': 1, 'Chlef': 2, 'Laghouat': 3, 'Oum El Bouaghi': 4, 'Batna': 5,
  'Béjaïa': 6, 'Biskra': 7, 'Béchar': 8, 'Blida': 9, 'Bouira': 10,
  'Tamanrasset': 11, 'Tébessa': 12, 'Tlemcen': 13, 'Tiaret': 14, 'Tizi Ouzou': 15,
  'Alger': 16, 'Djelfa': 17, 'Jijel': 18, 'Sétif': 19, 'Saïda': 20,
  'Skikda': 21, 'Sidi Bel Abbès': 22, 'Annaba': 23, 'Guelma': 24, 'Constantine': 25,
  'Médéa': 26, 'Mostaganem': 27, 'M\'Sila': 28, 'Mascara': 29, 'Ouargla': 30,
  'Oran': 31, 'El Bayadh': 32, 'Illizi': 33, 'Bordj Bou Arréridj': 34, 'Boumerdès': 35,
  'El Tarf': 36, 'Tindouf': 37, 'Tissemsilt': 38, 'El Oued': 39, 'Khenchela': 40,
  'Souk Ahras': 41, 'Tipaza': 42, 'Mila': 43, 'Aïn Defla': 44, 'Naâma': 45,
  'Aïn Témouchent': 46, 'Ghardaïa': 47, 'Relizane': 48
};

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

// تنظيف السعر (إزالة "DA" والمسافات)
function cleanPrice(priceStr) {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
}

// قراءة وتحليل ملف CSV
function parseCSV() {
  const filePath = path.join(process.cwd(), 'Wilaya Commune DB.xlsx - Copie de Feuille 1.csv');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  const lines = fileContent.split('\n');
  const pricingData = [];
  
  // تخطي الأسطر الفارغة والعناوين
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length < 5) continue;
    
    const [region, wilayaName, commune, officePrice, homePrice] = columns;
    
    if (!wilayaName || !commune || !officePrice || !homePrice) continue;
    
    const wilayaCode = WILAYA_CODES[wilayaName];
    if (!wilayaCode) {
      console.warn(`⚠️ ولاية غير معروفة: ${wilayaName}`);
      continue;
    }
    
    const zone = getWilayaZone(wilayaCode);
    
    pricingData.push({
      service: 'yalidine',
      wilayaCode: wilayaCode,
      wilayaName: wilayaName,
      commune: commune.trim(),
      zone: zone,
      pricing: {
        home: cleanPrice(homePrice),
        office: cleanPrice(officePrice),
        supplements: {
          codFeePercentage: 2,
          codFeeFixed: 0,
          overweightFee: getOverweightFee(zone),
          overweightThreshold: 5
        }
      },
      status: 'active',
      metadata: {
        dataSource: 'csv-correct-prices',
        createdBy: 'csv-import-script',
        lastUpdated: new Date(),
        region: region
      }
    });
  }
  
  return pricingData;
}

// إضافة البيانات إلى Firebase
async function addPricesToFirebase(pricingData) {
  console.log('📝 إضافة الأسعار الصحيحة إلى Firebase...');
  
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

// الدالة الرئيسية
async function importCorrectPrices() {
  try {
    console.log('🚀 بدء استيراد الأسعار الصحيحة من CSV...');
    
    // 1. قراءة وتحليل ملف CSV
    console.log('📖 قراءة ملف CSV...');
    const pricingData = parseCSV();
    console.log(`✅ تم تحليل ${pricingData.length} سعر من CSV`);
    
    // 2. عرض عينة من البيانات
    console.log('\n📋 عينة من الأسعار الصحيحة:');
    const oranPrices = pricingData.filter(p => p.wilayaName === 'Oran').slice(0, 3);
    oranPrices.forEach((item) => {
      console.log(`   ${item.wilayaName} - ${item.commune}: ${item.pricing.home}دج (منزل), ${item.pricing.office}دج (مكتب)`);
    });
    
    // 3. إضافة البيانات إلى Firebase
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
    console.log(`   - وهران: ${oranAllPrices.find(p => p.commune === 'Oran')?.pricing.office}دج (مكتب), ${oranAllPrices.find(p => p.commune === 'Oran')?.pricing.home}دج (منزل)`);
    console.log(`   - السانيا: ${oranAllPrices.find(p => p.commune === 'Es Senia')?.pricing.office}دج (مكتب), ${oranAllPrices.find(p => p.commune === 'Es Senia')?.pricing.home}دج (منزل)`);
    
  } catch (error) {
    console.error('❌ خطأ في الاستيراد:', error);
    throw error;
  }
}

// تشغيل الاستيراد
importCorrectPrices()
  .then(() => {
    console.log('\n✅ تم استيراد الأسعار الصحيحة بنجاح - Firebase محدث بالبيانات الصحيحة');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل في الاستيراد:', error);
    process.exit(1);
  });
