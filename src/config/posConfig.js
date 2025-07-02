/**
 * Configuration pour l'API POS BebeClick
 */

// Configuration de base
export const POS_CONFIG = {
  // URL de base de l'API POS
  BASE_URL: 'http://bebeclick-pos.estoriom.com/connector/api',
  
  // Token d'accès (à sécuriser en production)
  ACCESS_TOKEN: '50HGKHNn2pkYDGBnlbLn4S0sdbYxO1G1Pu1YzUY9',
  
  // Paramètres par défaut
  DEFAULT_PARAMS: {
    per_page: 50,
    order_by: 'product_name',
    order_direction: 'asc'
  },
  
  // Limites et timeouts
  LIMITS: {
    max_products_per_request: 100,
    max_pages: 50,
    request_timeout: 30000, // 30 secondes
    cache_duration: 5 * 60 * 1000 // 5 minutes
  },
  
  // Configuration des endpoints
  ENDPOINTS: {
    products: '/product',
    categories: '/categories',
    brands: '/brands'
  }
};

// Configuration pour la correspondance des produits
export const MATCHING_CONFIG = {
  // Seuils de confiance pour la correspondance
  CONFIDENCE_THRESHOLDS: {
    sku_match: 1.0,
    exact_name: 0.95,
    fuzzy_name: 0.7,
    minimum_acceptable: 0.5
  },
  
  // Priorité des méthodes de correspondance
  MATCH_PRIORITY: [
    'sku',
    'exact_name', 
    'fuzzy_name'
  ],
  
  // Configuration de la recherche fuzzy
  FUZZY_SEARCH: {
    max_results: 5,
    min_similarity: 0.5,
    normalize_strings: true
  }
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Impossible de se connecter à l\'API POS',
  AUTHENTICATION_FAILED: 'Échec de l\'authentification POS',
  RATE_LIMIT_EXCEEDED: 'Limite de requêtes dépassée',
  PRODUCT_NOT_FOUND: 'Produit non trouvé dans le POS',
  INVALID_RESPONSE: 'Réponse invalide de l\'API POS',
  NETWORK_ERROR: 'Erreur réseau lors de la connexion au POS'
};

// Configuration de développement
export const DEV_CONFIG = {
  // Activer les logs détaillés
  ENABLE_DETAILED_LOGS: true,
  
  // Simuler des délais réseau
  SIMULATE_NETWORK_DELAY: false,
  NETWORK_DELAY_MS: 1000,
  
  // Mode hors ligne pour les tests
  OFFLINE_MODE: false,
  
  // Données de test
  MOCK_DATA: {
    products: [
      {
        id: 1,
        name: 'Poussette Test',
        sku: 'TEST-001',
        price: 25000,
        brand: 'Test Brand',
        category: 'Poussettes'
      }
    ]
  }
};

// Validation de la configuration
export function validatePOSConfig() {
  const errors = [];
  
  if (!POS_CONFIG.BASE_URL) {
    errors.push('URL de base POS manquante');
  }
  
  if (!POS_CONFIG.ACCESS_TOKEN) {
    errors.push('Token d\'accès POS manquant');
  }
  
  if (errors.length > 0) {
    console.error('Erreurs de configuration POS:', errors);
    return false;
  }
  
  return true;
}

// Utilitaires de configuration
export const CONFIG_UTILS = {
  /**
   * Obtenir l'URL complète d'un endpoint
   */
  getEndpointURL: (endpoint) => {
    return `${POS_CONFIG.BASE_URL}${POS_CONFIG.ENDPOINTS[endpoint] || endpoint}`;
  },
  
  /**
   * Obtenir les headers par défaut
   */
  getDefaultHeaders: () => ({
    'Authorization': `Bearer ${POS_CONFIG.ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }),
  
  /**
   * Vérifier si on est en mode développement
   */
  isDevelopment: () => {
    return process.env.NODE_ENV === 'development';
  },
  
  /**
   * Obtenir la configuration selon l'environnement
   */
  getEnvironmentConfig: () => {
    if (CONFIG_UTILS.isDevelopment()) {
      return { ...POS_CONFIG, ...DEV_CONFIG };
    }
    return POS_CONFIG;
  }
};

// Export par défaut
export default {
  POS_CONFIG,
  MATCHING_CONFIG,
  ERROR_MESSAGES,
  DEV_CONFIG,
  validatePOSConfig,
  CONFIG_UTILS
};
