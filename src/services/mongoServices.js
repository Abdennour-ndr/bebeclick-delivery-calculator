/**
 * Index des services MongoDB
 * Point d'entrée centralisé pour tous les services de base de données
 */

import mongoDeliveryPricingService from './mongoDeliveryPricingService.js';
import mongoProductService from './mongoProductService.js';
import mongoLocationService from './mongoLocationService.js';
import mongoSettingsService from './mongoSettingsService.js';

// Exporter tous les services
export {
  mongoDeliveryPricingService,
  mongoProductService,
  mongoLocationService,
  mongoSettingsService
};

// Export par défaut avec tous les services
export default {
  deliveryPricing: mongoDeliveryPricingService,
  products: mongoProductService,
  locations: mongoLocationService,
  settings: mongoSettingsService
};

/**
 * Initialiser tous les services MongoDB
 */
export const initializeAllServices = async () => {
  try {
    console.log('🔧 Initialisation des services MongoDB...');
    
    // Initialiser tous les services
    await mongoDeliveryPricingService.initialize();
    await mongoProductService.initialize();
    await mongoLocationService.initialize();
    await mongoSettingsService.initialize();
    
    console.log('✅ Tous les services MongoDB initialisés avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des services:', error);
    throw error;
  }
};

/**
 * Obtenir les statistiques de tous les services
 */
export const getAllServicesStats = async () => {
  try {
    console.log('📊 Récupération des statistiques de tous les services...');
    
    const [
      deliveryPricingStats,
      productStats,
      locationStats,
      settingsStats
    ] = await Promise.all([
      mongoDeliveryPricingService.getStats().catch(() => []),
      mongoProductService.getStats().catch(() => ({ general: [], categories: [] })),
      mongoLocationService.getStats().catch(() => ({ general: [], regions: [] })),
      mongoSettingsService.getStats().catch(() => [])
    ]);
    
    return {
      deliveryPricing: deliveryPricingStats,
      products: productStats,
      locations: locationStats,
      settings: settingsStats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    return null;
  }
};

/**
 * Vider tous les caches des services
 */
export const clearAllCaches = () => {
  try {
    console.log('🧹 Vidage de tous les caches...');
    
    mongoDeliveryPricingService.clearCache();
    mongoProductService.clearCache();
    mongoLocationService.clearCache();
    mongoSettingsService.clearCache();
    
    console.log('✅ Tous les caches vidés');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du vidage des caches:', error);
    return false;
  }
};

/**
 * Vérifier l'état de santé de tous les services
 */
export const checkServicesHealth = async () => {
  try {
    console.log('🏥 Vérification de l\'état des services...');
    
    const healthChecks = {
      deliveryPricing: false,
      products: false,
      locations: false,
      settings: false
    };
    
    // Test simple pour chaque service
    try {
      await mongoDeliveryPricingService.initialize();
      healthChecks.deliveryPricing = true;
    } catch (error) {
      console.error('❌ Service Delivery Pricing non disponible:', error.message);
    }
    
    try {
      await mongoProductService.initialize();
      healthChecks.products = true;
    } catch (error) {
      console.error('❌ Service Products non disponible:', error.message);
    }
    
    try {
      await mongoLocationService.initialize();
      healthChecks.locations = true;
    } catch (error) {
      console.error('❌ Service Locations non disponible:', error.message);
    }
    
    try {
      await mongoSettingsService.initialize();
      healthChecks.settings = true;
    } catch (error) {
      console.error('❌ Service Settings non disponible:', error.message);
    }
    
    const allHealthy = Object.values(healthChecks).every(status => status);
    
    console.log(`🏥 État des services: ${allHealthy ? 'Tous OK' : 'Problèmes détectés'}`);
    
    return {
      healthy: allHealthy,
      services: healthChecks,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de santé:', error);
    return {
      healthy: false,
      services: {},
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Utilitaire pour la migration des données depuis Google Sheets
 */
export const migrateFromGoogleSheets = async (options = {}) => {
  try {
    console.log('🔄 Début de la migration depuis Google Sheets...');
    
    const results = {
      deliveryPricing: { success: 0, errors: 0 },
      products: { success: 0, errors: 0 },
      locations: { success: 0, errors: 0 }
    };
    
    // Migration des prix de livraison
    if (options.migrateDeliveryPricing !== false) {
      console.log('💰 Migration des prix de livraison...');
      // TODO: Implémenter la migration depuis Google Sheets
      // Cette partie sera développée dans la prochaine étape
    }
    
    // Migration des produits
    if (options.migrateProducts !== false) {
      console.log('📦 Migration des produits...');
      // TODO: Implémenter la migration depuis Google Sheets
    }
    
    // Migration des locations
    if (options.migrateLocations !== false) {
      console.log('🗺️ Migration des locations...');
      // Initialiser les wilayas d'Algérie
      try {
        await mongoLocationService.initializeAlgerianWilayas();
        results.locations.success = 58; // 58 wilayas
      } catch (error) {
        console.error('❌ Erreur migration locations:', error);
        results.locations.errors = 1;
      }
    }
    
    console.log('✅ Migration terminée');
    return results;
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
};

/**
 * Utilitaire pour la synchronisation bidirectionnelle
 */
export const syncWithGoogleSheets = async (direction = 'both') => {
  try {
    console.log(`🔄 Synchronisation avec Google Sheets (${direction})...`);
    
    const results = {
      toMongoDB: { success: 0, errors: 0 },
      toGoogleSheets: { success: 0, errors: 0 }
    };
    
    // Synchronisation vers MongoDB
    if (direction === 'to-mongodb' || direction === 'both') {
      console.log('📥 Synchronisation vers MongoDB...');
      // TODO: Implémenter la synchronisation depuis Google Sheets vers MongoDB
    }
    
    // Synchronisation vers Google Sheets
    if (direction === 'to-sheets' || direction === 'both') {
      console.log('📤 Synchronisation vers Google Sheets...');
      // TODO: Implémenter la synchronisation depuis MongoDB vers Google Sheets
    }
    
    console.log('✅ Synchronisation terminée');
    return results;
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
};
