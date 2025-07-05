/**
 * إضافة منتجات تجريبية لاختبار صفحة إدارة المنتجات
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

// منتجات تجريبية
const sampleProducts = [
  {
    name: "Poussette Bébé Premium",
    sku: "BB-POUS-001",
    category: "Poussettes",
    brand: "BabyComfort"
  },
  {
    name: "Siège Auto Groupe 0+",
    sku: "BB-SIEGE-002",
    category: "Sièges Auto",
    brand: "Maxi-Cosi"
  },
  {
    name: "Lit Bébé Évolutif",
    sku: "BB-LIT-003",
    category: "Mobilier",
    brand: "Chicco"
  },
  {
    name: "Biberon Anti-Colique 260ml",
    sku: "BB-BIB-004",
    category: "Alimentation",
    brand: "Philips Avent"
  },
  {
    name: "Couches Taille 3 (4-9kg)",
    sku: "BB-COUCH-005",
    category: "Hygiène",
    brand: "Pampers"
  },
  {
    name: "Tapis d'Éveil Musical",
    sku: "BB-TAPIS-006",
    category: "Jouets",
    brand: "Fisher-Price"
  },
  {
    name: "Chaise Haute Évolutive",
    sku: "BB-CHAISE-007",
    category: "Mobilier",
    brand: "Stokke"
  },
  {
    name: "Moniteur Bébé Vidéo",
    sku: "BB-MONIT-008",
    category: "Surveillance",
    brand: "Motorola"
  },
  {
    name: "Porte-Bébé Ergonomique",
    sku: "BB-PORTE-009",
    category: "Transport",
    brand: "Ergobaby"
  },
  {
    name: "Thermomètre Frontal",
    sku: "BB-THERM-010",
    category: "Santé",
    brand: "Braun"
  }
];

async function addSampleProducts() {
  console.log('📦 Ajout de produits d\'exemple...');
  
  try {
    let addedCount = 0;
    
    for (const product of sampleProducts) {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Produit ajouté: ${product.name} (ID: ${docRef.id})`);
      addedCount++;
    }
    
    console.log(`\n🎉 ${addedCount} produits d'exemple ajoutés avec succès!`);
    console.log('\n📋 Résumé des produits ajoutés:');
    
    // Grouper par catégorie
    const categories = {};
    sampleProducts.forEach(product => {
      if (!categories[product.category]) {
        categories[product.category] = [];
      }
      categories[product.category].push(product.name);
    });
    
    Object.entries(categories).forEach(([category, products]) => {
      console.log(`\n📂 ${category}:`);
      products.forEach(product => {
        console.log(`   - ${product}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des produits:', error);
  }
}

// Exécuter l'ajout
addSampleProducts()
  .then(() => {
    console.log('\n✅ Script terminé avec succès!');
    console.log('💡 Vous pouvez maintenant tester la page de gestion des produits');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec du script:', error);
    process.exit(1);
  });
