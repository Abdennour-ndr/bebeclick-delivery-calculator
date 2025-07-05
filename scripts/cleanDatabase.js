import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzv7w2s--bZMIVdmg0Aog0l3vtmNhJPEI",
  authDomain: "bebeclick-delivery-calculator.firebaseapp.com",
  projectId: "bebeclick-delivery-calculator",
  storageBucket: "bebeclick-delivery-calculator.firebasestorage.app",
  messagingSenderId: "840872804453",
  appId: "1:840872804453:web:d1afbd0fab5dc904e9868c",
  measurementId: "G-YR4D2W3JK0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanDatabase() {
  try {
    console.log('🧹 بدء تنظيف قاعدة البيانات...');
    
    // Get all products
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    console.log(`📦 تم العثور على ${snapshot.size} منتج في قاعدة البيانات`);
    
    if (snapshot.size === 0) {
      console.log('✅ قاعدة البيانات فارغة بالفعل');
      return;
    }
    
    // Delete all products
    const deletePromises = [];
    snapshot.forEach((docSnapshot) => {
      const productData = docSnapshot.data();
      console.log(`🗑️ حذف المنتج: ${productData.name} (${productData.sku})`);
      deletePromises.push(deleteDoc(doc(db, 'products', docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    
    console.log('✅ تم حذف جميع المنتجات التجريبية بنجاح!');
    console.log(`🎯 تم حذف ${snapshot.size} منتج من قاعدة البيانات`);
    
  } catch (error) {
    console.error('❌ خطأ في تنظيف قاعدة البيانات:', error);
  }
}

// Run the cleanup
cleanDatabase().then(() => {
  console.log('🏁 انتهى تنظيف قاعدة البيانات');
  process.exit(0);
}).catch((error) => {
  console.error('💥 فشل في تنظيف قاعدة البيانات:', error);
  process.exit(1);
});
