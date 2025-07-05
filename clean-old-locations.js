import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function cleanOldLocations() {
  console.log('🧹 مسح مجموعة locations القديمة...');
  
  try {
    const snapshot = await getDocs(collection(db, 'locations'));
    console.log(`📊 تم العثور على ${snapshot.size} وثيقة في locations`);
    
    if (snapshot.size === 0) {
      console.log('✅ لا توجد وثائق للمسح');
      return;
    }
    
    let deletedCount = 0;
    const deletePromises = [];
    
    snapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, 'locations', docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    deletedCount = deletePromises.length;
    
    console.log(`✅ تم مسح ${deletedCount} وثيقة من locations`);
    
  } catch (error) {
    console.log('❌ خطأ في المسح:', error.message);
  }
}

cleanOldLocations().then(() => {
  console.log('\n🎉 تم مسح مجموعة locations بنجاح!');
  console.log('💡 الآن التطبيق سيستخدم delivery_pricing فقط');
  process.exit(0);
}).catch(console.error);
