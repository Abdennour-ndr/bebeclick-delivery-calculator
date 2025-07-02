/**
 * Index des modèles MongoDB
 * Point d'entrée centralisé pour tous les modèles de données
 */

import DeliveryPricing from './DeliveryPricing.js';
import Location from './Location.js';
import Product from './Product.js';
import Settings from './Settings.js';

// Exporter tous les modèles
export {
  DeliveryPricing,
  Location,
  Product,
  Settings
};

// Export par défaut avec tous les modèles
export default {
  DeliveryPricing,
  Location,
  Product,
  Settings
};

/**
 * Initialiser tous les modèles avec des données par défaut
 */
export const initializeAllModels = async () => {
  try {
    console.log('🔧 Initialisation des modèles MongoDB...');
    
    // Initialiser les paramètres par défaut
    await Settings.initializeDefaultSettings();
    
    console.log('✅ Tous les modèles initialisés avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des modèles:', error);
    throw error;
  }
};

/**
 * Obtenir les statistiques de tous les modèles
 */
export const getModelsStats = async () => {
  try {
    const stats = {
      deliveryPricing: await DeliveryPricing.countDocuments(),
      locations: await Location.countDocuments(),
      products: await Product.countDocuments(),
      settings: await Settings.countDocuments()
    };
    
    return stats;
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    return null;
  }
};
