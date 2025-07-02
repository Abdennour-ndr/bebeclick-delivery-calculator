/**
 * Service Yalidine Fees - Calcul précis des tarifs
 * Utilise l'API /v1/fees pour obtenir les prix exacts
 */

import { makeRateLimitedRequest } from './apiRateLimiter.js';

// Configuration API Yalidine
const YALIDINE_API_CONFIG = {
  baseUrl: 'https://api.yalidine.app/v1',
  apiId: '53332088154627079445',
  apiToken: 'C3BpezWbhXURmYJnddfLgKKB49j1e6s1pZ8HMPT2lNSOQulb5EqMF8PQLaFrgii6'
};

// Wilaya par défaut (Alger) pour l'expédition
const DEFAULT_FROM_WILAYA = 16; // Alger

class YalidineFeesService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 heure pour les tarifs
    this.fallbackMode = false;
    
    console.log('💰 Yalidine Fees Service initialisé');
  }

  /**
   * Obtenir les tarifs entre deux wilayas
   */
  async getFees(fromWilayaId = DEFAULT_FROM_WILAYA, toWilayaId) {
    const cacheKey = `fees_${fromWilayaId}_${toWilayaId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    try {
      console.log(`💰 Récupération tarifs: ${fromWilayaId} → ${toWilayaId}`);
      
      const fees = await this.getFeesFromApi(fromWilayaId, toWilayaId);
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        data: fees,
        timestamp: Date.now()
      });

      return fees;
    } catch (error) {
      console.error('❌ Erreur récupération tarifs:', error);
      return this.getFallbackFees(toWilayaId);
    }
  }

  /**
   * Récupérer les tarifs depuis l'API
   */
  async getFeesFromApi(fromWilayaId, toWilayaId) {
    return makeRateLimitedRequest(async () => {
      const url = `${YALIDINE_API_CONFIG.baseUrl}/fees/?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-ID': YALIDINE_API_CONFIG.apiId,
          'X-API-TOKEN': YALIDINE_API_CONFIG.apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Fees Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Tarifs récupérés: ${Object.keys(data.per_commune || {}).length} communes`);
      
      return data;
    }, 'Yalidine-Fees');
  }

  /**
   * Tarifs de fallback si API indisponible
   */
  getFallbackFees(toWilayaId) {
    // Zones basiques pour fallback
    const zoneMap = {
      16: 1, 35: 1, 9: 1, 42: 1, // Zone 1: Alger, Boumerdes, Blida, Tipaza
      31: 2, 13: 2, 27: 2, 29: 2, // Zone 2: Oran, Tlemcen, Mostaganem, Mascara
      25: 2, 19: 2, 6: 2, 21: 2,  // Zone 2: Constantine, Setif, Bejaia, Skikda
      1: 4, 8: 4, 11: 4, 30: 4    // Zone 4: Adrar, Bechar, Tamanrasset, Ouargla
    };

    const zone = zoneMap[toWilayaId] || 3;
    const basePrices = {
      1: { home: 400, desk: 350 },
      2: { home: 500, desk: 400 },
      3: { home: 600, desk: 450 },
      4: { home: 700, desk: 500 }
    };

    return {
      from_wilaya_name: "Alger",
      to_wilaya_name: `Wilaya ${toWilayaId}`,
      zone: zone,
      retour_fee: 250,
      cod_percentage: 0.75,
      insurance_percentage: 0.75,
      oversize_fee: 100,
      per_commune: {
        [`${toWilayaId}01`]: {
          commune_id: parseInt(`${toWilayaId}01`),
          commune_name: "Centre-ville",
          express_home: basePrices[zone].home,
          express_desk: basePrices[zone].desk,
          economic_home: null,
          economic_desk: null
        }
      },
      dataSource: 'Fallback'
    };
  }

  /**
   * Calculer le prix pour une commune spécifique
   */
  async calculatePrice(communeId, deliveryType = 'home', weight = 0, dimensions = {}) {
    try {
      // Extraire wilaya_id depuis commune_id
      const wilayaId = Math.floor(communeId / 100);
      
      // Récupérer les tarifs
      const fees = await this.getFees(DEFAULT_FROM_WILAYA, wilayaId);
      
      if (!fees.per_commune || !fees.per_commune[communeId]) {
        console.warn(`❌ Commune ${communeId} non trouvée dans les tarifs`);
        return null;
      }

      const commune = fees.per_commune[communeId];
      
      // Prix de base selon le type de livraison
      let basePrice = 0;
      if (deliveryType === 'office' && commune.express_desk) {
        basePrice = commune.express_desk;
      } else if (deliveryType === 'home' && commune.express_home) {
        basePrice = commune.express_home;
      } else {
        console.warn(`❌ Type de livraison ${deliveryType} non disponible pour ${commune.commune_name}`);
        return null;
      }

      // Calculer le poids facturable
      const billableWeight = this.calculateBillableWeight(weight, dimensions);
      
      // Calculer les frais de surpoids selon la zone
      const zone = commune.zone || 3; // Zone par défaut
      const oversizeCharge = this.calculateOversizeCharge(billableWeight, zone);

      // Prix total
      const totalPrice = basePrice + oversizeCharge;

      return {
        commune: commune.commune_name,
        basePrice: basePrice,
        oversizeCharge: oversizeCharge,
        totalPrice: totalPrice,
        billableWeight: billableWeight,
        deliveryType: deliveryType,
        fees: {
          retourFee: fees.retour_fee,
          codPercentage: fees.cod_percentage,
          insurancePercentage: fees.insurance_percentage
        },
        dataSource: fees.dataSource || 'API'
      };
    } catch (error) {
      console.error('❌ Erreur calcul prix:', error);
      return null;
    }
  }

  /**
   * Calculer le poids facturable
   */
  calculateBillableWeight(actualWeight, dimensions = {}) {
    const { width = 0, height = 0, length = 0 } = dimensions;
    
    // Poids volumétrique = L × l × h × 0.0002
    const volumetricWeight = width * height * length * 0.0002;
    
    // Poids facturable = max(poids réel, poids volumétrique)
    const billableWeight = Math.max(actualWeight, volumetricWeight);
    
    console.log(`📏 Poids: réel=${actualWeight}kg, volumétrique=${volumetricWeight.toFixed(2)}kg, facturable=${billableWeight.toFixed(2)}kg`);
    
    return billableWeight;
  }

  /**
   * Calculer les frais de surpoids selon la zone
   */
  calculateOversizeCharge(billableWeight, zone = 3) {
    if (billableWeight <= 5) {
      return 0;
    }

    // Tarifs selon la zone:
    // Zones 0, 1, 2, 3: 50 DA par kg supplémentaire
    // Zones 4, 5: 100 DA par kg supplémentaire
    const extraWeight = billableWeight - 5;
    const ratePerKg = (zone === 4 || zone === 5) ? 100 : 50;
    const charge = Math.ceil(extraWeight) * ratePerKg;

    console.log(`⚖️ Surpoids: ${extraWeight.toFixed(2)}kg × ${ratePerKg}DA = ${charge}DA (Zone ${zone})`);

    return charge;
  }

  /**
   * Rechercher une commune par nom et obtenir son prix
   */
  async searchCommunePrice(communeName, wilayaName, deliveryType = 'home', weight = 0, dimensions = {}) {
    try {
      // D'abord, trouver la wilaya
      const wilayaId = await this.findWilayaIdByName(wilayaName);
      if (!wilayaId) {
        console.warn(`❌ Wilaya "${wilayaName}" non trouvée`);
        return null;
      }

      // Récupérer les tarifs pour cette wilaya
      const fees = await this.getFees(DEFAULT_FROM_WILAYA, wilayaId);
      
      // Chercher la commune par nom
      const communeEntry = Object.entries(fees.per_commune || {}).find(([id, commune]) => 
        commune.commune_name.toLowerCase().includes(communeName.toLowerCase())
      );

      if (!communeEntry) {
        console.warn(`❌ Commune "${communeName}" non trouvée dans ${wilayaName}`);
        return null;
      }

      const [communeId, commune] = communeEntry;
      
      // Calculer le prix
      return await this.calculatePrice(parseInt(communeId), deliveryType, weight, dimensions);
    } catch (error) {
      console.error('❌ Erreur recherche commune:', error);
      return null;
    }
  }

  /**
   * Trouver l'ID d'une wilaya par son nom
   */
  async findWilayaIdByName(wilayaName) {
    // Map simple des wilayas principales
    const wilayaMap = {
      'alger': 16, 'algiers': 16,
      'oran': 31,
      'constantine': 25,
      'setif': 19, 'sétif': 19,
      'annaba': 23,
      'blida': 9,
      'batna': 5,
      'djelfa': 17,
      'sidi bel abbes': 22,
      'biskra': 7,
      'tebessa': 12, 'tébessa': 12,
      'el oued': 39,
      'skikda': 21,
      'tiaret': 14,
      'bejaia': 6, 'béjaïa': 6,
      'tlemcen': 13,
      'ouargla': 30,
      'bouira': 10,
      'tizi ouzou': 15,
      'medea': 26, 'médéa': 26,
      'el eulma': 19,
      'bordj bou arreridj': 34,
      'chlef': 2,
      'souk ahras': 41,
      'mostaganem': 27,
      'mascara': 29,
      'guelma': 24,
      'laghouat': 3,
      'oum el bouaghi': 4,
      'mila': 43,
      'ain defla': 44, 'aïn defla': 44,
      'naama': 45, 'naâma': 45,
      'ain temouchent': 46, 'aïn témouchent': 46,
      'ghardaia': 47, 'ghardaïa': 47,
      'relizane': 48,
      'adrar': 1,
      'bechar': 8, 'béchar': 8,
      'tamanrasset': 11,
      'el bayadh': 32,
      'illizi': 33,
      'boumerdes': 35, 'boumerdès': 35,
      'el tarf': 36,
      'tindouf': 37,
      'tissemsilt': 38,
      'khenchela': 40,
      'tipaza': 42
    };

    const normalizedName = wilayaName.toLowerCase().trim();
    return wilayaMap[normalizedName] || null;
  }

  /**
   * Vider le cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache tarifs vidé');
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance singleton
const yalidineFeesService = new YalidineFeesService();

export default yalidineFeesService;
