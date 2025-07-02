/**
 * Service hybride pour les prix de livraison
 * Utilise MongoDB comme source principale avec Google Sheets comme fallback
 */

import mongoApiService from './mongoApiService.js';
import firebaseService from './firebaseService.js';
import mockMongoService from './mockMongoService.js';
import googleSheetsYalidineService from './googleSheetsYalidineService.js';
import { DEV_CONFIG } from '../config/clientConfig.js';

class HybridDeliveryService {
  constructor() {
    this.primarySource = 'mongodb';
    this.fallbackSource = 'google-sheets';
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    console.log('🔄 Hybrid Delivery Service initialisé');
  }

  /**
   * Obtenir les prix de livraison avec fallback automatique
   */
  async getDeliveryPrice(destination, deliveryType = 'home', weight = 0, dimensions = {}, declaredValue = 0) {
    try {
      console.log(`💰 Recherche prix hybride pour: "${destination}"`);
      
      // Vérifier le cache d'abord
      const cacheKey = `${destination}-${deliveryType}-${weight}-${declaredValue}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        console.log('📋 Prix trouvé dans le cache hybride');
        return cachedResult;
      }

      // Essayer Firebase d'abord
      try {
        const firebaseResult = await firebaseService.getDeliveryPrice(
          destination, deliveryType, weight, dimensions, declaredValue
        );

        if (firebaseResult) {
          console.log('✅ Prix trouvé via Firebase');
          this.setCache(cacheKey, firebaseResult);
          return firebaseResult;
        }
      } catch (firebaseError) {
        console.warn('⚠️ Erreur Firebase, tentative MongoDB API:', firebaseError.message);

        // Fallback vers MongoDB API
        try {
          const mongoResult = await mongoApiService.getDeliveryPrice(
            destination, deliveryType, weight, dimensions, declaredValue
          );

          if (mongoResult) {
            console.log('✅ Prix trouvé via MongoDB API');
            this.setCache(cacheKey, mongoResult);
            return mongoResult;
          }
        } catch (mongoError) {
          console.warn('⚠️ Erreur MongoDB API, tentative service simulé:', mongoError.message);

          // Fallback vers le service simulé
          try {
            const mockResult = await mockMongoService.getDeliveryPrice(
              destination, deliveryType, weight, dimensions, declaredValue
            );

            if (mockResult) {
              console.log('✅ Prix trouvé dans service simulé');
              this.setCache(cacheKey, mockResult);
              return mockResult;
            }
          } catch (mockError) {
            console.warn('⚠️ Erreur service simulé:', mockError.message);
          }
        }
      }

      // Fallback vers Google Sheets
      try {
        const sheetsResult = await googleSheetsYalidineService.getDeliveryPrice(
          destination, deliveryType, weight, dimensions, declaredValue
        );
        
        if (sheetsResult) {
          console.log('✅ Prix trouvé dans Google Sheets (fallback)');
          sheetsResult.dataSource = 'google-sheets-fallback';
          this.setCache(cacheKey, sheetsResult);
          
          // Optionnel: sauvegarder dans MongoDB pour la prochaine fois
          this.syncToMongoDB(destination, sheetsResult).catch(err => 
            console.warn('⚠️ Erreur sync vers MongoDB:', err.message)
          );
          
          return sheetsResult;
        }
      } catch (sheetsError) {
        console.warn('⚠️ Erreur Google Sheets:', sheetsError.message);
      }

      console.log('❌ Aucun prix trouvé dans les deux sources');
      return null;

    } catch (error) {
      console.error('💥 Erreur dans le service hybride:', error);
      return null;
    }
  }

  /**
   * Sauvegarder un prix (priorité à MongoDB)
   */
  async savePricing(pricingData) {
    try {
      console.log('💾 Sauvegarde hybride du prix');
      
      // Sauvegarder dans MongoDB d'abord
      let mongoResult = null;
      try {
        mongoResult = await mongoDeliveryPricingService.savePricing(pricingData);
        console.log('✅ Prix sauvegardé dans MongoDB');
      } catch (mongoError) {
        console.warn('⚠️ Erreur sauvegarde MongoDB:', mongoError.message);
      }

      // Sauvegarder aussi dans Google Sheets pour la synchronisation
      try {
        // Note: Google Sheets service n'a pas de méthode savePricing
        // Cette fonctionnalité pourrait être ajoutée plus tard
        console.log('📝 Synchronisation Google Sheets à implémenter');
      } catch (sheetsError) {
        console.warn('⚠️ Erreur sync Google Sheets:', sheetsError.message);
      }

      // Invalider le cache
      this.clearCache();

      return mongoResult;

    } catch (error) {
      console.error('💥 Erreur sauvegarde hybride:', error);
      throw error;
    }
  }

  /**
   * Synchroniser les données de Google Sheets vers MongoDB
   */
  async syncFromGoogleSheets() {
    try {
      console.log('🔄 Début synchronisation Google Sheets → MongoDB');
      
      // Cette méthode nécessiterait d'étendre googleSheetsYalidineService
      // pour exposer toutes les données, pas seulement les requêtes individuelles
      
      console.log('📝 Synchronisation complète à implémenter');
      return { success: true, message: 'Synchronisation à implémenter' };

    } catch (error) {
      console.error('💥 Erreur synchronisation:', error);
      throw error;
    }
  }

  /**
   * Synchroniser un prix spécifique vers MongoDB
   */
  async syncToMongoDB(destination, pricingResult) {
    try {
      // Extraire les informations du résultat pour créer un objet MongoDB
      const pricingData = this.convertResultToPricingData(destination, pricingResult);
      
      if (pricingData) {
        await mongoDeliveryPricingService.savePricing(pricingData);
        console.log('✅ Prix synchronisé vers MongoDB');
      }

    } catch (error) {
      console.warn('⚠️ Erreur sync vers MongoDB:', error.message);
    }
  }

  /**
   * Convertir un résultat de prix en données MongoDB
   */
  convertResultToPricingData(destination, result) {
    try {
      // Parser la destination
      const parts = destination.split(',').map(s => s.trim());
      if (parts.length < 2) return null;

      const commune = parts[0];
      const wilayaName = parts[1];
      
      // Mapping simplifié des wilayas (à étendre)
      const wilayaMapping = {
        'Alger': 16, 'Oran': 31, 'Constantine': 25, 'Annaba': 23,
        'Blida': 9, 'Batna': 5, 'Djelfa': 17, 'Sétif': 19
      };
      
      const wilayaCode = wilayaMapping[wilayaName] || 16;

      return {
        service: result.service || 'yalidine',
        wilaya: {
          code: wilayaCode,
          name: wilayaName
        },
        commune: commune,
        pricing: {
          home: result.basePrice || result.price || 0,
          office: Math.round((result.basePrice || result.price || 0) * 0.9), // Estimation
          supplements: {
            codFeePercentage: 1,
            codFeeFixed: 0,
            overweightFee: 250,
            overweightThreshold: 5
          }
        },
        zone: this.getZoneFromWilaya(wilayaName),
        metadata: {
          dataSource: 'google-sheets-sync',
          lastUpdated: new Date(),
          updatedBy: 'hybrid-service'
        }
      };

    } catch (error) {
      console.warn('⚠️ Erreur conversion données:', error.message);
      return null;
    }
  }

  /**
   * Obtenir la zone de tarification basée sur la wilaya
   */
  getZoneFromWilaya(wilayaName) {
    const zoneMapping = {
      'Alger': 1, 'Blida': 1, 'Boumerdès': 1, 'Tipaza': 1,
      'Oran': 2, 'Tlemcen': 2, 'Sidi Bel Abbès': 2,
      'Constantine': 3, 'Annaba': 3, 'Sétif': 3,
      'Ouargla': 4, 'Tamanrasset': 4, 'Adrar': 4
    };
    
    return zoneMapping[wilayaName] || 2;
  }

  /**
   * Obtenir les statistiques des deux sources
   */
  async getStats() {
    try {
      const [mongoStats, sheetsStats] = await Promise.all([
        mongoDeliveryPricingService.getStats().catch(() => []),
        // Google Sheets stats à implémenter
        Promise.resolve([])
      ]);

      return {
        mongodb: mongoStats,
        googleSheets: sheetsStats,
        cacheSize: this.cache.size,
        primarySource: this.primarySource,
        fallbackSource: this.fallbackSource
      };

    } catch (error) {
      console.error('💥 Erreur récupération stats:', error);
      return null;
    }
  }

  /**
   * Changer la source principale
   */
  setPrimarySource(source) {
    if (['mongodb', 'google-sheets'].includes(source)) {
      this.primarySource = source;
      this.clearCache(); // Vider le cache lors du changement
      console.log(`🔄 Source principale changée vers: ${source}`);
    } else {
      throw new Error('Source invalide. Utilisez "mongodb" ou "google-sheets"');
    }
  }

  /**
   * Vérifier l'état de santé des deux sources
   */
  async checkHealth() {
    const health = {
      mongodb: false,
      googleSheets: false,
      overall: false
    };

    try {
      // Test MongoDB
      await mongoDeliveryPricingService.initialize();
      health.mongodb = true;
    } catch (error) {
      console.warn('⚠️ MongoDB non disponible:', error.message);
    }

    try {
      // Test Google Sheets (requête simple)
      await googleSheetsYalidineService.getDeliveryPrice('Test, Alger');
      health.googleSheets = true;
    } catch (error) {
      console.warn('⚠️ Google Sheets non disponible:', error.message);
    }

    health.overall = health.mongodb || health.googleSheets;

    return health;
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
    console.log('🧹 Cache hybride vidé');
  }
}

// Instance singleton
const hybridDeliveryService = new HybridDeliveryService();

export default hybridDeliveryService;
