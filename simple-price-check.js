/**
 * فحص بسيط للأسعار المحفوظة في Firebase
 */

import fs from 'fs';
import firebaseService from './src/services/firebaseService.js';
import { db } from './src/config/firebase.js';
import { collection, getDocs, limit as firestoreLimit } from 'firebase/firestore';

// قراءة عينة من CSV للمقارنة
const readCSVSample = () => {
  const content = fs.readFileSync('Wilaya Commune DB.xlsx - Copie de Feuille 1.csv', 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(2);
  
  const algerData = [];
  
  for (const line of dataLines) {
    const columns = line.split(',');
    if (columns.length >= 5) {
      const wilayaName = columns[1]?.trim();
      const communeName = columns[2]?.trim();
      const officePrice = columns[3]?.trim();
      const homePrice = columns[4]?.trim();
      
      if (wilayaName === 'Alger') {
        algerData.push({
          commune: communeName,
          office: parseInt(officePrice.replace(/DA|,|\s/g, '')) || 0,
          home: parseInt(homePrice.replace(/DA|,|\s/g, '')) || 0
        });
      }
    }
  }
  
  return algerData;
};

// فحص البيانات المحفوظة مباشرة
const checkFirebaseData = async () => {
  try {
    console.log('🔍 فحص البيانات المحفوظة في Firebase...');
    
    // قراءة عينة من CSV
    const csvData = readCSVSample();
    console.log(`📄 عدد بلديات الجزائر في CSV: ${csvData.length}`);
    console.log(`📄 عينة من CSV: ${csvData[0]?.commune} - مكتب: ${csvData[0]?.office}DA, منزل: ${csvData[0]?.home}DA`);
    
    // محاولة جلب البيانات مباشرة من collection
    const locationsRef = collection(db, 'locations');

    // جلب جميع المستندات (محدود بـ 10 للاختبار)
    const snapshot = await getDocs(locationsRef);
    
    console.log(`\n🔥 عدد المستندات في Firebase: ${snapshot.size}`);
    
    let algerCommunes = 0;
    let samplePrices = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.hierarchy?.wilayaCode === 16) {
        algerCommunes++;
        samplePrices.push({
          name: data.name,
          office: data.pricing?.yalidine?.office || 0,
          home: data.pricing?.yalidine?.home || 0
        });
      }
      
      console.log(`📍 ${data.name} (ولاية: ${data.hierarchy?.wilayaCode})`);
      if (data.pricing?.yalidine) {
        console.log(`   💰 مكتب: ${data.pricing.yalidine.office}DA, منزل: ${data.pricing.yalidine.home}DA`);
      }
    });
    
    console.log(`\n📊 بلديات الجزائر الموجودة: ${algerCommunes}`);
    
    // مقارنة مع CSV
    if (samplePrices.length > 0) {
      console.log('\n🔍 مقارنة مع CSV:');
      for (const fbPrice of samplePrices) {
        const csvMatch = csvData.find(c => 
          c.commune.toLowerCase().includes(fbPrice.name.toLowerCase()) ||
          fbPrice.name.toLowerCase().includes(c.commune.toLowerCase())
        );
        
        if (csvMatch) {
          const officeMatch = fbPrice.office === csvMatch.office;
          const homeMatch = fbPrice.home === csvMatch.home;
          
          if (officeMatch && homeMatch) {
            console.log(`✅ ${fbPrice.name}: الأسعار متطابقة`);
          } else {
            console.log(`❌ ${fbPrice.name}: أسعار مختلفة`);
            console.log(`   Firebase: مكتب=${fbPrice.office}DA, منزل=${fbPrice.home}DA`);
            console.log(`   CSV: مكتب=${csvMatch.office}DA, منزل=${csvMatch.home}DA`);
          }
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 خطأ في الفحص:', error);
    return false;
  }
};

// تشغيل الفحص
const runCheck = async () => {
  console.log('🚀 بدء فحص الأسعار...');
  console.log('=' .repeat(50));
  
  const result = await checkFirebaseData();
  
  if (result) {
    console.log('\n✅ تم الفحص بنجاح');
  } else {
    console.log('\n❌ فشل الفحص');
  }
};

runCheck();
