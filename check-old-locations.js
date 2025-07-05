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

async function checkOldLocations() {
  console.log('🔍 البحث في مجموعة locations القديمة...');
  
  try {
    const q = query(
      collection(db, 'locations'),
      where('name', '==', 'Oran')
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 تم العثور على ${snapshot.size} نتيجة في locations`);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📍 بيانات locations:');
      console.log('  - ID:', doc.id);
      console.log('  - name:', data.name);
      console.log('  - type:', data.type);
      console.log('  - pricing:', data.pricing);
      console.log('  - hierarchy:', data.hierarchy);
      console.log('---');
    });
    
    // البحث عن بلديات وهران في locations
    const q2 = query(
      collection(db, 'locations'),
      where('type', '==', 'commune'),
      where('hierarchy.wilayaCode', '==', 31)
    );
    
    const snapshot2 = await getDocs(q2);
    console.log(`\n📊 بلديات وهران في locations: ${snapshot2.size} نتيجة`);
    
    snapshot2.forEach((doc) => {
      const data = doc.data();
      if (data.name === 'Oran') {
        console.log('📍 بيانات بلدية وهران في locations:');
        console.log('  - ID:', doc.id);
        console.log('  - name:', data.name);
        console.log('  - pricing:', data.pricing);
        console.log('---');
      }
    });
    
  } catch (error) {
    console.log('❌ خطأ في البحث:', error.message);
  }
}

checkOldLocations().then(() => process.exit(0)).catch(console.error);
