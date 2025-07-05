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

async function debugOranSpecific() {
  console.log('🔍 البحث عن مدينة وهران تحديداً...');
  
  const q = query(
    collection(db, 'delivery_pricing'),
    where('wilayaCode', '==', 31),
    where('commune', '==', 'Oran'),
    where('service', '==', 'yalidine')
  );
  
  const snapshot = await getDocs(q);
  console.log(`📊 تم العثور على ${snapshot.size} نتيجة لمدينة وهران`);
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log('📍 بيانات وهران الكاملة:');
    console.log('  - ID:', doc.id);
    console.log('  - wilayaCode:', data.wilayaCode);
    console.log('  - wilayaName:', data.wilayaName);
    console.log('  - commune:', data.commune);
    console.log('  - pricing.home:', data.pricing.home);
    console.log('  - pricing.office:', data.pricing.office);
    console.log('  - zone:', data.zone);
    console.log('  - status:', data.status);
    console.log('  - metadata:', data.metadata);
    console.log('  - createdAt:', data.createdAt);
    console.log('  - updatedAt:', data.updatedAt);
    console.log('---');
  });
  
  // البحث في جميع المجموعات للتأكد
  console.log('\n🔍 البحث في جميع المجموعات...');
  const allCollections = ['delivery_pricing', 'locations', 'pricing'];
  
  for (const collectionName of allCollections) {
    try {
      const q2 = query(
        collection(db, collectionName),
        where('commune', '==', 'Oran')
      );
      
      const snapshot2 = await getDocs(q2);
      if (snapshot2.size > 0) {
        console.log(`📦 مجموعة ${collectionName}: ${snapshot2.size} نتيجة`);
        snapshot2.forEach((doc) => {
          const data = doc.data();
          console.log(`  - ${doc.id}:`, data.pricing || data);
        });
      }
    } catch (error) {
      console.log(`❌ خطأ في مجموعة ${collectionName}:`, error.message);
    }
  }
}

debugOranSpecific().then(() => process.exit(0)).catch(console.error);
