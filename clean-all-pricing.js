/**
 * مسح جميع أسعار التوصيل من Firebase والاحتفاظ فقط بالبيانات من yalidineService.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';

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

async function cleanAllPricing() {
  console.log('🧹 مسح جميع أسعار التوصيل من Firebase...');
  
  try {
    // الحصول على جميع الوثائق في مجموعة delivery_pricing
    const collectionRef = collection(db, 'delivery_pricing');
    const snapshot = await getDocs(collectionRef);
    
    console.log(`📊 تم العثور على ${snapshot.size} وثيقة للمسح`);
    
    if (snapshot.size === 0) {
      console.log('✅ لا توجد وثائق للمسح');
      return;
    }
    
    // مسح الوثائق في مجموعات (Firebase يسمح بـ 500 عملية لكل batch)
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
    
  } catch (error) {
    console.error('❌ خطأ في مسح البيانات:', error);
    throw error;
  }
}

// تشغيل المسح
cleanAllPricing()
  .then(() => {
    console.log('\n🎉 تم مسح جميع البيانات بنجاح!');
    console.log('💡 الآن يمكنك تشغيل migrate-yalidine-to-firebase.js لإضافة البيانات الصحيحة');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل في مسح البيانات:', error);
    process.exit(1);
  });
