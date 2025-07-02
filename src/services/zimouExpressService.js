/**
 * Service Zimou Express - API réelle pour wilayas, communes et tarifs
 * Utilisé en arrière-plan mais affiché comme "Yalidine" dans l'interface
 */

import { makeRateLimitedRequest } from './apiRateLimiter.js';

// Configuration Zimou Express API
const ZIMOU_API_CONFIG = {
  baseUrl: 'https://zimou.express/api/v1',
  apiKey: '303193|sPBaPu4FWkgoX4LDvSYkFf25J518RppUbxPEFS6g58b951e8',
  headers: {
    'Authorization': 'Bearer 303193|sPBaPu4FWkgoX4LDvSYkFf25J518RppUbxPEFS6g58b951e8',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Tarifs officiels Yalidine par zone (en DA)
const YALIDINE_OFFICIAL_PRICING = {
  1: { // Zone 1: Alger, Blida, Boumerdes, Tipaza
    express_home: 400,
    express_desk: 350,
    economic_home: 350,
    economic_desk: 300
  },
  2: { // Zone 2: Nord du pays
    express_home: 500,
    express_desk: 400,
    economic_home: 450,
    economic_desk: 350
  },
  3: { // Zone 3: Centre du pays
    express_home: 600,
    express_desk: 450,
    economic_home: 550,
    economic_desk: 400
  },
  4: { // Zone 4: Sud du pays
    express_home: 700,
    express_desk: 500,
    economic_home: 650,
    economic_desk: 450
  }
};

// Frais additionnels Yalidine
const YALIDINE_FEES = {
  oversize_fee: 100, // Par kg supplémentaire au-delà de 5kg
  cod_percentage: 0.75, // 0.75% du montant COD
  insurance_percentage: 0.75, // 0.75% du montant déclaré
  retour_fee: 250, // Frais de retour
  min_declared_value: 1000 // Valeur déclarée minimale
};

class ZimouExpressService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 heure
    this.apiAvailable = true;
    
    console.log('🚀 Zimou Express Service initialisé (affiché comme Yalidine)');
    console.log('📡 API URL:', ZIMOU_API_CONFIG.baseUrl);
  }

  /**
   * Faire une requête à l'API Zimou Express
   */
  async makeApiRequest(endpoint, params = {}, timeout = 15000) {
    const url = new URL(`${ZIMOU_API_CONFIG.baseUrl}${endpoint}`);

    // Séparer les paramètres de requête du timeout
    const queryParams = typeof params === 'object' && !Array.isArray(params) && params !== null ? params : {};
    const requestTimeout = typeof params === 'number' ? params : timeout;

    // Ajouter les paramètres de requête
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        url.searchParams.append(key, queryParams[key]);
      }
    });

    return makeRateLimitedRequest(async () => {
      try {
        console.log(`🔗 Requête Zimou API: ${endpoint} (timeout: ${requestTimeout}ms)`);

        // Créer un AbortController pour le timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

        try {
          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: ZIMOU_API_CONFIG.headers,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Zimou Error ${response.status}:`, {
              endpoint,
              status: response.status,
              statusText: response.statusText,
              response: errorText
            });
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
          }

          const data = await response.json();
          console.log(`✅ Requête Zimou réussie: ${endpoint}`, {
            dataSize: JSON.stringify(data).length,
            hasData: !!data.data,
            totalData: data.total || data.length || 'N/A'
          });
          return data;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error(`Timeout: ${endpoint} took longer than ${requestTimeout}ms`);
          }
          throw fetchError;
        }
      } catch (error) {
        console.error(`❌ Erreur API Zimou ${endpoint}:`, {
          error: error.message,
          url: url.toString()
        });
        throw error;
      }
    }, `Zimou-${endpoint}`);
  }

  /**
   * Charger toutes les wilayas depuis Zimou Express
   */
  async loadWilayas() {
    const cacheKey = 'wilayas';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📋 Wilayas depuis cache');
      return cached.data;
    }

    try {
      console.log('🌐 Chargement wilayas depuis Zimou Express...');

      const response = await this.makeApiRequest('/helpers/wilayas');

      // Adapter le format Zimou vers le format Yalidine
      const wilayas = (response.data || response).map(wilaya => ({
        id: wilaya.id,
        name: wilaya.name || wilaya.nom,
        zone: this.getWilayaZone(wilaya.id),
        is_deliverable: true
      }));

      // Trier par nom
      wilayas.sort((a, b) => a.name.localeCompare(b.name));

      this.cache.set(cacheKey, {
        data: wilayas,
        timestamp: Date.now()
      });

      console.log(`✅ ${wilayas.length} wilayas chargées depuis Zimou Express`);
      return wilayas;

    } catch (error) {
      console.error('❌ Erreur chargement wilayas Zimou:', error);
      this.apiAvailable = false;
      throw error;
    }
  }

  /**
   * Charger les prix Yalidine depuis Zimou Express
   */
  async loadYalidinePrices() {
    const cacheKey = 'yalidine_prices';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('💰 Prix Yalidine depuis cache');
      return cached.data;
    }

    try {
      console.log('💰 Chargement prix Yalidine depuis Zimou Express...');

      const response = await this.makeApiRequest('/my/prices');

      // Traiter les données de prix
      const pricesData = response.data || response;
      const pricesByWilaya = {};

      pricesData.forEach(item => {
        if (item.delivery_type_name === 'Maystro_ delivery' && item.price1 > 0) {
          const wilayaId = item.wilaya_id;

          if (!pricesByWilaya[wilayaId]) {
            pricesByWilaya[wilayaId] = {
              wilaya_id: wilayaId,
              wilaya_name: item.wilaya_name,
              home_price: item.price1,
              office_price: item.price2,
              delivery_days: {
                min: item.min_delivery_days,
                max: item.max_delivery_days
              }
            };
          }
        }
      });

      this.cache.set(cacheKey, {
        data: pricesByWilaya,
        timestamp: Date.now()
      });

      console.log(`✅ ${Object.keys(pricesByWilaya).length} prix Yalidine chargés depuis Zimou Express`);
      return pricesByWilaya;

    } catch (error) {
      console.error('❌ Erreur chargement prix Yalidine:', error);
      this.apiAvailable = false;
      throw error;
    }
  }

  /**
   * Charger les bureaux/offices depuis Zimou Express
   */
  async loadOffices() {
    const cacheKey = 'offices';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('🏢 Bureaux depuis cache');
      return cached.data;
    }

    // Essayer avec des timeouts progressifs
    const timeouts = [10000, 20000, 45000]; // 10s, 20s, 45s

    for (let i = 0; i < timeouts.length; i++) {
      try {
        console.log(`🏢 Tentative ${i + 1}/3 - Chargement bureaux (timeout: ${timeouts[i]}ms)...`);

        const response = await this.makeApiRequest('/helpers/offices', {}, timeouts[i]);

        // Adapter le format Zimou vers le format standard
        const offices = (response.data || response).map(office => ({
          id: office.id,
          name: office.name || office.nom,
          address: office.address || office.adresse,
          commune_id: office.commune_id,
          commune_name: office.commune_name || office.commune?.name,
          wilaya_id: office.wilaya_id,
          wilaya_name: office.wilaya_name || office.wilaya?.name,
          phone: office.phone || office.telephone,
          is_active: office.is_active !== false,
          coordinates: {
            latitude: office.latitude,
            longitude: office.longitude
          }
        }));

        this.cache.set(cacheKey, {
          data: offices,
          timestamp: Date.now()
        });

        console.log(`✅ ${offices.length} bureaux chargés depuis Zimou Express (tentative ${i + 1})`);
        return offices;

      } catch (error) {
        console.warn(`⚠️ Tentative ${i + 1} échouée:`, error.message);

        // Si c'est la dernière tentative, lancer l'erreur
        if (i === timeouts.length - 1) {
          console.error('❌ Toutes les tentatives de chargement bureaux ont échoué');
          this.apiAvailable = false;
          throw new Error(`Échec chargement bureaux après ${timeouts.length} tentatives: ${error.message}`);
        }

        // Attendre un peu avant la prochaine tentative
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Rechercher des bureaux par commune ou wilaya
   */
  async searchOffices(searchTerm, wilayaId = null) {
    try {
      const offices = await this.loadOffices();

      if (!searchTerm && !wilayaId) {
        return offices.slice(0, 20); // Limiter à 20 résultats
      }

      let filteredOffices = offices;

      // Filtrer par wilaya si spécifié
      if (wilayaId) {
        filteredOffices = filteredOffices.filter(office =>
          office.wilaya_id === parseInt(wilayaId)
        );
      }

      // Filtrer par terme de recherche
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        filteredOffices = filteredOffices.filter(office =>
          office.name.toLowerCase().includes(term) ||
          office.commune_name.toLowerCase().includes(term) ||
          office.address.toLowerCase().includes(term)
        );
      }

      return filteredOffices.slice(0, 20);
    } catch (error) {
      console.error('❌ Erreur recherche bureaux:', error);
      return [];
    }
  }

  /**
   * Obtenir les bureaux d'une commune spécifique
   */
  async getOfficesByCommune(communeId) {
    try {
      const offices = await this.loadOffices();
      return offices.filter(office =>
        office.commune_id === parseInt(communeId) && office.is_active
      );
    } catch (error) {
      console.error('❌ Erreur bureaux par commune:', error);
      return [];
    }
  }

  /**
   * Charger toutes les communes depuis Zimou Express
   */
  async loadCommunes() {
    const cacheKey = 'communes';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📋 Communes depuis cache');
      return cached.data;
    }

    try {
      console.log('🏘️ Chargement communes depuis Zimou Express...');

      const response = await this.makeApiRequest('/helpers/communes');

      // Adapter le format Zimou vers le format Yalidine
      const communes = (response.data || response).map(commune => ({
        id: commune.id,
        name: commune.name || commune.nom,
        wilaya_id: commune.wilaya_id,
        wilaya_name: commune.wilaya_name || commune.wilaya?.name,
        has_stop_desk: commune.has_stop_desk || false,
        is_deliverable: commune.is_deliverable !== false,
        delivery_time_parcel: commune.delivery_time || 48,
        delivery_time_payment: 10,
        zip_code: commune.zip_code
      }));

      this.cache.set(cacheKey, {
        data: communes,
        timestamp: Date.now()
      });

      console.log(`✅ ${communes.length} communes chargées depuis Zimou Express`);
      return communes;

    } catch (error) {
      console.error('❌ Erreur chargement communes Zimou:', error);
      this.apiAvailable = false;
      throw error;
    }
  }

  /**
   * Rechercher une commune avec prix Yalidine réels
   */
  async searchCommune(searchTerm) {
    const communes = await this.loadCommunes();
    const wilayas = await this.loadWilayas();
    const yalidinePrices = await this.loadYalidinePrices();
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];

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

        // Utiliser les prix Yalidine réels depuis l'API
        const realPricing = yalidinePrices[commune.wilaya_id];
        let homePrice, officePrice;

        if (realPricing) {
          homePrice = realPricing.home_price;
          officePrice = commune.has_stop_desk ? realPricing.office_price : null;
        } else {
          // Fallback vers les prix par défaut
          const defaultPricing = YALIDINE_OFFICIAL_PRICING[zone];
          homePrice = defaultPricing.express_home;
          officePrice = commune.has_stop_desk ? defaultPricing.express_desk : null;
        }

        return {
          wilayaCode: commune.wilaya_id.toString().padStart(2, '0'),
          wilayaName: commune.wilaya_name,
          communeName: commune.name,
          communeId: commune.id,
          hasStopDesk: commune.has_stop_desk,
          zone: zone,
          office: officePrice,
          home: homePrice,
          isDeliverable: commune.is_deliverable,
          deliveryTime: commune.delivery_time_parcel,
          realPricing: !!realPricing // Indicateur si prix réel utilisé
        };
      })
      .slice(0, 10);

    return results;
  }

  /**
   * Obtenir la zone d'une wilaya (mapping manuel)
   */
  getWilayaZone(wilayaId) {
    const zoneMapping = {
      // Zone 1: Alger, Blida, Boumerdes, Tipaza
      16: 1, 9: 1, 35: 1, 42: 1,
      
      // Zone 2: Nord du pays
      2: 2, 6: 2, 13: 2, 15: 2, 18: 2, 19: 2, 21: 2, 22: 2, 23: 2, 24: 2, 25: 2, 26: 2, 27: 2, 29: 2, 31: 2, 34: 2, 36: 2, 38: 2, 41: 2, 43: 2, 44: 2, 46: 2, 48: 2,
      
      // Zone 3: Centre du pays
      4: 3, 5: 3, 12: 3, 14: 3, 17: 3, 20: 3, 28: 3, 40: 3,
      
      // Zone 4: Sud du pays
      1: 4, 3: 4, 7: 4, 8: 4, 11: 4, 30: 4, 32: 4, 33: 4, 37: 4, 39: 4, 45: 4, 47: 4, 49: 4, 50: 4, 51: 4, 52: 4, 53: 4, 54: 4, 55: 4, 56: 4, 57: 4, 58: 4
    };

    return zoneMapping[wilayaId] || 3; // Zone 3 par défaut
  }

  /**
   * Calculer le prix de livraison avec tarifs Yalidine réels depuis API
   */
  async getDeliveryPrice(destination, deliveryType = 'home', weight = 0, dimensions = {}, declaredValue = 0) {
    console.log(`💰 Calcul prix Yalidine réel pour: "${destination}" (${deliveryType})`);

    const parts = destination.split(',').map(s => s.trim());
    const communeName = parts[0];

    if (!communeName) return null;

    try {
      const results = await this.searchCommune(communeName);

      if (results.length === 0) {
        console.log(`❌ Aucune commune trouvée pour: "${communeName}"`);
        return null;
      }

      const commune = results[0];

      // Utiliser les prix réels depuis l'API
      let basePrice = 0;
      if (deliveryType === 'office' && commune.hasStopDesk && commune.office) {
        basePrice = commune.office;
      } else {
        basePrice = commune.home;
      }

      // Calculer le poids facturable selon la formule Yalidine
      const billableWeight = this.calculateBillableWeight(weight, dimensions);

      // Calculer les frais de surpoids Yalidine (au-delà de 5kg)
      const zone = commune.zone || 3; // Zone par défaut
      const oversizeCharge = this.calculateOversizeCharge(billableWeight, zone);

      // Calculer les frais COD si applicable
      const codFee = declaredValue > 0 ? Math.max(declaredValue * YALIDINE_FEES.cod_percentage / 100, 0) : 0;

      // Prix total
      const totalPrice = basePrice + oversizeCharge + codFee;

      console.log(`✅ Prix Yalidine réel calculé: ${totalPrice} DA (base: ${basePrice}, surpoids: ${oversizeCharge}, COD: ${codFee})`);

      return {
        price: Math.round(totalPrice),
        basePrice: basePrice,
        oversizeCharge: oversizeCharge,
        codFee: codFee,
        commune: commune.communeName,
        wilaya: commune.wilayaName,
        zone: commune.zone,
        hasStopDesk: commune.hasStopDesk,
        billableWeight: billableWeight,
        deliveryType: deliveryType,
        deliveryTime: commune.deliveryTime,
        dataSource: commune.realPricing ? 'Yalidine API (Prix réels)' : 'Yalidine API (Prix par défaut)',
        realPricing: commune.realPricing,
        breakdown: {
          basePrice: basePrice,
          oversizeCharge: oversizeCharge,
          codFee: codFee,
          total: Math.round(totalPrice)
        }
      };
    } catch (error) {
      console.error('❌ Erreur calcul prix Yalidine:', error);
      return null;
    }
  }

  /**
   * Calculer les frais de surpoids selon les règles Yalidine
   */
  calculateOversizeCharge(billableWeight, zone = 3) {
    if (billableWeight <= 5) {
      return 0;
    }

    // Frais Yalidine selon la zone:
    // Zones 0, 1, 2, 3: 50 DA par kg supplémentaire
    // Zones 4, 5: 100 DA par kg supplémentaire
    const extraWeight = billableWeight - 5;
    const ratePerKg = (zone === 4 || zone === 5) ? 100 : 50;
    const charge = Math.ceil(extraWeight) * ratePerKg;

    console.log(`⚖️ Surpoids Yalidine: ${extraWeight.toFixed(2)}kg × ${ratePerKg}DA = ${charge}DA (Zone ${zone})`);

    return charge;
  }

  /**
   * Calculer le poids facturable
   */
  calculateBillableWeight(actualWeight, dimensions = {}) {
    const { width = 0, height = 0, length = 0 } = dimensions;
    
    // Formule volumétrique: L × l × h × 0.0002
    const volumetricWeight = width * height * length * 0.0002;
    
    // Poids facturable = max(poids réel, poids volumétrique)
    const billableWeight = Math.max(actualWeight, volumetricWeight);
    
    console.log(`📏 Poids: réel=${actualWeight}kg, volumétrique=${volumetricWeight.toFixed(2)}kg, facturable=${billableWeight.toFixed(2)}kg`);
    
    return billableWeight;
  }

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    try {
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
        dataSource: 'Zimou Express API (affiché comme Yalidine)',
        apiAvailable: this.apiAvailable,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur stats Zimou:', error);
      return {
        totalWilayas: 0,
        totalCommunes: 0,
        dataSource: 'Erreur Zimou Express',
        apiAvailable: false
      };
    }
  }

  /**
   * Obtenir les tarifs par zone
   */
  getZonePricing() {
    return ZONE_PRICING;
  }

  /**
   * Forcer le rechargement
   */
  async forceReload() {
    console.log('🔄 Rechargement cache Zimou Express...');
    this.cache.clear();
    this.apiAvailable = true;
    return true;
  }

  /**
   * Tester la connexion
   */
  async testConnection() {
    try {
      await this.makeApiRequest('/wilayas', { limit: 1 });
      this.apiAvailable = true;
      return true;
    } catch (error) {
      this.apiAvailable = false;
      return false;
    }
  }

  /**
   * Obtenir le mode actuel
   */
  getCurrentMode() {
    return {
      apiAvailable: this.apiAvailable,
      fallbackMode: false,
      mode: 'Zimou Express API',
      displayName: 'Yalidine' // Affiché comme Yalidine dans l'interface
    };
  }
}

// Instance singleton
const zimouExpressService = new ZimouExpressService();

export default zimouExpressService;
