import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

// Test products data
const testProducts = [
  {
    name: "Biberon Anti-Colique 260ml",
    sku: "BIB-AC-260",
    category: "Alimentation",
    brand: "BebeClick",
    description: "Biberon anti-colique avec tétine en silicone",
    status: "active"
  },
  {
    name: "Couches Taille 3 (4-9kg)",
    sku: "COU-T3-50",
    category: "Hygiène",
    brand: "BabyDry",
    description: "Pack de 50 couches ultra-absorbantes",
    status: "active"
  },
  {
    name: "Poussette 3 Roues Sport",
    sku: "POU-3R-SP",
    category: "Transport",
    brand: "BabyMove",
    description: "Poussette légère avec 3 roues tout-terrain",
    status: "active"
  },
  {
    name: "Siège Auto Groupe 1",
    sku: "SIE-G1-SEC",
    category: "Sécurité",
    brand: "SafeBaby",
    description: "Siège auto pour enfants de 9-18kg",
    status: "active"
  },
  {
    name: "Lait Infantile 1er Âge",
    sku: "LAI-1A-800",
    category: "Alimentation",
    brand: "NutriMilk",
    description: "Lait en poudre pour nourrissons 0-6 mois",
    status: "active"
  },
  {
    name: "Jouet Éveil Musical",
    sku: "JOU-MUS-EV",
    category: "Jouets",
    brand: "PlayTime",
    description: "Jouet musical interactif pour bébés",
    status: "active"
  },
  {
    name: "Thermomètre Digital",
    sku: "THE-DIG-BB",
    category: "Santé",
    brand: "HealthBaby",
    description: "Thermomètre digital sans contact",
    status: "active"
  },
  {
    name: "Gigoteuse 6-18 mois",
    sku: "GIG-6-18",
    category: "Vêtements",
    brand: "SleepWell",
    description: "Gigoteuse en coton bio pour bébé",
    status: "active"
  }
];

async function addTestProducts() {
  try {
    console.log('🧪 إضافة منتجات تجريبية...');
    
    for (const product of testProducts) {
      const productData = {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log(`✅ تم إضافة المنتج: ${product.name} (ID: ${docRef.id})`);
    }
    
    console.log(`🎉 تم إضافة ${testProducts.length} منتج تجريبي بنجاح!`);
    
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتجات:', error);
  }
}

// Run the script
addTestProducts().then(() => {
  console.log('🏁 انتهى إضافة المنتجات التجريبية');
  process.exit(0);
}).catch((error) => {
  console.error('💥 فشل في إضافة المنتجات:', error);
  process.exit(1);
});
