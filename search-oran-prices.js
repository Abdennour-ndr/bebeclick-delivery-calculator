/**
 * البحث عن أسعار التوصيل لولاية وهران في Firebase
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

async function searchOranPrices() {
  console.log('🔍 البحث عن أسعار التوصيل لولاية وهران (31)...');
  
  try {
    // البحث عن جميع أسعار ولاية وهران
    const q = query(
      collection(db, 'delivery_pricing'),
      where('wilayaCode', '==', 31),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const prices = [];
    
    querySnapshot.forEach((doc) => {
      prices.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`\n📊 تم العثور على ${prices.length} سعر لولاية وهران:\n`);
    
    if (prices.length === 0) {
      console.log('❌ لم يتم العثور على أسعار لولاية وهران');
      return;
    }
    
    // عرض النتائج
    prices.forEach((price, index) => {
      console.log(`${index + 1}. خدمة: ${price.service}`);
      console.log(`   البلدية: ${price.commune}`);
      console.log(`   المنطقة: ${price.zone}`);
      console.log(`   التوصيل للمنزل: ${price.pricing?.home || 'غير محدد'} دج`);
      console.log(`   التوصيل للمكتب: ${price.pricing?.office || 'غير محدد'} دج`);
      
      if (price.pricing?.supplements) {
        console.log(`   رسوم الوزن الزائد: ${price.pricing.supplements.overweightFee || 0} دج/كغ`);
        console.log(`   حد الوزن: ${price.pricing.supplements.overweightThreshold || 5} كغ`);
        console.log(`   رسوم الدفع عند الاستلام: ${price.pricing.supplements.codFeePercentage || 0}%`);
      }
      
      console.log(`   تاريخ الإنشاء: ${price.createdAt?.toDate?.() || 'غير محدد'}`);
      console.log(`   الحالة: ${price.status}`);
      console.log('   ────────────────────────────────');
    });
    
    // إحصائيات
    const services = [...new Set(prices.map(p => p.service))];
    const communes = [...new Set(prices.map(p => p.commune))];
    
    console.log(`\n📈 إحصائيات:`);
    console.log(`   عدد الخدمات: ${services.length} (${services.join(', ')})`);
    console.log(`   عدد البلديات: ${communes.length} (${communes.join(', ')})`);
    
    // متوسط الأسعار
    const avgHomePrice = prices.reduce((sum, p) => sum + (p.pricing?.home || 0), 0) / prices.length;
    const avgOfficePrice = prices.reduce((sum, p) => sum + (p.pricing?.office || 0), 0) / prices.length;
    
    console.log(`   متوسط سعر التوصيل للمنزل: ${Math.round(avgHomePrice)} دج`);
    console.log(`   متوسط سعر التوصيل للمكتب: ${Math.round(avgOfficePrice)} دج`);
    
  } catch (error) {
    console.error('❌ خطأ في البحث:', error);
  }
}

// تشغيل البحث
searchOranPrices()
  .then(() => {
    console.log('\n✅ انتهى البحث');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل البحث:', error);
    process.exit(1);
  });
