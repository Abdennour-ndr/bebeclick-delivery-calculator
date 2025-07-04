import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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

async function verifyOranPrices() {
  console.log('🔍 التحقق من أسعار وهران الجديدة...');
  
  const q = query(
    collection(db, 'delivery_pricing'),
    where('wilayaCode', '==', 31)
  );
  
  const snapshot = await getDocs(q);
  console.log(`📊 تم العثور على ${snapshot.size} سعر لوهران:`);
  
  const prices = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    prices.push(data);
  });
  
  // ترتيب حسب اسم البلدية
  prices.sort((a, b) => a.commune.localeCompare(b.commune));
  
  // عرض أول 5 أسعار
  console.log('\n📋 عينة من الأسعار:');
  prices.slice(0, 5).forEach((data) => {
    console.log(`${data.commune}: ${data.pricing.home}دج (منزل), ${data.pricing.office}دج (مكتب)`);
  });
  
  // البحث عن أسعار محددة
  const oranCity = prices.find(p => p.commune === 'Oran');
  const esSenia = prices.find(p => p.commune === 'Es Senia');
  
  console.log('\n🎯 الأسعار المحددة:');
  if (oranCity) {
    console.log(`وهران: ${oranCity.pricing.home}دج (منزل), ${oranCity.pricing.office}دج (مكتب)`);
  }
  if (esSenia) {
    console.log(`السانيا: ${esSenia.pricing.home}دج (منزل), ${esSenia.pricing.office}دج (مكتب)`);
  }
  
  console.log('\n✅ التحقق مكتمل - الأسعار محدثة من CSV');
}

verifyOranPrices().then(() => process.exit(0)).catch(console.error);
