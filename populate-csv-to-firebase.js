/**
 * تحويل بيانات CSV إلى Firebase
 */

import fs from 'fs';
import firebaseService from './src/services/firebaseService.js';

// خريطة أسماء الولايات إلى أكوادها
const WILAYA_NAME_TO_CODE = {
  'Adrar': 1,
  'Chlef': 2,
  'Laghouat': 3,
  'Oum El Bouaghi': 4,
  'Batna': 5,
  'Béjaïa': 6,
  'Biskra': 7,
  'Béchar': 8,
  'Blida': 9,
  'Bouira': 10,
  'Tamanrasset': 11,
  'Tébessa': 12,
  'Tlemcen': 13,
  'Tiaret': 14,
  'Tizi Ouzou': 15,
  'Alger': 16,
  'Djelfa': 17,
  'Jijel': 18,
  'Sétif': 19,
  'Saïda': 20,
  'Skikda': 21,
  'Sidi Bel Abbès': 22,
  'Annaba': 23,
  'Guelma': 24,
  'Constantine': 25,
  'Médéa': 26,
  'Mostaganem': 27,
  'M\'Sila': 28,
  'Mascara': 29,
  'Ouargla': 30,
  'Oran': 31,
  'El Bayadh': 32,
  'Illizi': 33,
  'Bordj Bou Arréridj': 34,
  'Boumerdès': 35,
  'El Tarf': 36,
  'Tindouf': 37,
  'Tissemsilt': 38,
  'El Oued': 39,
  'Khenchela': 40,
  'Souk Ahras': 41,
  'Tipaza': 42,
  'Mila': 43,
  'Aïn Defla': 44,
  'Naâma': 45,
  'Aïn Témouchent': 46,
  'Ghardaïa': 47,
  'Relizane': 48,
  'Timimoun': 49,
  'Bordj Badji Mokhtar': 50,
  'Ouled Djellal': 51,
  'Béni Abbès': 52,
  'In Salah': 53,
  'In Guezzam': 54,
  'Touggourt': 55,
  'Djanet': 56,
  'El M\'Ghair': 57,
  'El Meniaa': 58
};

// خريطة المناطق
const REGION_MAP = {
  'Central': 'centre',
  'Nord': 'nord',
  'Sud': 'sud',
  'Est': 'est',
  'Ouest': 'ouest'
};

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
          region: REGION_MAP[region] || 'centre',
          wilayaName,
          wilayaCode: WILAYA_NAME_TO_CODE[wilayaName],
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

  console.log(`🔍 تحويل السعر: "${priceStr}" -> "${cleanPrice}" -> ${price}`);

  return isNaN(price) ? 0 : price;
};

// تجميع البيانات حسب الولاية
const groupByWilaya = (data) => {
  const grouped = {};
  
  for (const item of data) {
    if (!item.wilayaCode) {
      console.warn(`⚠️ لم يتم العثور على كود للولاية: ${item.wilayaName}`);
      continue;
    }
    
    if (!grouped[item.wilayaCode]) {
      grouped[item.wilayaCode] = {
        code: item.wilayaCode,
        name: item.wilayaName,
        region: item.region,
        communes: []
      };
    }
    
    // تجنب التكرار
    const existingCommune = grouped[item.wilayaCode].communes.find(
      c => c.name === item.communeName
    );
    
    if (!existingCommune) {
      grouped[item.wilayaCode].communes.push({
        name: item.communeName,
        officePrice: item.officePrice,
        homePrice: item.homePrice
      });
    }
  }
  
  return grouped;
};

