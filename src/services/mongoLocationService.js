/**
 * Service MongoDB pour la gestion des locations (Wilayas et Communes)
 * Gère la hiérarchie géographique et les zones de tarification
 */

import { Location } from '../models/index.js';
import { connectToDatabase } from '../config/database.js';

class MongoLocationService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes pour les locations
    this.isInitialized = false;
    
    console.log('🗺️ MongoDB Location Service initialisé');
  }

  /**
   * Initialiser la connexion à la base de données
   */
  async initialize() {
    try {
      if (!this.isInitialized) {
        await connectToDatabase();
        this.isInitialized = true;
        console.log('✅ MongoDB Location Service prêt');
      }
    } catch (error) {
      console.error('❌ Erreur d\'initialisation MongoDB Location:', error);
      throw error;
    }
  }

  /**
   * Obtenir toutes les wilayas
   */
  async getWilayas() {
    try {
      await this.initialize();
      
      // Vérifier le cache
      const cacheKey = 'wilayas:all';
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        console.log('📋 Wilayas trouvées dans le cache');
        return cachedResult;
      }

      console.log('🗺️ Récupération des wilayas depuis MongoDB');
      
      const wilayas = await Location.getWilayas();
      
      // Mettre en cache
      this.setCache(cacheKey, wilayas);
      
      console.log(`✅ ${wilayas.length} wilayas récupérées`);
      return wilayas;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des wilayas:', error);
      return [];
    }
  }

  /**
   * Obtenir les communes d'une wilaya
   */
  async getCommunesByWilaya(wilayaCode) {
    try {
      await this.initialize();
      
      // Vérifier le cache
      const cacheKey = `communes:wilaya:${wilayaCode}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        console.log(`📋 Communes de la wilaya ${wilayaCode} trouvées dans le cache`);
        return cachedResult;
      }

      console.log(`🏘️ Récupération des communes pour la wilaya ${wilayaCode}`);
      
      const communes = await Location.getCommunesByWilaya(wilayaCode);
      
      // Mettre en cache
      this.setCache(cacheKey, communes);
      
      console.log(`✅ ${communes.length} communes récupérées pour la wilaya ${wilayaCode}`);
      return communes;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des communes:', error);
      return [];
    }
  }

  /**
   * Rechercher des locations par nom
   */
  async searchLocations(searchTerm, type = null) {
    try {
      await this.initialize();
      
      console.log(`🔍 Recherche locations: "${searchTerm}" (type: ${type || 'tous'})`);
      
      const locations = await Location.searchByName(searchTerm, type);
      
      console.log(`✅ ${locations.length} locations trouvées`);
      return locations;

    } catch (error) {
      console.error('❌ Erreur lors de la recherche de locations:', error);
      return [];
    }
  }

  /**
   * Obtenir une location par code
   */
  async getLocationByCode(type, code) {
    try {
      await this.initialize();
      
      console.log(`📍 Recherche location: ${type} code ${code}`);
      
      const location = await Location.findOne({
        type,
        code,
        status: 'active'
      });
      
      if (location) {
        console.log(`✅ Location trouvée: ${location.name}`);
      } else {
        console.log('❌ Location non trouvée');
      }
      
      return location;

    } catch (error) {
      console.error('❌ Erreur lors de la recherche par code:', error);
      return null;
    }
  }

  /**
   * Sauvegarder ou mettre à jour une location
   */
  async saveLocation(locationData) {
    try {
      await this.initialize();
      
      console.log(`💾 Sauvegarde location: ${locationData.name} (${locationData.type})`);
      
      // Valider les données requises
      if (!locationData.type || !locationData.code || !locationData.name) {
        throw new Error('Type, code et nom de la location sont requis');
      }
      
      const result = await Location.upsertLocation(locationData);
      
      // Invalider le cache
      this.clearCache();
      
      console.log('✅ Location sauvegardée avec succès');
      return result;

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la location:', error);
      throw error;
    }
  }

  /**
   * Ajouter une nouvelle commune à une wilaya
   */
  async addCommune(wilayaCode, communeData) {
    try {
      await this.initialize();
      
      console.log(`🏘️ Ajout commune: ${communeData.name} à la wilaya ${wilayaCode}`);
      
      // Récupérer la wilaya parente
      const wilaya = await this.getLocationByCode('wilaya', wilayaCode);
      if (!wilaya) {
        throw new Error(`Wilaya ${wilayaCode} non trouvée`);
      }
      
      // Générer un code unique pour la commune
      const existingCommunes = await this.getCommunesByWilaya(wilayaCode);
      const maxCode = Math.max(...existingCommunes.map(c => c.code), wilayaCode * 1000);
      const newCode = maxCode + 1;
      
      // Préparer les données de la commune
      const locationData = {
        type: 'commune',
        code: newCode,
        name: communeData.name,
        nameAr: communeData.nameAr,
        hierarchy: {
          wilayaCode: wilayaCode,
          wilayaName: wilaya.name
        },
        geography: {
          region: wilaya.geography?.region || 'centre',
          coordinates: communeData.coordinates
        },
        deliveryConfig: {
          pricingZone: communeData.pricingZone || wilaya.deliveryConfig?.pricingZone || 1,
          availableServices: communeData.availableServices || [
            { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true },
            { service: 'zaki', available: true, homeDelivery: true, officeDelivery: true },
            { service: 'jamal-delivery', available: true, homeDelivery: true, officeDelivery: true }
          ],
          averageDeliveryTime: communeData.averageDeliveryTime || 3
        },
        metadata: {
          dataSource: 'manual',
          updatedBy: communeData.updatedBy || 'system'
        }
      };
      
      const result = await this.saveLocation(locationData);
      
      console.log(`✅ Commune ${communeData.name} ajoutée avec le code ${newCode}`);
      return result;

    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la commune:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la zone de tarification d'une location
   */
  async updatePricingZone(type, code, newZone) {
    try {
      await this.initialize();
      
      console.log(`💰 Mise à jour zone tarification: ${type} ${code} -> zone ${newZone}`);
      
      const location = await this.getLocationByCode(type, code);
      if (!location) {
        throw new Error(`Location ${type} ${code} non trouvée`);
      }
      
      location.deliveryConfig.pricingZone = newZone;
      location.updateMetadata('system', `Zone de tarification mise à jour: ${newZone}`);
      
      await location.save();
      
      // Invalider le cache
      this.clearCache();
      
      console.log('✅ Zone de tarification mise à jour');
      return location;

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la zone:', error);
      throw error;
    }
  }

  /**
   * Obtenir les locations par zone de tarification
   */
  async getLocationsByPricingZone(zone) {
    try {
      await this.initialize();
      
      console.log(`💰 Récupération locations zone ${zone}`);
      
      const locations = await Location.getByPricingZone(zone);
      
      console.log(`✅ ${locations.length} locations trouvées pour la zone ${zone}`);
      return locations;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération par zone:', error);
      return [];
    }
  }

  /**
   * Importer des locations en lot
   */
  async bulkImportLocations(locationsArray, source = 'import') {
    try {
      await this.initialize();
      
      console.log(`🗺️ Import en lot de ${locationsArray.length} locations`);
      
      const results = [];
      for (const locationData of locationsArray) {
        try {
          // Ajouter la source des données
          locationData.metadata = locationData.metadata || {};
          locationData.metadata.dataSource = source;
          
          const result = await Location.upsertLocation(locationData);
          results.push({ success: true, data: result });
        } catch (error) {
          results.push({ success: false, error: error.message, data: locationData });
        }
      }
      
      // Invalider le cache
      this.clearCache();
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ ${successCount}/${locationsArray.length} locations importées avec succès`);
      
      return results;

    } catch (error) {
      console.error('❌ Erreur lors de l\'import en lot:', error);
      throw error;
    }
  }

  /**
   * Initialiser les données de base (wilayas d'Algérie)
   */
  async initializeAlgerianWilayas() {
    try {
      await this.initialize();
      
      console.log('🇩🇿 Initialisation des wilayas d\'Algérie');
      
      const algerianWilayas = [
        { code: 1, name: 'Adrar', nameAr: 'أدرار', region: 'sud' },
        { code: 2, name: 'Chlef', nameAr: 'الشلف', region: 'nord' },
        { code: 3, name: 'Laghouat', nameAr: 'الأغواط', region: 'centre' },
        { code: 4, name: 'Oum El Bouaghi', nameAr: 'أم البواقي', region: 'est' },
        { code: 5, name: 'Batna', nameAr: 'باتنة', region: 'est' },
        { code: 6, name: 'Béjaïa', nameAr: 'بجاية', region: 'nord' },
        { code: 7, name: 'Biskra', nameAr: 'بسكرة', region: 'centre' },
        { code: 8, name: 'Béchar', nameAr: 'بشار', region: 'sud' },
        { code: 9, name: 'Blida', nameAr: 'البليدة', region: 'centre' },
        { code: 10, name: 'Bouira', nameAr: 'البويرة', region: 'centre' },
        { code: 11, name: 'Tamanrasset', nameAr: 'تمنراست', region: 'sud' },
        { code: 12, name: 'Tébessa', nameAr: 'تبسة', region: 'est' },
        { code: 13, name: 'Tlemcen', nameAr: 'تلمسان', region: 'ouest' },
        { code: 14, name: 'Tiaret', nameAr: 'تيارت', region: 'ouest' },
        { code: 15, name: 'Tizi Ouzou', nameAr: 'تيزي وزو', region: 'nord' },
        { code: 16, name: 'Alger', nameAr: 'الجزائر', region: 'centre' },
        { code: 17, name: 'Djelfa', nameAr: 'الجلفة', region: 'centre' },
        { code: 18, name: 'Jijel', nameAr: 'جيجل', region: 'nord' },
        { code: 19, name: 'Sétif', nameAr: 'سطيف', region: 'est' },
        { code: 20, name: 'Saïda', nameAr: 'سعيدة', region: 'ouest' },
        { code: 21, name: 'Skikda', nameAr: 'سكيكدة', region: 'nord' },
        { code: 22, name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', region: 'ouest' },
        { code: 23, name: 'Annaba', nameAr: 'عنابة', region: 'est' },
        { code: 24, name: 'Guelma', nameAr: 'قالمة', region: 'est' },
        { code: 25, name: 'Constantine', nameAr: 'قسنطينة', region: 'est' },
        { code: 26, name: 'Médéa', nameAr: 'المدية', region: 'centre' },
        { code: 27, name: 'Mostaganem', nameAr: 'مستغانم', region: 'ouest' },
        { code: 28, name: 'M\'Sila', nameAr: 'المسيلة', region: 'centre' },
        { code: 29, name: 'Mascara', nameAr: 'معسكر', region: 'ouest' },
        { code: 30, name: 'Ouargla', nameAr: 'ورقلة', region: 'sud' },
        { code: 31, name: 'Oran', nameAr: 'وهران', region: 'ouest' },
        { code: 32, name: 'El Bayadh', nameAr: 'البيض', region: 'ouest' },
        { code: 33, name: 'Illizi', nameAr: 'إليزي', region: 'sud' },
        { code: 34, name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج', region: 'est' },
        { code: 35, name: 'Boumerdès', nameAr: 'بومرداس', region: 'nord' },
        { code: 36, name: 'El Tarf', nameAr: 'الطارف', region: 'est' },
        { code: 37, name: 'Tindouf', nameAr: 'تندوف', region: 'sud' },
        { code: 38, name: 'Tissemsilt', nameAr: 'تيسمسيلت', region: 'ouest' },
        { code: 39, name: 'El Oued', nameAr: 'الوادي', region: 'sud' },
        { code: 40, name: 'Khenchela', nameAr: 'خنشلة', region: 'est' },
        { code: 41, name: 'Souk Ahras', nameAr: 'سوق أهراس', region: 'est' },
        { code: 42, name: 'Tipaza', nameAr: 'تيبازة', region: 'nord' },
        { code: 43, name: 'Mila', nameAr: 'ميلة', region: 'est' },
        { code: 44, name: 'Aïn Defla', nameAr: 'عين الدفلى', region: 'centre' },
        { code: 45, name: 'Naâma', nameAr: 'النعامة', region: 'ouest' },
        { code: 46, name: 'Aïn Témouchent', nameAr: 'عين تموشنت', region: 'ouest' },
        { code: 47, name: 'Ghardaïa', nameAr: 'غرداية', region: 'sud' },
        { code: 48, name: 'Relizane', nameAr: 'غليزان', region: 'ouest' },
        { code: 49, name: 'Timimoun', nameAr: 'تيميمون', region: 'sud' },
        { code: 50, name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', region: 'sud' },
        { code: 51, name: 'Ouled Djellal', nameAr: 'أولاد جلال', region: 'centre' },
        { code: 52, name: 'Béni Abbès', nameAr: 'بني عباس', region: 'sud' },
        { code: 53, name: 'In Salah', nameAr: 'عين صالح', region: 'sud' },
        { code: 54, name: 'In Guezzam', nameAr: 'عين قزام', region: 'sud' },
        { code: 55, name: 'Touggourt', nameAr: 'تقرت', region: 'sud' },
        { code: 56, name: 'Djanet', nameAr: 'جانت', region: 'sud' },
        { code: 57, name: 'El M\'Ghair', nameAr: 'المغير', region: 'sud' },
        { code: 58, name: 'El Meniaa', nameAr: 'المنيعة', region: 'sud' }
      ];
      
      const wilayasData = algerianWilayas.map(w => ({
        type: 'wilaya',
        code: w.code,
        name: w.name,
        nameAr: w.nameAr,
        geography: {
          region: w.region
        },
        deliveryConfig: {
          pricingZone: this.getDefaultPricingZone(w.region),
          availableServices: [
            { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true },
            { service: 'zaki', available: w.region === 'centre', homeDelivery: true, officeDelivery: true },
            { service: 'jamal-delivery', available: w.region === 'centre', homeDelivery: true, officeDelivery: true }
          ]
        },
        metadata: {
          dataSource: 'official'
        }
      }));
      
      const results = await this.bulkImportLocations(wilayasData, 'official');
      
      console.log('✅ Wilayas d\'Algérie initialisées');
      return results;

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des wilayas:', error);
      throw error;
    }
  }

  /**
   * Obtenir la zone de tarification par défaut selon la région
   */
  getDefaultPricingZone(region) {
    const zoneMapping = {
      'centre': 1, // Zone 1 - Alger et environs
      'nord': 2,   // Zone 2 - Nord du pays
      'est': 3,    // Zone 3 - Est du pays
      'ouest': 3,  // Zone 3 - Ouest du pays
      'sud': 4     // Zone 4 - Sud du pays
    };
    
    return zoneMapping[region] || 1;
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
    console.log('🧹 Cache des locations vidé');
  }

  /**
   * Obtenir les statistiques des locations
   */
  async getStats() {
    try {
      await this.initialize();
      
      const stats = await Location.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            avgPricingZone: { $avg: '$deliveryConfig.pricingZone' }
          }
        }
      ]);
      
      const regionStats = await Location.aggregate([
        { $match: { type: 'wilaya' } },
        {
          $group: {
            _id: '$geography.region',
            count: { $sum: 1 }
          }
        }
      ]);
      
      return {
        general: stats,
        regions: regionStats
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      return { general: [], regions: [] };
    }
  }
}

// Instance singleton
const mongoLocationService = new MongoLocationService();

export default mongoLocationService;
