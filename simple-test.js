/**
 * Test simple de l'API
 */

import http from 'http';

const testAPI = () => {
  console.log('🧪 Test simple de l\'API...');
  
  // Test GET health
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Réponse /health:', JSON.parse(data));
      
      // Test GET products
      testProducts();
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Erreur:', error.message);
  });
  
  req.end();
};

const testProducts = () => {
  console.log('\n🔍 Test récupération produits...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/products',
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log('✅ Produits récupérés:', result.count || 0);
      if (result.data && result.data.length > 0) {
        console.log('📦 Premier produit:', result.data[0].name);
      }
      
      // Test POST product
      testAddProduct();
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Erreur:', error.message);
  });
  
  req.end();
};

const testAddProduct = () => {
  console.log('\n➕ Test ajout produit...');
  
  const productData = JSON.stringify({
    sku: 'TEST-SIMPLE',
    name: 'Test Simple',
    dimensions: { length: 10, width: 10, height: 10, weight: 1 }
  });
  
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/products',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(productData)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('✅ Produit ajouté avec succès!');
        console.log('🆔 ID:', result.data._id);
      } else {
        console.log('❌ Erreur ajout:', result.message);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Erreur:', error.message);
  });
  
  req.write(productData);
  req.end();
};

testAPI();
