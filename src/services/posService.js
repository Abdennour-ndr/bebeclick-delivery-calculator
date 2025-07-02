/**
 * Service pour l'intégration avec POS API BebeClick
 */

// Configuration pour développement et production
const isDevelopment = import.meta.env.DEV;
const POS_API_BASE = isDevelopment
  ? '/api/pos'  // Utiliser le proxy en développement
  : 'http://bebeclick-pos.estoriom.com/connector/api';
const ACCESS_TOKEN = '50HGKHNn2pkYDGBnlbLn4S0sdbYxO1G1Pu1YzUY9'; // À sécuriser

class POSService {
  constructor() {
    this.baseURL = POS_API_BASE;
    this.token = ACCESS_TOKEN;
    this.isDev = isDevelopment;
  }

  /**
   * Headers par défaut pour les requêtes
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Récupérer tous les produits avec pagination
   * @param {Object} params - Paramètres de recherche
   * @returns {Promise<Object>} - Réponse avec produits et pagination
   */
  async getProducts(params = {}) {
    try {
      const defaultParams = {
        per_page: 50,
        order_by: 'product_name',
        order_direction: 'asc'
      };

      const queryParams = { ...defaultParams, ...params };
      const queryString = new URLSearchParams(queryParams).toString();

      console.log(`🔄 Requête POS: ${this.baseURL}/product?${queryString}`);

      const response = await fetch(`${this.baseURL}/product?${queryString}`, {
        method: 'GET',
        headers: this.getHeaders(),
        mode: this.isDev ? 'cors' : 'cors', // Toujours CORS
        credentials: 'omit' // Pas de cookies
      });

      console.log(`📡 Réponse POS: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur POS détaillée:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Données POS reçues: ${data.data?.length || 0} produits`);
      return this.transformProductsData(data);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits POS:', error);
      throw error;
    }
  }

