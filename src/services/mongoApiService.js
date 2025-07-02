/**
 * Service API côté client pour MongoDB
 * Communique avec le serveur MongoDB via HTTP
 */

import { apiRequest, API_CONFIG, DEV_CONFIG } from '../config/clientConfig.js';

class MongoApiService {
  constructor() {
    this.baseUrl = API_CONFIG.mongoApiUrl;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    console.log('🌐 MongoDB API Service initialisé');
    console.log(`📡 URL de base: ${this.baseUrl}`);
  }

  /**
   * Vérifier la santé de l'API
   */
  async checkHealth() {
    try {
      const response = await apiRequest('/health');
      console.log('✅ API MongoDB disponible');
      return response;
    } catch (error) {
      console.warn('⚠️ API MongoDB non disponible:', error.message);
      return null;
    }
  }

  /**
   * Obtenir les prix de livraison
   */
  async getDeliveryPrice(destination, deliveryType = 'home', weight = 0, dimensions = {}, declaredValue = 0) {
    try {
      console.log(`💰 Recherche prix API pour: "${destination}"`);
      
      // Vérifier le cache
      const cacheKey = `price:${destination}:${deliveryType}:${weight}:${declaredValue}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📋 Prix trouvé dans le cache API');
        return cached;
      }

      // Appel API pour calculer le prix
      const params = new URLSearchParams({
        destination,
        deliveryType,
        weight: weight.toString(),
        declaredValue: declaredValue.toString(),
        length: (dimensions.length || 0).toString(),
        width: (dimensions.width || 0).toString(),
        height: (dimensions.height || 0).toString()
      });

      const response = await apiRequest(`/api/delivery-pricing/calculate?${params}`);
      
      if (response.success && response.data) {
        console.log('✅ Prix trouvé via API MongoDB');
        response.data.dataSource = 'mongodb-api';
        this.setCache(cacheKey, response.data);
        return response.data;
      }

      return null;

    } catch (error) {
      console.warn('⚠️ Erreur API MongoDB:', error.message);
      return null;
    }
  }

  /**
   * Sauvegarder un prix de livraison
   */
  async savePricing(pricingData) {
    try {
      console.log('💾 Sauvegarde prix via API');
      
      const response = await apiRequest('/api/delivery-pricing', {
        method: 'POST',
        body: JSON.stringify(pricingData)
      });

      if (response.success) {
        console.log('✅ Prix sauvegardé via API');
        this.clearCache(); // Invalider le cache
        return response.data;
      }

      throw new Error(response.message || 'Erreur de sauvegarde');

    } catch (error) {
      console.error('❌ Erreur sauvegarde API:', error.message);
      throw error;
    }
  }

  /**
   * Obtenir tous les prix pour un service
   */
  async getServicePricing(service) {
    try {
      console.log(`📋 Récupération prix ${service} via API`);
      
      const response = await apiRequest(`/api/delivery-pricing/service/${service}`);
      
      if (response.success) {
        console.log(`✅ ${response.data.length} prix récupérés pour ${service}`);
        return response.data;
      }

      return [];

    } catch (error) {
      console.warn('⚠️ Erreur récupération prix service:', error.message);
      return [];
    }
  }

  /**
   * Rechercher des produits
   */
  async searchProducts(searchTerm, limit = 20) {
    try {
      console.log(`🔍 Recherche produits API: "${searchTerm}"`);
      
      const params = new URLSearchParams({
        q: searchTerm,
        limit: limit.toString()
      });

      const response = await apiRequest(`/api/products/search?${params}`);
      
      if (response.success) {
        console.log(`✅ ${response.data.length} produits trouvés`);
        return response.data;
      }

      return [];

    } catch (error) {
      console.warn('⚠️ Erreur recherche produits:', error.message);
      return [];
    }
  }

  /**
   * Sauvegarder un produit
   */
  async saveProduct(productData) {
    try {
      console.log('💾 Sauvegarde produit via API');
      
      const response = await apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });

      if (response.success) {
        console.log('✅ Produit sauvegardé via API');
        return response.data;
      }

      throw new Error(response.message || 'Erreur de sauvegarde');

    } catch (error) {
      console.error('❌ Erreur sauvegarde produit:', error.message);
      throw error;
    }
  }

  /**
   * Obtenir toutes les wilayas
   */
  async getWilayas() {
    try {
      console.log('🗺️ Récupération wilayas via API');
      
      const response = await apiRequest('/api/locations/wilayas');
      
      if (response.success) {
        console.log(`✅ ${response.data.length} wilayas récupérées`);
        return response.data;
      }

      return [];

    } catch (error) {
      console.warn('⚠️ Erreur récupération wilayas:', error.message);
      return [];
    }
  }

  /**
   * Obtenir les communes d'une wilaya
   */
  async getCommunesByWilaya(wilayaCode) {
    try {
      console.log(`🏘️ Récupération communes wilaya ${wilayaCode} via API`);
      
      const response = await apiRequest(`/api/locations/communes/${wilayaCode}`);
      
      if (response.success) {
        console.log(`✅ ${response.data.length} communes récupérées`);
        return response.data;
      }

      return [];

    } catch (error) {
      console.warn('⚠️ Erreur récupération communes:', error.message);
      return [];
    }
  }

  /**
   * Ajouter une nouvelle commune
   */
  async addCommune(wilayaCode, communeData) {
    try {
      console.log(`🏘️ Ajout commune ${communeData.name} via API`);
      
      const response = await apiRequest('/api/locations/commune', {
        method: 'POST',
        body: JSON.stringify({ wilayaCode, communeData })
      });

      if (response.success) {
        console.log('✅ Commune ajoutée via API');
        return response.data;
      }

      throw new Error(response.message || 'Erreur d\'ajout');

    } catch (error) {
      console.error('❌ Erreur ajout commune:', error.message);
      throw error;
    }
  }

  /**
   * Initialiser les wilayas d'Algérie
   */
  async initializeAlgerianWilayas() {
    try {
      console.log('🇩🇿 Initialisation wilayas Algérie via API');
      
      const response = await apiRequest('/api/locations/initialize-algeria', {
        method: 'POST'
      });

      if (response.success) {
        console.log(`✅ ${response.summary.success} wilayas initialisées`);
        return response.data;
      }

      throw new Error(response.message || 'Erreur d\'initialisation');

    } catch (error) {
      console.error('❌ Erreur initialisation wilayas:', error.message);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    try {
      console.log('📊 Récupération statistiques via API');
      
      const response = await apiRequest('/api/delivery-pricing/stats');
      
      if (response.success) {
        console.log('✅ Statistiques récupérées');
        return response.data;
      }

      return [];

    } catch (error) {
      console.warn('⚠️ Erreur récupération statistiques:', error.message);
      return [];
    }
  }

  /**
   * Test de connexion
   */
  async testConnection() {
    try {
      console.log('🔧 Test de connexion API MongoDB');
      
      const response = await apiRequest('/api/test-mongo');
      
      if (response.success) {
        console.log('✅ Test de connexion réussi');
        return response;
      }

      return null;

    } catch (error) {
      console.warn('⚠️ Test de connexion échoué:', error.message);
      return null;
    }
  }

  /**
   * Gestion du cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache API vidé');
  }
}

// Instance singleton
const mongoApiService = new MongoApiService();

export default mongoApiService;