// حفظ الولايات في Firebase
const saveWilayasToFirebase = async (wilayasData) => {
  console.log('\n🗺️ حفظ الولايات في Firebase...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [code, wilayaData] of Object.entries(wilayasData)) {
    try {
      const wilayaDoc = {
        code: parseInt(code),
        name: wilayaData.name,
        nameAr: wilayaData.name, // يمكن إضافة الترجمة العربية لاحقاً
        geography: {
          region: wilayaData.region
        },
        deliveryConfig: {
          pricingZone: wilayaData.region === 'centre' ? 1 : wilayaData.region === 'nord' ? 2 : 3,
          availableServices: [
            { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true }
          ]
        },
        metadata: {
          dataSource: 'csv-import',
          createdBy: 'csv-to-firebase-script',
          communesCount: wilayaData.communes.length
        }
      };
      
      await firebaseService.addWilaya(wilayaDoc);
      successCount++;
      console.log(`✅ ${wilayaData.name} (${code}) - ${wilayaData.communes.length} بلدية`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ خطأ في حفظ ${wilayaData.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 نتائج حفظ الولايات:`);
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  
  return successCount;
};

// حفظ البلديات في Firebase
const saveCommunesToFirebase = async (wilayasData) => {
  console.log('\n🏘️ حفظ البلديات في Firebase...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [wilayaCode, wilayaData] of Object.entries(wilayasData)) {
    console.log(`\n📍 حفظ بلديات ${wilayaData.name}...`);
    
    for (let i = 0; i < wilayaData.communes.length; i++) {
      try {
        const commune = wilayaData.communes[i];
        const communeCode = parseInt(wilayaCode) * 1000 + (i + 1);
        
        const communeDoc = {
          code: communeCode,
          name: commune.name,
          geography: {
            region: wilayaData.region
          },
          pricing: {
            yalidine: {
              office: commune.officePrice,
              home: commune.homePrice
            }
          },
          deliveryConfig: {
            pricingZone: wilayaData.region === 'centre' ? 1 : wilayaData.region === 'nord' ? 2 : 3,
            availableServices: [
              { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: commune.officePrice > 0 }
            ]
          },
          metadata: {
            dataSource: 'csv-import',
            createdBy: 'csv-to-firebase-script'
          }
        };
        
        await firebaseService.addCommune(parseInt(wilayaCode), communeDoc);
        successCount++;
        console.log(`  ✅ ${commune.name} (${communeCode}) - Bureau: ${commune.officePrice}DA, Domicile: ${commune.homePrice}DA`);
        
      } catch (error) {
        errorCount++;
        console.error(`  ❌ خطأ في حفظ ${commune.name}:`, error.message);
      }
    }
  }
  
  console.log(`\n📊 نتائج حفظ البلديات:`);
  console.log(`✅ نجح: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  
  return successCount;
};

// الدالة الرئيسية
const importCSVToFirebase = async () => {
  try {
    console.log('🔥 بدء تحويل CSV إلى Firebase...');
    console.log('=' .repeat(60));
    
    // اختبار الاتصال
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest.success) {
      console.error('❌ فشل الاتصال بـ Firebase:', connectionTest.error);
      return;
    }
    
    console.log('✅ Firebase متصل ويعمل');
    
    // قراءة وتحليل CSV
    const csvData = parseCSV('Wilaya Commune DB.xlsx - Copie de Feuille 1.csv');
    
    // تجميع البيانات
    const wilayasData = groupByWilaya(csvData);
    
    console.log(`\n📊 إحصائيات البيانات:`);
    console.log(`🗺️ عدد الولايات: ${Object.keys(wilayasData).length}`);
    
    let totalCommunes = 0;
    Object.values(wilayasData).forEach(w => totalCommunes += w.communes.length);
    console.log(`🏘️ إجمالي البلديات: ${totalCommunes}`);
    
    // حفظ الولايات
    const wilayasCount = await saveWilayasToFirebase(wilayasData);
    
    // حفظ البلديات
    const communesCount = await saveCommunesToFirebase(wilayasData);
    
    console.log('\n🎉 تم الانتهاء من التحويل بنجاح!');
    console.log(`✅ تم حفظ ${wilayasCount} ولاية و ${communesCount} بلدية`);
    console.log('✅ يمكنك الآن استخدام الواجهة لرؤية جميع البيانات');
    
  } catch (error) {
    console.error('💥 خطأ في تحويل CSV:', error);
  }
};

// تشغيل السكريبت
importCSVToFirebase();
