/**
 * إضافة بيانات أسعار التوصيل إلى Firebase
 * يضيف أسعار تجريبية لخدمات التوصيل المختلفة
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, writeBatch, doc } from 'firebase/firestore';

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

// بيانات أسعار التوصيل التجريبية
const deliveryPrices = [
  // ولاية الجزائر - Yalidine
  {
    service: 'yalidine',
    wilayaCode: 16,
    wilayaName: 'Alger',
    commune: 'Alger Centre',
    zone: 1,
    pricing: {
      home: 400,
      office: 350,
      supplements: {
        codFeePercentage: 2,
        codFeeFixed: 0,
        overweightFee: 50,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },
  {
    service: 'yalidine',
    wilayaCode: 16,
    wilayaName: 'Alger',
    commune: 'Bab Ezzouar',
    zone: 1,
    pricing: {
      home: 400,
      office: 350,
      supplements: {
        codFeePercentage: 2,
        codFeeFixed: 0,
        overweightFee: 50,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },
  {
    service: 'yalidine',
    wilayaCode: 16,
    wilayaName: 'Alger',
    commune: 'Hydra',
    zone: 1,
    pricing: {
      home: 400,
      office: 350,
      supplements: {
        codFeePercentage: 2,
        codFeeFixed: 0,
        overweightFee: 50,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },

  // ولاية الجزائر - Zaki
  {
    service: 'zaki',
    wilayaCode: 16,
    wilayaName: 'Alger',
    commune: 'Alger Centre',
    zone: 1,
    pricing: {
      home: 350,
      office: 300,
      supplements: {
        codFeePercentage: 1.5,
        codFeeFixed: 0,
        overweightFee: 40,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },
  {
    service: 'zaki',
    wilayaCode: 16,
    wilayaName: 'Alger',
    commune: 'Bab Ezzouar',
    zone: 1,
    pricing: {
      home: 350,
      office: 300,
      supplements: {
        codFeePercentage: 1.5,
        codFeeFixed: 0,
        overweightFee: 40,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },

  // ولاية بليدة - Yalidine
  {
    service: 'yalidine',
    wilayaCode: 9,
    wilayaName: 'Blida',
    commune: 'Blida',
    zone: 1,
    pricing: {
      home: 450,
      office: 400,
      supplements: {
        codFeePercentage: 2,
        codFeeFixed: 0,
        overweightFee: 50,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },
  {
    service: 'yalidine',
    wilayaCode: 9,
    wilayaName: 'Blida',
    commune: 'Boufarik',
    zone: 1,
    pricing: {
      home: 450,
      office: 400,
      supplements: {
        codFeePercentage: 2,
        codFeeFixed: 0,
        overweightFee: 50,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },

  // ولاية وهران - Yalidine
  {
    service: 'yalidine',
    wilayaCode: 31,
    wilayaName: 'Oran',
    commune: 'Oran',
    zone: 2,
    pricing: {
      home: 500,
      office: 450,
      supplements: {
        codFeePercentage: 2,
        codFeeFixed: 0,
        overweightFee: 50,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },
  {
    service: 'yalidine',
    wilayaCode: 31,
    wilayaName: 'Oran',
    commune: 'Es Senia',
    zone: 2,
    pricing: {
      home: 500,
      office: 450,
      supplements: {
        codFeePercentage: 2,
        codFeeFixed: 0,
        overweightFee: 50,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },

  // ولاية قسنطينة - Yalidine
  {
    service: 'yalidine',
    wilayaCode: 25,
    wilayaName: 'Constantine',
    commune: 'Constantine',
    zone: 3,
    pricing: {
      home: 600,
      office: 550,
      supplements: {
        codFeePercentage: 2,
        codFeeFixed: 0,
        overweightFee: 100,
        overweightThreshold: 5
      }
    },
    status: 'active'
  },

  // ولاية ورقلة - Yalidine
  {
    service: 'yalidine',
    wilayaCode: 30,
    wilayaName: 'Ouargla',
    commune: 'Ouargla',
    zone: 4,
    pricing: {
      home: 700,
      office: 650,
      supplements: {
        codFeePercentage: 2,
        codFeeFixed: 0,
        overweightFee: 100,
        overweightThreshold: 5
      }
    },
    status: 'active'
  }
];

async function populateDeliveryPrices() {
  console.log('🚀 بدء إضافة أسعار التوصيل إلى Firebase...');
  
  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const priceData of deliveryPrices) {
      const docRef = doc(collection(db, 'delivery_pricing'));
      batch.set(docRef, {
        ...priceData,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          dataSource: 'manual',
          createdBy: 'populate-script',
          lastUpdated: new Date()
        }
      });
      count++;
    }

    await batch.commit();
    console.log(`✅ تم إضافة ${count} سعر توصيل بنجاح`);

  } catch (error) {
    console.error('❌ خطأ في إضافة أسعار التوصيل:', error);
  }
}

// تشغيل السكريبت
populateDeliveryPrices()
  .then(() => {
    console.log('🎉 تم الانتهاء من إضافة أسعار التوصيل');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل في إضافة أسعار التوصيل:', error);
    process.exit(1);
  });
