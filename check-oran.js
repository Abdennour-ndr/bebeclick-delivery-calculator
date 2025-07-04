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

async function checkOran() {
  const q = query(
    collection(db, 'delivery_pricing'),
    where('wilayaCode', '==', 31)
  );
  
  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.size} prices for Oran:`);
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`${data.commune}: Home=${data.pricing.home}, Office=${data.pricing.office}`);
  });
}

checkOran().then(() => process.exit(0)).catch(console.error);
