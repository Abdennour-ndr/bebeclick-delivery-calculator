/**
 * Configuration côté client pour BebeClick Delivery Calculator
 * Utilise les variables d'environnement Vite (VITE_*)
 */

// Configuration API
export const API_CONFIG = {
  // URL de base pour l'API Firebase
  mongoApiUrl: import.meta.env.VITE_MONGO_API_URL || 'http://localhost:3002',
  
  // Timeout pour les requêtes API
  timeout: 10000,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000
};

// Configuration des services
export const SERVICES_CONFIG = {
  // Services de livraison disponibles
  deliveryServices: ['yalidine', 'zaki', 'jamal-delivery'],
  
  // Service par défaut
  defaultService: 'yalidine',
  
  // Configuration du cache
  cacheEnabled: true,
  cacheExpiry: 5 * 60 * 1000 // 5 minutes
};

// Configuration de l'interface
export const UI_CONFIG = {
  // Thème par défaut
  defaultTheme: 'light',
  
  // Langue par défaut
  defaultLanguage: 'fr',
  
  // Raccourcis clavier
  shortcuts: {
    admin: 'Ctrl+Shift+A',
    diagnostic: 'Ctrl+Shift+D'
  }
};

// Configuration de développement
export const DEV_CONFIG = {
  // Mode développement
  isDevelopment: import.meta.env.DEV,
  
  // Logs détaillés
  enableDetailedLogs: import.meta.env.DEV,
  
  // Mock services
  useMockServices: import.meta.env.VITE_USE_MOCK === 'true'
};

// Helper pour vérifier la disponibilité des services
export const checkServiceAvailability = async () => {
  const results = {
    mongoApi: false,
    googleSheets: false
  };

  try {
    // Test API MongoDB
    const response = await fetch(`${API_CONFIG.mongoApiUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    results.mongoApi = response.ok;
  } catch (error) {
    console.warn('⚠️ API MongoDB non disponible:', error.message);
  }

  try {
    // Test Google Sheets (via une requête simple)
    // Cette vérification sera implémentée selon les besoins
    results.googleSheets = true; // Assumé disponible pour l'instant
  } catch (error) {
    console.warn('⚠️ Google Sheets non disponible:', error.message);
  }

  return results;
};

// Helper pour les requêtes API avec retry
export const apiRequest = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.mongoApiUrl}${url}`;
  
  let lastError;
  
  for (let attempt = 1; attempt <= API_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Tentative ${attempt}/${API_CONFIG.maxRetries} échouée:`, error.message);
      
      if (attempt < API_CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt));
      }
    }
  }
  
  throw lastError;
};

// Export par défaut
export default {
  API_CONFIG,
  SERVICES_CONFIG,
  UI_CONFIG,
  DEV_CONFIG,
  checkServiceAvailability,
  apiRequest
};
