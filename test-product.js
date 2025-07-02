/**
 * Test d'ajout de produit via API
 */

const testProduct = async () => {
  try {
    console.log('🧪 Test d\'ajout de produit...');
    
    const productData = {
      sku: 'TEST-001',
      name: 'Produit Test API',
      brand: 'BebeClick',
      category: 'Test',
      dimensions: {
        length: 30,
        width: 20,
        height: 10,
        weight: 1.5
      },
      pricing: {
        salePrice: 25000,
        costPrice: 20000
      }
    };

    const response = await fetch('http://localhost:3001/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Produit ajouté avec succès!');
      console.log('📦 Données:', result.data);
      console.log('🆔 ID:', result.data._id);
      console.log('📅 Créé le:', result.data.createdAt);
      
      // Test de récupération
      console.log('\n🔍 Test de récupération...');
      const getResponse = await fetch('http://localhost:3001/api/products');
      const getResult = await getResponse.json();
      
      if (getResult.success) {
        console.log(`✅ ${getResult.data.length} produits récupérés`);
        const foundProduct = getResult.data.find(p => p.sku === 'TEST-001');
        if (foundProduct) {
          console.log('✅ Produit TEST-001 trouvé dans la liste!');
          console.log('📦 Nom:', foundProduct.name);
        } else {
          console.log('❌ Produit TEST-001 non trouvé');
        }
      }
      
    } else {
      console.log('❌ Erreur:', result.message);
    }

  } catch (error) {
    console.error('💥 Erreur test:', error.message);
  }
};

testProduct();
