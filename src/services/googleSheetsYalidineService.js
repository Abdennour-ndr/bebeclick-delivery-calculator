/**
 * Service Google Sheets pour données Yalidine
 * Solution robuste utilisant Google Sheets comme base de données
 * Affiché comme "Yalidine" dans l'interface
 */

import { makeRateLimitedRequest } from './apiRateLimiter.js';

// Configuration Google Sheets
const GOOGLE_SHEETS_CONFIG = {
  apiKey: 'AIzaSyCAx9J4hejd-vmM4xVoIqw_qNdC3AezZ90',
  spreadsheetId: '1upqT76F2lCYRtoensQAUPQHlQwxLn5xWvAeryWQ7DvU',
  baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets'
};

// Tarifs par zone (DA)
const ZONE_PRICING = {
  1: { home: 400, office: 350 }, // Zone 1 (Alger, Blida, Boumerdes, Tipaza)
  2: { home: 500, office: 400 }, // Zone 2 (Nord du pays)
  3: { home: 600, office: 450 }, // Zone 3 (Centre du pays)
  4: { home: 700, office: 500 }  // Zone 4 (Sud du pays)
};

class GoogleSheetsYalidineService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.apiAvailable = true;
    
    console.log('🚀 Google Sheets Yalidine Service initialisé');
    console.log('📊 Spreadsheet ID:', GOOGLE_SHEETS_CONFIG.spreadsheetId);
  }

  /**
   * Faire une requête à Google Sheets API
   */
  async makeGoogleSheetsRequest(range) {
    const url = `${GOOGLE_SHEETS_CONFIG.baseUrl}/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/${range}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`;
    
    return makeRateLimitedRequest(async () => {
      try {
        console.log(` Requête Google Sheets: ${range}`);

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Google Sheets Error ${response.status}:`, {
            range,
            status: response.status,
            statusText: response.statusText,
            response: errorText
          });
          throw new Error(`Google Sheets Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Google Sheets réussi: ${range}`, {
          rows: data.values?.length || 0
        });
        return data;
      } catch (error) {
        console.error(`❌ Erreur Google Sheets ${range}:`, error.message);
        throw error;
      }
    }, `GoogleSheets-${range}`);
  }

  /**
   * Charger les wilayas depuis Google Sheets
   */
  async loadWilayas() {
    const cacheKey = 'wilayas';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📋 Wilayas depuis cache');
      return cached.data;
    }

    try {
      console.log('🌐 Chargement wilayas depuis Google Sheets...');
      
      const response = await this.makeGoogleSheetsRequest('Wilayas!A:D');
      
      if (!response.values || response.values.length < 2) {
        throw new Error('Aucune donnée wilayas trouvée');
      }

      // Ignorer la première ligne (headers)
      const rows = response.values.slice(1);
      
      const wilayas = rows
        .filter(row => row.length >= 2 && row[0] && row[1]) // ID et nom requis
        .map(row => ({
          id: parseInt(row[0]) || 0,
          name: row[1] || '',
          zone: parseInt(row[2]) || 3, // Zone par défaut: 3
          is_deliverable: row[3] !== 'false' && row[3] !== '0' // Livrable par défaut
        }))
        .filter(wilaya => wilaya.id > 0 && wilaya.name.length > 0);

      // Trier par nom
      wilayas.sort((a, b) => a.name.localeCompare(b.name));

      this.cache.set(cacheKey, {
        data: wilayas,
        timestamp: Date.now()
      });

      console.log(`✅ ${wilayas.length} wilayas chargées depuis Google Sheets`);
      return wilayas;

    } catch (error) {
      console.error('❌ Erreur chargement wilayas Google Sheets:', error);
      this.apiAvailable = false;
      throw error;
    }
  }

  /**
   * Charger les communes depuis Google Sheets
   */
  async loadCommunes() {
    const cacheKey = 'communes';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📋 Communes depuis cache');
      return cached.data;
    }

    try {
      console.log('🏘️ Chargement communes depuis Google Sheets...');
      
      const response = await this.makeGoogleSheetsRequest('Communes!A:F');
      
      if (!response.values || response.values.length < 2) {
        throw new Error('Aucune donnée communes trouvée');
      }

      // Ignorer la première ligne (headers)
      const rows = response.values.slice(1);
      
      const communes = rows
        .filter(row => row.length >= 3 && row[0] && row[1] && row[2]) // ID, nom, wilaya_id requis
        .map(row => ({
          id: parseInt(row[0]) || 0,
          name: row[1] || '',
          wilaya_id: parseInt(row[2]) || 0,
          wilaya_name: row[3] || '',
          has_stop_desk: row[4] === 'true' || row[4] === '1',
          is_deliverable: row[5] !== 'false' && row[5] !== '0',
          delivery_time_parcel: 48,
          delivery_time_payment: 10
        }))
        .filter(commune => commune.id > 0 && commune.name.length > 0 && commune.wilaya_id > 0);

      this.cache.set(cacheKey, {
        data: communes,
        timestamp: Date.now()
      });

      console.log(`✅ ${communes.length} communes chargées depuis Google Sheets`);
      return communes;

    } catch (error) {
      console.error('❌ Erreur chargement communes Google Sheets:', error);
      this.apiAvailable = false;
      throw error;
    }
  }

  /**
   * Rechercher une commune
   */
  async searchCommune(searchTerm) {
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
        const pricing = ZONE_PRICING[zone];
        
        return {
          wilayaCode: commune.wilaya_id.toString().padStart(2, '0'),
          wilayaName: commune.wilaya_name || (wilaya ? wilaya.name : ''),
          communeName: commune.name,
          communeId: commune.id,
          hasStopDesk: commune.has_stop_desk,
          zone: zone,
          office: commune.has_stop_desk ? pricing.office : null,
          home: pricing.home,
          isDeliverable: commune.is_deliverable,
          deliveryTime: commune.delivery_time_parcel
        };
      })
      .slice(0, 10);

    return results;
  }

  /**
   * Calculer le prix de livraison
   */
  async getDeliveryPrice(destination, deliveryType = 'home', weight = 0, dimensions = {}) {
    console.log(`💰 Calcul prix Google Sheets pour: "${destination}" (${deliveryType})`);

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
      const zone = commune.zone;
      const pricing = ZONE_PRICING[zone];
      
      // Prix de base selon le type de livraison
      let basePrice = 0;
      if (deliveryType === 'office' && commune.hasStopDesk) {
        basePrice = pricing.office;
      } else {
        basePrice = pricing.home;
      }

      // Calculer le poids facturable
      const billableWeight = this.calculateBillableWeight(weight, dimensions);

      // Calculer les frais de surpoids (au-delà de 5kg) selon la zone
      let oversizeCharge = 0;
      if (billableWeight > 5) {
        const extraWeight = billableWeight - 5;
        const ratePerKg = (zone === 4 || zone === 5) ? 100 : 50; // 100DA pour zones 4-5, 50DA pour zones 0-3
        oversizeCharge = Math.ceil(extraWeight) * ratePerKg;
      }

      // Prix total
      const totalPrice = basePrice + oversizeCharge;

      console.log(`✅ Prix calculé: ${totalPrice} DA (base: ${basePrice}, surpoids: ${oversizeCharge})`);

      return {
        price: Math.round(totalPrice),
        basePrice: basePrice,
        oversizeCharge: oversizeCharge,
        commune: commune.communeName,
        wilaya: commune.wilayaName,
        zone: zone,
        hasStopDesk: commune.hasStopDesk,
        billableWeight: billableWeight,
        deliveryType: deliveryType,
        deliveryTime: commune.deliveryTime,
        dataSource: 'Google Sheets (Yalidine)',
        breakdown: {
          basePrice: basePrice,
          oversizeCharge: oversizeCharge,
          total: Math.round(totalPrice)
        }
      };
    } catch (error) {
      console.error('❌ Erreur calcul prix Google Sheets:', error);
      return null;
    }
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
        dataSource: 'Google Sheets (Yalidine)',
        apiAvailable: this.apiAvailable,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur stats Google Sheets:', error);
      return {
        totalWilayas: 0,
        totalCommunes: 0,
        dataSource: 'Erreur Google Sheets',
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
    console.log('🔄 Rechargement cache Google Sheets...');
    this.cache.clear();
    this.apiAvailable = true;
    return true;
  }

  /**
   * Tester la connexion
   */
  async testConnection() {
    try {
      await this.loadWilayas();
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
      mode: 'Google Sheets',
      displayName: 'Yalidine' // Affiché comme Yalidine dans l'interface
    };
  }
}

// Instance singleton
const googleSheetsYalidineService = new GoogleSheetsYalidineService();

export default googleSheetsYalidineService;