  /**
   * Rechercher des produits par nom ou SKU
   * @param {string} searchTerm - Terme de recherche
   * @returns {Promise<Array>} - Liste des produits trouvés
   */
  async searchProducts(searchTerm) {
    try {
      const [nameResults, skuResults] = await Promise.all([
        this.getProducts({ name: searchTerm }),
        this.getProducts({ sku: searchTerm })
      ]);

      // Combiner et dédupliquer les résultats
      const allResults = [...nameResults.products, ...skuResults.products];
      const uniqueResults = allResults.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );

      return uniqueResults;
    } catch (error) {
      console.error('Erreur lors de la recherche de produits:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les produits (toutes les pages)
   * @returns {Promise<Array>} - Tous les produits
   */
  async getAllProducts() {
    try {
      let allProducts = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await this.getProducts({ 
          per_page: 100,
          page: currentPage 
        });

        allProducts = [...allProducts, ...response.products];

        // Vérifier s'il y a plus de pages
        hasMorePages = response.pagination.current_page < response.pagination.last_page;
        currentPage++;

        // Limite de sécurité
        if (currentPage > 50) {
          console.warn('Limite de pages atteinte (50)');
          break;
        }
      }

      return allProducts;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les produits:', error);
      return [];
    }
  }

  /**
   * Transformer les données POS en format standardisé
   * @param {Object} rawData - Données brutes de l'API
   * @returns {Object} - Données transformées
   */
  transformProductsData(rawData) {
    const products = rawData.data.map(product => this.transformProduct(product));
    
    return {
      products,
      pagination: {
        current_page: rawData.meta.current_page,
        last_page: Math.ceil(rawData.meta.total / rawData.meta.per_page) || 1,
        per_page: rawData.meta.per_page,
        total: rawData.meta.total || rawData.data.length
      }
    };
  }

  /**
   * Transformer un produit individuel
   * @param {Object} product - Produit brut de l'API
   * @returns {Object} - Produit transformé
   */
  transformProduct(product) {
    // Extraire la première variation (généralement la principale)
    const mainVariation = product.product_variations?.[0]?.variations?.[0];
    
    return {
      // Informations de base
      id: product.id,
      name: product.name,
      sku: product.sku,
      type: product.type,
      
      // Informations commerciales
      price: mainVariation?.default_sell_price || 0,
      price_inc_tax: mainVariation?.sell_price_inc_tax || 0,
      
      // Classification
      brand: product.brand?.name || '',
      category: product.category?.name || '',
      sub_category: product.sub_category?.name || '',
      
      // Informations physiques (souvent vides dans POS)
      weight: product.weight || null,
      
      // Informations supplémentaires
      description: product.product_description || '',
      image_url: product.image_url || '',
      barcode: product.sku, // Utiliser SKU comme barcode
      
      // Stock (première location)
      stock_quantity: mainVariation?.variation_location_details?.[0]?.qty_available || 0,
      
      // Métadonnées
      is_active: !product.is_inactive,
      created_at: product.created_at,
      updated_at: product.updated_at,
      
      // Données brutes pour référence
      raw_data: product
    };
  }

  /**
   * Récupérer les produits par catégorie
   * @param {string} categoryId - ID de la catégorie
   * @returns {Promise<Array>} - Produits de la catégorie
   */
  async getProductsByCategory(categoryId) {
    try {
      const response = await this.getProducts({ category_id: categoryId });
      return response.products;
    } catch (error) {
      console.error('Erreur lors de la récupération par catégorie:', error);
      return [];
    }
  }

  /**
   * Récupérer les produits par marque
   * @param {string} brandId - ID de la marque
   * @returns {Promise<Array>} - Produits de la marque
   */
  async getProductsByBrand(brandId) {
    try {
      const response = await this.getProducts({ brand_id: brandId });
      return response.products;
    } catch (error) {
      console.error('Erreur lors de la récupération par marque:', error);
      return [];
    }
  }

  /**
   * Tester la connexion à l'API
   * @returns {Promise<boolean>} - Statut de la connexion
   */
  async testConnection() {
    try {
      console.log('🔍 Test de connexion POS...');
      const response = await this.getProducts({ per_page: 1 });
      console.log('✅ Connexion POS réussie');
      return response.products.length >= 0;
    } catch (error) {
      console.error('❌ Test de connexion POS échoué:', error);

      // En cas d'échec, proposer des données de test
      if (this.isDev) {
        console.log('🧪 Mode développement: utilisation de données de test');
        return 'test_mode';
      }

      return false;
    }
  }

  /**
   * Obtenir des données de test pour le développement
   * @returns {Object} - Données de test
   */
  getTestData() {
    return {
      products: [
        {
          id: 1,
          name: 'Poussette Baby Comfort Premium',
          sku: 'BC-POUS-001',
          type: 'single',
          price: 25000,
          price_inc_tax: 27500,
          brand: 'Baby Comfort',
          category: 'Poussettes',
          sub_category: 'Poussettes Premium',
          weight: 12.5,
          description: 'Poussette premium avec toutes les options',
          image_url: 'https://example.com/poussette.jpg',
          barcode: 'BC-POUS-001',
          stock_quantity: 15,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z'
        },
        {
          id: 2,
          name: 'Siège Auto Sécurité Plus',
          sku: 'BC-SIEGE-002',
          type: 'single',
          price: 18000,
          price_inc_tax: 19800,
          brand: 'Sécurité Plus',
          category: 'Sièges Auto',
          sub_category: 'Groupe 1-2-3',
          weight: 8.2,
          description: 'Siège auto évolutif groupe 1-2-3',
          image_url: 'https://example.com/siege.jpg',
          barcode: 'BC-SIEGE-002',
          stock_quantity: 8,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z'
        },
        {
          id: 3,
          name: 'Lit Bébé Évolutif Deluxe',
          sku: 'BC-LIT-003',
          type: 'single',
          price: 35000,
          price_inc_tax: 38500,
          brand: 'Deluxe Baby',
          category: 'Mobilier',
          sub_category: 'Lits',
          weight: 25.0,
          description: 'Lit bébé évolutif en bois massif',
          image_url: 'https://example.com/lit.jpg',
          barcode: 'BC-LIT-003',
          stock_quantity: 5,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-12T00:00:00Z'
        }
      ],
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 3
      }
    };
  }

  /**
   * Obtenir les statistiques des produits
   * @returns {Promise<Object>} - Statistiques
   */
  async getProductStats() {
    try {
      const response = await this.getProducts({ per_page: 1 });
      const totalProducts = response.pagination.total;
      
      return {
        total_products: totalProducts,
        api_status: 'connected',
        last_check: new Date().toISOString()
      };
    } catch (error) {
      return {
        total_products: 0,
        api_status: 'error',
        last_check: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Instance singleton
const posService = new POSService();

export default posService;
