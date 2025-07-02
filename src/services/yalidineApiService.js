/**
 * Service pour l'API officielle Yalidine
 * Récupère les prix réels basés sur les stop desks et zones
 * Avec protection rate limiting
 */

import { makeRateLimitedRequest } from './apiRateLimiter.js';

// Configuration API Yalidine
const YALIDINE_API_CONFIG = {
  baseUrl: 'https://api.yalidine.app/v1',
  apiId: '53332088154627079445',
  apiToken: 'C3BpezWbhXURmYJnddfLgKKB49j1e6s1pZ8HMPT2lNSOQulb5EqMF8PQLaFrgii6'
};

// Tarifs de base par zone (en DA)
const ZONE_PRICING = {
  1: { home: 400, office: 350 }, // Zone 1 (Alger, Blida, Boumerdes, Tipaza)
  2: { home: 500, office: 400 }, // Zone 2 (Nord du pays)
  3: { home: 600, office: 450 }, // Zone 3 (Centre du pays)
  4: { home: 700, office: 500 }  // Zone 4 (Sud du pays)
};

class YalidineApiService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes pour les données API
    this.isLoading = false;
    this.wilayas = null;
    this.communes = null;

    // Log des nouvelles credentials
    console.log('🔑 Yalidine API Service initialisé avec:', {
      apiId: YALIDINE_API_CONFIG.apiId,
      baseUrl: YALIDINE_API_CONFIG.baseUrl,
      tokenLength: YALIDINE_API_CONFIG.apiToken.length
    });
  }

  /**
   * Faire une requête à l'API Yalidine avec rate limiting
   */
  async makeApiRequest(endpoint, params = {}) {
    const url = new URL(`${YALIDINE_API_CONFIG.baseUrl}${endpoint}`);

    // Ajouter les paramètres à l'URL
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    // Utiliser le rate limiter pour la requête
    return makeRateLimitedRequest(async () => {
      try {
        console.log(`🔗 Requête Yalidine API: ${endpoint}`);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'X-API-ID': YALIDINE_API_CONFIG.apiId,
            'X-API-TOKEN': YALIDINE_API_CONFIG.apiToken,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Yalidine Error ${response.status}:`, {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            response: errorText,
            apiId: YALIDINE_API_CONFIG.apiId
          });
          throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ Requête Yalidine réussie: ${endpoint}`, {
          dataSize: JSON.stringify(data).length,
          hasData: !!data.data,
          totalData: data.total_data || 'N/A'
        });
        return data;
      } catch (error) {
        console.error(`❌ Erreur API Yalidine ${endpoint}:`, {
          error: error.message,
          apiId: YALIDINE_API_CONFIG.apiId,
          url: url.toString()
        });
        throw error;
      }
    }, `Yalidine-${endpoint}`);
  }

  /**
   * Charger toutes les wilayas
   */
  async loadWilayas() {
    const cacheKey = 'wilayas';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    try {
      console.log('🔄 Chargement wilayas depuis API Yalidine...');
      const response = await this.makeApiRequest('/wilayas', {
        fields: 'id,name,zone,is_deliverable'
      });

      const wilayas = response.data || [];
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        data: wilayas,
        timestamp: Date.now()
      });

      this.wilayas = wilayas;
      console.log(`✅ ${wilayas.length} wilayas chargées depuis API`);
      
      return wilayas;
    } catch (error) {
      console.error('❌ Erreur chargement wilayas:', error);
      return this.getFallbackWilayas();
    }
  }

  /**
   * Charger toutes les communes
   */
  async loadCommunes() {
    const cacheKey = 'communes';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    try {
      console.log('🔄 Chargement communes depuis API Yalidine...');
      
      // Charger toutes les communes par pages
      let allCommunes = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) { // Limite à 10 pages pour éviter les boucles infinies
        const response = await this.makeApiRequest('/communes', {
          fields: 'id,name,wilaya_id,wilaya_name,has_stop_desk,is_deliverable',
          page: page,
          page_size: 100
        });

        const communes = response.data || [];
        allCommunes = allCommunes.concat(communes);
        
        hasMore = response.has_more;
        page++;
        
        console.log(`📄 Page ${page-1}: ${communes.length} communes chargées`);
      }
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        data: allCommunes,
        timestamp: Date.now()
      });

      this.communes = allCommunes;
      console.log(`✅ ${allCommunes.length} communes chargées depuis API`);
      
      return allCommunes;
    } catch (error) {
      console.error('❌ Erreur chargement communes:', error);
      return this.getFallbackCommunes();
    }
  }

  /**
   * Rechercher une commune par nom
   */
  async searchCommune(searchTerm) {
    const communes = await this.loadCommunes();
    const wilayas = await this.loadWilayas();
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];

    // Créer un map des wilayas pour accès rapide
    const wilayaMap = {};
    wilayas.forEach(w => {
      wilayaMap[w.id] = w;
    });

    const results = communes
      .filter(commune => 
        commune.name.toLowerCase().includes(term) && 
        commune.is_deliverable
      )
      .map(commune => {
        const wilaya = wilayaMap[commune.wilaya_id];
        const zone = wilaya ? wilaya.zone : 3;
        const pricing = ZONE_PRICING[zone] || ZONE_PRICING[3];
        
        return {
          wilayaCode: commune.wilaya_id.toString().padStart(2, '0'),
          wilayaName: commune.wilaya_name,
          communeName: commune.name,
          communeId: commune.id,
          hasStopDesk: commune.has_stop_desk,
          zone: zone,
          office: commune.has_stop_desk ? pricing.office : null,
          home: pricing.home,
          isDeliverable: commune.is_deliverable
        };
      })
      .slice(0, 10);

    return results;
  }

  /**
   * Obtenir le prix de livraison pour une destination
   */
  async getDeliveryPrice(destination, deliveryType = 'home') {
    console.log(`🔍 Recherche prix API pour: "${destination}" (${deliveryType})`);

    // Extraire le nom de la commune de la destination
    const parts = destination.split(',').map(s => s.trim());
    const communeName = parts[0];

    if (!communeName) return null;

    try {
      const results = await this.searchCommune(communeName);
      
      if (results.length === 0) {
        console.log(`❌ Aucune commune trouvée pour: "${communeName}"`);
        return null;
      }

      const commune = results[0]; // Prendre le premier résultat
      
      // Déterminer le prix selon le type de livraison
      let price = null;
      
      if (deliveryType === 'office' && commune.hasStopDesk) {
        price = commune.office;
        console.log(`✅ Prix bureau (stop desk): ${price} DA`);
      } else {
        price = commune.home;
        console.log(`✅ Prix domicile (zone ${commune.zone}): ${price} DA`);
      }

      return {
        price: price,
        commune: commune.communeName,
        wilaya: commune.wilayaName,
        zone: commune.zone,
        hasStopDesk: commune.hasStopDesk,
        deliveryType: deliveryType
      };
    } catch (error) {
      console.error('❌ Erreur recherche prix:', error);
      return null;
    }
  }

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    const wilayas = await this.loadWilayas();
    const communes = await this.loadCommunes();
    
    const deliverableWilayas = wilayas.filter(w => w.is_deliverable).length;
    const deliverableCommunes = communes.filter(c => c.is_deliverable).length;
    const communesWithStopDesk = communes.filter(c => c.has_stop_desk).length;

    return {
      totalWilayas: wilayas.length,
      deliverableWilayas: deliverableWilayas,
      totalCommunes: communes.length,
      deliverableCommunes: deliverableCommunes,
      communesWithStopDesk: communesWithStopDesk,
      dataSource: 'Yalidine API',
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Forcer le rechargement des données
   */
  async forceReload() {
    this.cache.clear();
    this.wilayas = null;
    this.communes = null;
    
    await Promise.all([
      this.loadWilayas(),
      this.loadCommunes()
    ]);
    
    return true;
  }

  /**
   * Données de fallback pour les wilayas
   */
  getFallbackWilayas() {
    return [
      { id: 1, name: "Adrar", zone: 4, is_deliverable: true },
      { id: 2, name: "Chlef", zone: 2, is_deliverable: true },
      { id: 16, name: "Alger", zone: 1, is_deliverable: true },
      { id: 31, name: "Oran", zone: 2, is_deliverable: true }
    ];
  }

  /**
   * Données de fallback pour les communes
   */
  getFallbackCommunes() {
    return [
      { id: 101, name: "Adrar", wilaya_id: 1, wilaya_name: "Adrar", has_stop_desk: false, is_deliverable: true },
      { id: 201, name: "Chlef", wilaya_id: 2, wilaya_name: "Chlef", has_stop_desk: true, is_deliverable: true },
      { id: 1601, name: "Alger Centre", wilaya_id: 16, wilaya_name: "Alger", has_stop_desk: true, is_deliverable: true },
      { id: 3101, name: "Oran", wilaya_id: 31, wilaya_name: "Oran", has_stop_desk: true, is_deliverable: true }
    ];
  }

  /**
   * Vérifier la connectivité API avec diagnostic détaillé
   */
  async testConnection() {
    try {
      console.log('🔍 Test de connexion Yalidine API...');
      console.log('📋 Credentials utilisées:', {
        apiId: YALIDINE_API_CONFIG.apiId,
        baseUrl: YALIDINE_API_CONFIG.baseUrl,
        tokenPrefix: YALIDINE_API_CONFIG.apiToken.substring(0, 10) + '...'
      });

      const result = await this.makeApiRequest('/wilayas', { page_size: 1 });

      console.log('✅ Test de connexion réussi:', {
        totalWilayas: result.total_data,
        hasData: !!result.data,
        dataLength: result.data?.length || 0
      });

      return true;
    } catch (error) {
      console.error('❌ Test connexion API échoué:', {
        error: error.message,
        apiId: YALIDINE_API_CONFIG.apiId,
        baseUrl: YALIDINE_API_CONFIG.baseUrl
      });
      return false;
    }
  }

  /**
   * Obtenir les zones et leurs tarifs
   */
  getZonePricing() {
    return ZONE_PRICING;
  }

  /**
   * Diagnostic complet de l'API
   */
  async runDiagnostic() {
    console.log('🔍 Démarrage diagnostic Yalidine API...');

    const diagnostic = {
      timestamp: new Date().toISOString(),
      apiConfig: {
        apiId: YALIDINE_API_CONFIG.apiId,
        baseUrl: YALIDINE_API_CONFIG.baseUrl,
        tokenLength: YALIDINE_API_CONFIG.apiToken.length
      },
      tests: {}
    };

    try {
      // Test 1: Connexion de base
      console.log('📡 Test 1: Connexion de base...');
      diagnostic.tests.connection = await this.testConnection();

      // Test 2: Chargement wilayas
      console.log('🏛️ Test 2: Chargement wilayas...');
      try {
        const wilayas = await this.loadWilayas();
        diagnostic.tests.wilayas = {
          success: true,
          count: wilayas.length,
          deliverable: wilayas.filter(w => w.is_deliverable).length
        };
      } catch (error) {
        diagnostic.tests.wilayas = {
          success: false,
          error: error.message
        };
      }

      // Test 3: Chargement communes (échantillon)
      console.log('🏘️ Test 3: Chargement communes...');
      try {
        const communes = await this.makeApiRequest('/communes', { page_size: 10 });
        diagnostic.tests.communes = {
          success: true,
          sampleSize: communes.data?.length || 0,
          totalAvailable: communes.total_data || 0
        };
      } catch (error) {
        diagnostic.tests.communes = {
          success: false,
          error: error.message
        };
      }

      // Test 4: Recherche commune
      console.log('🔍 Test 4: Recherche commune...');
      try {
        const searchResults = await this.searchCommune('Alger');
        diagnostic.tests.search = {
          success: true,
          resultsCount: searchResults.length,
          hasStopDesk: searchResults.filter(r => r.hasStopDesk).length
        };
      } catch (error) {
        diagnostic.tests.search = {
          success: false,
          error: error.message
        };
      }

      diagnostic.overall = {
        success: Object.values(diagnostic.tests).every(test => test.success),
        successfulTests: Object.values(diagnostic.tests).filter(test => test.success).length,
        totalTests: Object.keys(diagnostic.tests).length
      };

      console.log('📊 Diagnostic terminé:', diagnostic);
      return diagnostic;

    } catch (error) {
      diagnostic.overall = {
        success: false,
        error: error.message
      };
      console.error('❌ Erreur pendant le diagnostic:', error);
      return diagnostic;
    }
  }
}

// Instance singleton
const yalidineApiService = new YalidineApiService();

export default yalidineApiService;
