import zimouExpressService from './zimouExpressService.js';
import { MISSING_WILAYAS } from '../utils/yalidineDataImporter.js';
import { makeRateLimitedRequest } from './apiRateLimiter.js';
import yalidineFeesService from './yalidineFeesService.js';

// Configuration API Yalidine
const YALIDINE_API_CONFIG = {
  baseUrl: 'https://api.yalidine.app/v1',
  apiToken: 'C3BpezWbhXURmYJnddfLgKKB49j1e6s1pZ8HMPT2lNSOQulb5EqMF8PQLaFrgii6',
  headers: {
    'Authorization': 'Bearer C3BpezWbhXURmYJnddfLgKKB49j1e6s1pZ8HMPT2lNSOQulb5EqMF8PQLaFrgii6',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Configuration Zimou Express
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
const YALIDINE_ZONE_PRICING = {
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

// Données statiques des wilayas
const STATIC_WILAYAS = [
  { id: 1, name: 'Adrar', zone: 4, is_deliverable: true },
  { id: 2, name: 'Chlef', zone: 2, is_deliverable: true },
  { id: 3, name: 'Laghouat', zone: 4, is_deliverable: true },
  { id: 4, name: 'Oum El Bouaghi', zone: 3, is_deliverable: true },
  { id: 5, name: 'Batna', zone: 3, is_deliverable: true },
  { id: 6, name: 'Béjaïa', zone: 2, is_deliverable: true },
  { id: 7, name: 'Biskra', zone: 4, is_deliverable: true },
  { id: 8, name: 'Béchar', zone: 4, is_deliverable: true },
  { id: 9, name: 'Blida', zone: 1, is_deliverable: true },
  { id: 10, name: 'Bouira', zone: 2, is_deliverable: true },
  { id: 11, name: 'Tamanrasset', zone: 4, is_deliverable: true },
  { id: 12, name: 'Tébessa', zone: 3, is_deliverable: true },
  { id: 13, name: 'Tlemcen', zone: 2, is_deliverable: true },
  { id: 14, name: 'Tiaret', zone: 3, is_deliverable: true },
  { id: 15, name: 'Tizi Ouzou', zone: 2, is_deliverable: true },
  { id: 16, name: 'Alger', zone: 1, is_deliverable: true },
  { id: 17, name: 'Djelfa', zone: 3, is_deliverable: true },
  { id: 18, name: 'Jijel', zone: 2, is_deliverable: true },
  { id: 19, name: 'Sétif', zone: 2, is_deliverable: true },
  { id: 20, name: 'Saïda', zone: 3, is_deliverable: true },
  { id: 21, name: 'Skikda', zone: 2, is_deliverable: true },
  { id: 22, name: 'Sidi Bel Abbès', zone: 2, is_deliverable: true },
  { id: 23, name: 'Annaba', zone: 2, is_deliverable: true },
  { id: 24, name: 'Guelma', zone: 2, is_deliverable: true },
  { id: 25, name: 'Constantine', zone: 2, is_deliverable: true },
  { id: 26, name: 'Médéa', zone: 2, is_deliverable: true },
  { id: 27, name: 'Mostaganem', zone: 2, is_deliverable: true },
  { id: 28, name: 'M\'Sila', zone: 3, is_deliverable: true },
  { id: 29, name: 'Mascara', zone: 2, is_deliverable: true },
  { id: 30, name: 'Ouargla', zone: 4, is_deliverable: true },
  { id: 31, name: 'Oran', zone: 2, is_deliverable: true },
  { id: 32, name: 'El Bayadh', zone: 4, is_deliverable: true },
  { id: 33, name: 'Illizi', zone: 4, is_deliverable: true },
  { id: 34, name: 'Bordj Bou Arréridj', zone: 2, is_deliverable: true },
  { id: 35, name: 'Boumerdès', zone: 1, is_deliverable: true },
  { id: 36, name: 'El Tarf', zone: 2, is_deliverable: true },
  { id: 37, name: 'Tindouf', zone: 4, is_deliverable: true },
  { id: 38, name: 'Tissemsilt', zone: 2, is_deliverable: true },
  { id: 39, name: 'El Oued', zone: 4, is_deliverable: true },
  { id: 40, name: 'Khenchela', zone: 3, is_deliverable: true },
  { id: 41, name: 'Souk Ahras', zone: 2, is_deliverable: true },
  { id: 42, name: 'Tipaza', zone: 1, is_deliverable: true },
  { id: 43, name: 'Mila', zone: 2, is_deliverable: true },
  { id: 44, name: 'Aïn Defla', zone: 2, is_deliverable: true },
  { id: 45, name: 'Naâma', zone: 4, is_deliverable: true },
  { id: 46, name: 'Aïn Témouchent', zone: 2, is_deliverable: true },
  { id: 47, name: 'Ghardaïa', zone: 4, is_deliverable: true },
  { id: 48, name: 'Relizane', zone: 2, is_deliverable: true }
];

class YalidineHybridService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.apiAvailable = null;
    this.fallbackMode = false;
    console.log('🔄 Yalidine Hybrid Service initialisé');
    this.testApiAvailability();
  }

  async testApiAvailability() {
    try {
      await zimouExpressService.loadWilayas();
      this.apiAvailable = true;
      this.fallbackMode = false;
      console.log('✅ Zimou Express API disponible');
    } catch (error) {
      this.apiAvailable = false;
      this.fallbackMode = true;
      console.log('⚠️ Zimou Express API indisponible - Mode Fallback');
    }
  }

  async loadWilayas() {
    const cacheKey = 'wilayas';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    let wilayas;
    try {
      console.log('🌐 Chargement wilayas via Zimou Express...');
      wilayas = await zimouExpressService.loadWilayas();
      this.apiAvailable = true;
      this.fallbackMode = false;
    } catch (error) {
      console.log('⚠️ Erreur Zimou Express, basculement vers données locales');
      this.apiAvailable = false;
      this.fallbackMode = true;
      wilayas = this.loadWilayasFromLocal();
    }

    this.cache.set(cacheKey, {
      data: wilayas,
      timestamp: Date.now()
    });

    console.log(`✅ ${wilayas.length} wilayas chargées`);
    return wilayas;
  }

  loadWilayasFromLocal() {
    console.log('📋 Chargement wilayas depuis données locales...');
    const allWilayas = [...STATIC_WILAYAS];
    
    Object.entries(MISSING_WILAYAS).forEach(([code, wilayaData]) => {
      const wilayaId = parseInt(code);
      const existingWilaya = allWilayas.find(w => w.id === wilayaId);
      
      if (!existingWilaya) {
        allWilayas.push({
          id: wilayaId,
          name: wilayaData.name,
          zone: this.getWilayaZone(wilayaId),
          is_deliverable: true
        });
      }
    });
    
    allWilayas.sort((a, b) => a.name.localeCompare(b.name));
    console.log(`✅ ${allWilayas.length} wilayas chargées (Local)`);
    return allWilayas;
  }

  getWilayaZone(wilayaId) {
    const zoneMapping = {
      16: 1, 9: 1, 35: 1, 42: 1, // Zone 1
      2: 2, 6: 2, 13: 2, 15: 2, 18: 2, 19: 2, 21: 2, 22: 2, 23: 2, 24: 2, 25: 2, 26: 2, 27: 2, 29: 2, 31: 2, 34: 2, 36: 2, 38: 2, 41: 2, 43: 2, 44: 2, 46: 2, 48: 2, // Zone 2
      4: 3, 5: 3, 12: 3, 14: 3, 17: 3, 20: 3, 28: 3, 40: 3, // Zone 3
      1: 4, 3: 4, 7: 4, 8: 4, 11: 4, 30: 4, 32: 4, 33: 4, 37: 4, 39: 4, 45: 4, 47: 4 // Zone 4
    };
    return zoneMapping[wilayaId] || 3;
  }

  async loadCommunes() {
    try {
      console.log('🏘️ Chargement communes via Zimou Express...');
      const communes = await zimouExpressService.loadCommunes();
      this.apiAvailable = true;
      this.fallbackMode = false;
      console.log(`✅ ${communes.length} communes chargées via Zimou Express`);
      return communes;
    } catch (error) {
      console.log('⚠️ Erreur Zimou Express communes, basculement vers données locales');
      this.apiAvailable = false;
      this.fallbackMode = true;
      return this.loadCommunesFromLocal();
    }
  }

  async loadOffices() {
    try {
      console.log('🏢 Chargement bureaux via Zimou Express...');
      const offices = await zimouExpressService.loadOffices();
      this.apiAvailable = true;
      this.fallbackMode = false;
      console.log(`✅ ${offices.length} bureaux chargés via Zimou Express`);
      return offices;
    } catch (error) {
      console.log('⚠️ Erreur Zimou Express bureaux, basculement vers données locales');
      this.apiAvailable = false;
      this.fallbackMode = true;
      return this.loadOfficesFromLocal();
    }
  }

  loadOfficesFromLocal() {
    console.log('📋 Chargement bureaux depuis données locales...');

    // Bureaux principaux par wilaya (données de base)
    const localOffices = [
      // Alger
      { id: 1001, name: 'Bureau Central Alger', address: 'Centre-ville, Alger', commune_name: 'Alger Centre', wilaya_id: 16, wilaya_name: 'Alger', phone: '021-XX-XX-XX', is_active: true },
      { id: 1002, name: 'Bureau Bab Ezzouar', address: 'Bab Ezzouar, Alger', commune_name: 'Bab Ezzouar', wilaya_id: 16, wilaya_name: 'Alger', phone: '021-XX-XX-XX', is_active: true },

      // Oran
      { id: 3101, name: 'Bureau Central Oran', address: 'Centre-ville, Oran', commune_name: 'Oran', wilaya_id: 31, wilaya_name: 'Oran', phone: '041-XX-XX-XX', is_active: true },
      { id: 3102, name: 'Bureau Es Senia', address: 'Es Senia, Oran', commune_name: 'Es Senia', wilaya_id: 31, wilaya_name: 'Oran', phone: '041-XX-XX-XX', is_active: true },

      // Constantine
      { id: 2501, name: 'Bureau Central Constantine', address: 'Centre-ville, Constantine', commune_name: 'Constantine', wilaya_id: 25, wilaya_name: 'Constantine', phone: '031-XX-XX-XX', is_active: true },

      // Annaba
      { id: 2301, name: 'Bureau Central Annaba', address: 'Centre-ville, Annaba', commune_name: 'Annaba', wilaya_id: 23, wilaya_name: 'Annaba', phone: '038-XX-XX-XX', is_active: true },

      // Sétif
      { id: 1901, name: 'Bureau Central Sétif', address: 'Centre-ville, Sétif', commune_name: 'Sétif', wilaya_id: 19, wilaya_name: 'Sétif', phone: '036-XX-XX-XX', is_active: true },

      // Blida
      { id: 901, name: 'Bureau Central Blida', address: 'Centre-ville, Blida', commune_name: 'Blida', wilaya_id: 9, wilaya_name: 'Blida', phone: '025-XX-XX-XX', is_active: true },

      // Tizi Ouzou
      { id: 1501, name: 'Bureau Central Tizi Ouzou', address: 'Centre-ville, Tizi Ouzou', commune_name: 'Tizi Ouzou', wilaya_id: 15, wilaya_name: 'Tizi Ouzou', phone: '026-XX-XX-XX', is_active: true },

      // Béjaïa
      { id: 601, name: 'Bureau Central Béjaïa', address: 'Centre-ville, Béjaïa', commune_name: 'Béjaïa', wilaya_id: 6, wilaya_name: 'Béjaïa', phone: '034-XX-XX-XX', is_active: true },

      // Batna
      { id: 501, name: 'Bureau Central Batna', address: 'Centre-ville, Batna', commune_name: 'Batna', wilaya_id: 5, wilaya_name: 'Batna', phone: '033-XX-XX-XX', is_active: true },

      // Djelfa
      { id: 1701, name: 'Bureau Central Djelfa', address: 'Centre-ville, Djelfa', commune_name: 'Djelfa', wilaya_id: 17, wilaya_name: 'Djelfa', phone: '027-XX-XX-XX', is_active: true }
    ];

    // Ajouter des bureaux depuis les données des wilayas manquantes
    Object.entries(MISSING_WILAYAS).forEach(([code, wilayaData]) => {
      const wilayaId = parseInt(code);
      const mainCommune = Object.keys(wilayaData.communes)[0]; // Première commune comme bureau principal

      if (mainCommune && !localOffices.find(o => o.wilaya_id === wilayaId)) {
        localOffices.push({
          id: wilayaId * 100 + 1,
          name: `Bureau Central ${wilayaData.name}`,
          address: `Centre-ville, ${wilayaData.name}`,
          commune_name: mainCommune,
          wilaya_id: wilayaId,
          wilaya_name: wilayaData.name,
          phone: 'N/A',
          is_active: true,
          coordinates: null
        });
      }
    });

    console.log(`✅ ${localOffices.length} bureaux chargés (données locales)`);
    return localOffices;
  }

  async searchOffices(searchTerm, wilayaId = null) {
    try {
      return await zimouExpressService.searchOffices(searchTerm, wilayaId);
    } catch (error) {
      console.log('⚠️ Erreur recherche bureaux Zimou');
      return [];
    }
  }

  async getOfficesByCommune(communeId) {
    try {
      return await zimouExpressService.getOfficesByCommune(communeId);
    } catch (error) {
      console.log('⚠️ Erreur bureaux par commune');
      return [];
    }
  }

  loadCommunesFromLocal() {
    console.log('📋 Chargement communes depuis données locales...');
    const allCommunes = [];
    
    Object.entries(MISSING_WILAYAS).forEach(([code, wilayaData]) => {
      const wilayaId = parseInt(code);
      let communeId = wilayaId * 1000;

      Object.entries(wilayaData.communes).forEach(([communeName, prices]) => {
        allCommunes.push({
          id: communeId++,
          name: communeName,
          wilaya_id: wilayaId,
          wilaya_name: wilayaData.name,
          has_stop_desk: communeName === wilayaData.name,
          is_deliverable: true,
          delivery_time_parcel: 48,
          delivery_time_payment: 10,
          pricing: prices
        });
      });
    });
    
    console.log(`✅ ${allCommunes.length} communes chargées (Local)`);
    return allCommunes;
  }

  async searchCommune(searchTerm) {
    try {
      const results = await zimouExpressService.searchCommune(searchTerm);
      console.log(`🔍 Recherche Zimou Express: ${results.length} résultats`);
      return results;
    } catch (error) {
      console.log('⚠️ Erreur recherche Zimou, fallback local');
      const communes = await this.loadCommunes();
      const wilayas = await this.loadWilayas();

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
          const pricing = YALIDINE_ZONE_PRICING[zone] || YALIDINE_ZONE_PRICING[3];

          let officePrice = commune.has_stop_desk ? pricing.express_desk : null;
          let homePrice = pricing.express_home;
          
          if (commune.pricing) {
            officePrice = commune.pricing.office;
            homePrice = commune.pricing.home;
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
            deliveryTime: commune.delivery_time_parcel
          };
        })
        .slice(0, 10);

      return results;
    }
  }

  async getDeliveryPrice(destination, deliveryType = 'home', weight = 0, dimensions = {}, declaredValue = 0) {
    try {
      // Utiliser Zimou Express pour les prix réels Yalidine
      const result = await zimouExpressService.getDeliveryPrice(destination, deliveryType, weight, dimensions, declaredValue);
      if (result) {
        console.log(`💰 Prix Yalidine réel: ${result.price} DA (Source: ${result.dataSource})`);
        return result;
      }
    } catch (error) {
      console.log('⚠️ Erreur Zimou Express, calcul fallback');
    }
    
    // Fallback simple
    const results = await this.searchCommune(destination.split(',')[0]);
    if (results.length === 0) return null;
    
    const commune = results[0];
    const basePrice = deliveryType === 'office' && commune.hasStopDesk ? commune.office : commune.home;
    const billableWeight = Math.max(weight, (dimensions.length * dimensions.width * dimensions.height) / 5000);

    // Calculer les frais de surpoids selon la zone
    let oversizeCharge = 0;
    if (billableWeight > 5) {
      const extraWeight = billableWeight - 5;
      const zone = commune.zone || 3;
      const ratePerKg = (zone === 4 || zone === 5) ? 100 : 50; // 100DA pour zones 4-5, 50DA pour zones 0-3
      oversizeCharge = Math.ceil(extraWeight) * ratePerKg;
    }
    
    return {
      price: Math.round(basePrice + oversizeCharge),
      basePrice: basePrice,
      oversizeCharge: oversizeCharge,
      commune: commune.communeName,
      wilaya: commune.wilayaName,
      zone: commune.zone,
      hasStopDesk: commune.hasStopDesk,
      billableWeight: billableWeight,
      deliveryType: deliveryType,
      dataSource: 'Fallback Local'
    };
  }

  async forceReload() {
    this.cache.clear();
    await this.testApiAvailability();
    return true;
  }

  getZonePricing() {
    return YALIDINE_ZONE_PRICING;
  }

  getServiceInfo() {
    return {
      apiAvailable: this.apiAvailable,
      fallbackMode: this.fallbackMode,
      mode: this.fallbackMode ? 'Statique' : 'API'
    };
  }
}

// Instance singleton
const yalidineHybridService = new YalidineHybridService();

export default yalidineHybridService;
