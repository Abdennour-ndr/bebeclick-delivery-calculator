/**
 * Service MongoDB simulé pour démonstration
 * Simule les fonctionnalités MongoDB en attendant la résolution des problèmes de connexion
 */

class MockMongoService {
  constructor() {
    this.data = {
      deliveryPricing: [
        {
          _id: '1',
          service: 'yalidine',
          wilaya: { code: 16, name: 'Alger' },
          commune: 'Alger Centre',
          pricing: { home: 400, office: 350 },
          zone: 1,
          status: 'active',
          dataSource: 'mongodb-mock'
        },
        {
          _id: '2',
          service: 'yalidine',
          wilaya: { code: 31, name: 'Oran' },
          commune: 'Oran Centre',
          pricing: { home: 450, office: 400 },
          zone: 2,
          status: 'active',
          dataSource: 'mongodb-mock'
        }
      ],
      products: [
        {
          _id: '1',
          sku: 'DEMO-001',
          name: 'Produit Démonstration',
          brand: 'BebeClick',
          category: 'Test',
          dimensions: { length: 30, width: 20, height: 10, weight: 1.5 },
          pricing: { salePrice: 25000, costPrice: 20000 },
          status: 'active',
          dataSource: 'mongodb-mock'
        }
      ],
      locations: [
        {
          _id: '1',
          type: 'wilaya',
          code: 16,
          name: 'Alger',
          nameAr: 'الجزائر',
          deliveryConfig: { pricingZone: 1, averageDeliveryTime: 2 }
        },
        {
          _id: '2',
          type: 'commune',
          code: 1601,
          name: 'Alger Centre',
          hierarchy: { wilayaCode: 16, wilayaName: 'Alger' },
          deliveryConfig: { pricingZone: 1, averageDeliveryTime: 2 }
        }
      ]
    };
    
    console.log('🎭 Mock MongoDB Service initialisé (simulation)');
  }

  // Simulation des prix de livraison
  async getDeliveryPrice(destination, deliveryType = 'home', weight = 0, dimensions = {}, declaredValue = 0) {
    console.log(`🎭 Mock: Recherche prix pour "${destination}"`);
    
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Recherche simulée
    const found = this.data.deliveryPricing.find(item => 
      destination.toLowerCase().includes(item.commune.toLowerCase())
    );
    
    if (found) {
      const basePrice = found.pricing[deliveryType] || found.pricing.home;
      let totalPrice = basePrice;
      
      // Simulation des suppléments
      if (weight > 5) {
        totalPrice += (weight - 5) * 250; // Surpoids
      }
      
      if (declaredValue > 0) {
        totalPrice += declaredValue * 0.01; // 1% remboursement
      }
      
      return {
        price: Math.round(totalPrice),
        basePrice: basePrice,
        supplements: {
          overweight: weight > 5 ? (weight - 5) * 250 : 0,
          cod: declaredValue > 0 ? declaredValue * 0.01 : 0
        },
        service: found.service,
        location: `${found.commune}, ${found.wilaya.name}`,
        deliveryType,
        dataSource: 'mongodb-mock'
      };
    }
    
    return null;
  }

  async savePricing(pricingData) {
    console.log('🎭 Mock: Sauvegarde prix', pricingData.commune);
    
    // Simulation d'un délai
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newItem = {
      _id: Date.now().toString(),
      ...pricingData,
      dataSource: 'mongodb-mock',
      createdAt: new Date()
    };
    
    this.data.deliveryPricing.push(newItem);
    return newItem;
  }

  async getServicePricing(service) {
    console.log(`🎭 Mock: Récupération prix pour ${service}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.data.deliveryPricing.filter(item => item.service === service);
  }

  async searchProducts(searchTerm, limit = 20) {
    console.log(`🎭 Mock: Recherche produits "${searchTerm}"`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.data.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, limit);
  }

  async saveProduct(productData) {
    console.log('🎭 Mock: Sauvegarde produit', productData.name);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newProduct = {
      _id: Date.now().toString(),
      ...productData,
      dataSource: 'mongodb-mock',
      createdAt: new Date()
    };
    
    this.data.products.push(newProduct);
    return newProduct;
  }

  async getWilayas() {
    console.log('🎭 Mock: Récupération wilayas');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.data.locations.filter(loc => loc.type === 'wilaya');
  }

  async getCommunesByWilaya(wilayaCode) {
    console.log(`🎭 Mock: Récupération communes wilaya ${wilayaCode}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.data.locations.filter(loc => 
      loc.type === 'commune' && loc.hierarchy?.wilayaCode === wilayaCode
    );
  }

  async addCommune(wilayaCode, communeData) {
    console.log(`🎭 Mock: Ajout commune ${communeData.name}`);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newCommune = {
      _id: Date.now().toString(),
      type: 'commune',
      code: Date.now(),
      name: communeData.name,
      nameAr: communeData.nameAr,
      hierarchy: {
        wilayaCode: wilayaCode,
        wilayaName: this.data.locations.find(w => w.code === wilayaCode)?.name || 'Inconnue'
      },
      deliveryConfig: {
        pricingZone: communeData.pricingZone || 1,
        averageDeliveryTime: communeData.averageDeliveryTime || 3
      },
      dataSource: 'mongodb-mock',
      createdAt: new Date()
    };
    
    this.data.locations.push(newCommune);
    return newCommune;
  }

  async getStats() {
    console.log('🎭 Mock: Récupération statistiques');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return [
      {
        _id: 'yalidine',
        count: this.data.deliveryPricing.filter(p => p.service === 'yalidine').length,
        avgHomePrice: 425
      },
      {
        _id: 'zaki',
        count: 0,
        avgHomePrice: 0
      }
    ];
  }

  async initialize() {
    console.log('🎭 Mock: Initialisation (simulation)');
    return true;
  }

  clearCache() {
    console.log('🎭 Mock: Cache vidé (simulation)');
  }

  // Simulation de l'état de santé
  async checkHealth() {
    return {
      mongodb: false, // Indique que c'est une simulation
      googleSheets: true,
      overall: true,
      mock: true
    };
  }
}

// Instance singleton
const mockMongoService = new MockMongoService();

export default mockMongoService;
