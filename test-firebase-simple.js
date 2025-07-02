/**
 * اختبار Firebase بدون فهارس معقدة
 */

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from './src/config/firebase.js';

const testFirebaseSimple = async () => {
  try {
    console.log('🔥 اختبار Firebase بسيط...');
    
    // جلب جميع المواقع بدون فلترة
    console.log('📍 جلب جميع المواقع...');
    const locationsRef = collection(db, 'locations');
    const simpleQuery = query(locationsRef, limit(20));
    
    const snapshot = await getDocs(simpleQuery);
    
    console.log(`✅ تم جلب ${snapshot.size} موقع`);
    
    let wilayasCount = 0;
    let communesCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.type === 'wilaya') {
        wilayasCount++;
        console.log(`🗺️ ولاية: ${data.name} (${data.code})`);
      } else if (data.type === 'commune') {
        communesCount++;
        console.log(`🏘️ بلدية: ${data.name} (${data.code})`);
      }
    });
    
    console.log(`\n📊 الإحصائيات:`);
    console.log(`🗺️ الولايات: ${wilayasCount}`);
    console.log(`🏘️ البلديات: ${communesCount}`);
    console.log(`📍 المجموع: ${snapshot.size}`);
    
    console.log('\n🎉 Firebase يعمل بشكل مثالي!');
    console.log('✅ البيانات محفوظة ويمكن الوصول إليها');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
};

testFirebaseSimple();
