/**
 * اختبار خدمة Firebase المحدثة
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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

async function testFirebaseService() {
  console.log('🧪 اختبار خدمة Firebase المحدثة...');
  
  try {
    // اختبار جلب الولايات
    console.log('\n📍 اختبار جلب الولايات...');
    const wilayasQuery = query(
      collection(db, 'delivery_pricing'),
      where('service', '==', 'yalidine'),
      where('status', '==', 'active')
    );
    
    const wilayasSnapshot = await getDocs(wilayasQuery);
    const wilayaMap = new Map();
    
    wilayasSnapshot.forEach((doc) => {
      const data = doc.data();
      wilayaMap.set(data.wilayaCode, data.wilayaName);
    });
    
    console.log(`✅ تم العثور على ${wilayaMap.size} ولاية`);
    console.log('📋 عينة من الولايات:');
    Array.from(wilayaMap.entries()).slice(0, 5).forEach(([code, name]) => {
      console.log(`   ${code}: ${name}`);
    });
    
    // اختبار جلب بلديات وهران
    console.log('\n🏘️ اختبار جلب بلديات وهران...');
    const oranQuery = query(
      collection(db, 'delivery_pricing'),
      where('wilayaCode', '==', 31),
      where('service', '==', 'yalidine'),
      where('status', '==', 'active')
    );
    
    const oranSnapshot = await getDocs(oranQuery);
    const communes = [];
    
    oranSnapshot.forEach((doc) => {
      const data = doc.data();
      communes.push({
        name: data.commune,
        home: data.pricing.home,
        office: data.pricing.office
      });
    });
    
    console.log(`✅ تم العثور على ${communes.length} بلدية في وهران`);
    console.log('📋 عينة من البلديات:');
    communes.slice(0, 5).forEach((commune) => {
      console.log(`   ${commune.name}: ${commune.home}دج (منزل), ${commune.office}دج (مكتب)`);
    });
    
    // البحث عن وهران تحديداً
    const oranCity = communes.find(c => c.name === 'Oran');
    if (oranCity) {
      console.log(`\n🎯 أسعار مدينة وهران: ${oranCity.home}دج (منزل), ${oranCity.office}دج (مكتب)`);
    }
    
    console.log('\n✅ اختبار Firebase Service مكتمل بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testFirebaseService().then(() => process.exit(0)).catch(console.error);
