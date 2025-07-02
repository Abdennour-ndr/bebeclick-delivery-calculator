/**
 * Service MongoDB pour la gestion des prix de livraison
 * Remplace progressivement Google Sheets comme source principale
 */

import { DeliveryPricing } from '../models/index.js';
import { connectToDatabase } from '../config/database.js';

class MongoDeliveryPricingService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.isInitialized = false;
    
    console.log('💾 MongoDB Delivery Pricing Service initialisé');
  }

  /**
   * Initialiser la connexion à la base de données
   */
  async initialize() {
    try {
      if (!this.isInitialized) {
        await connectToDatabase();
        this.isInitialized = true;
        console.log('✅ MongoDB Delivery Pricing Service prêt');
      }
    } catch (error) {
      console.error('❌ Erreur d\'initialisation MongoDB Delivery Pricing:', error);
      throw error;
    }
  }

  /**
   * Obtenir les prix de livraison pour une destination
   */
  async getDeliveryPrice(destination, deliveryType = 'home', weight = 0, dimensions = {}, declaredValue = 0) {
    try {
      await this.initialize();
      
      console.log(`💰 Recherche prix MongoDB pour: "${destination}" (${deliveryType})`);
      
      // Parser la destination
      const locationInfo = this.parseDestination(destination);
      if (!locationInfo) {
        console.log('⚠️ Impossible de parser la destination');
        return null;
      }

      // Rechercher dans le cache d'abord
      const cacheKey = `${locationInfo.service}-${locationInfo.wilayaCode}-${locationInfo.commune}-${deliveryType}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        console.log('📋 Prix trouvé dans le cache');
        return this.calculateFinalPrice(cachedResult, weight, declaredValue, deliveryType);
      }

      // Rechercher dans MongoDB
      const pricing = await DeliveryPricing.findByLocation(
        locationInfo.service,
        locationInfo.wilayaCode,
        locationInfo.commune
      );

      if (!pricing) {
        console.log('❌ Prix non trouvé dans MongoDB');
        return null;
      }

      // Mettre en cache
      this.setCache(cacheKey, pricing);

      // Calculer le prix final
      const result = this.calculateFinalPrice(pricing, weight, declaredValue, deliveryType);
      
      console.log(`✅ Prix MongoDB trouvé: ${result.price} DA`);
      return result;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des prix:', error);
      return null;
    }
  }

  /**
   * Sauvegarder ou mettre à jour un prix de livraison
   */
  async savePricing(pricingData) {
    try {
      await this.initialize();
      
      console.log(`💾 Sauvegarde prix pour ${pricingData.service} - ${pricingData.commune}`);
      
      const result = await DeliveryPricing.upsertPricing(pricingData);
      
      // Invalider le cache
      this.clearCache();
      
      console.log('✅ Prix sauvegardé avec succès');
      return result;

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les prix pour un service
   */
  async getServicePricing(service) {
    try {
      await this.initialize();
      
      console.log(`📋 Récupération des prix pour ${service}`);
      
      const pricing = await DeliveryPricing.getServicePricing(service);
      
      console.log(`✅ ${pricing.length} prix trouvés pour ${service}`);
      return pricing;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des prix du service:', error);
      return [];
    }
  }

  /**
   * Mettre à jour les prix en lot
   */
  async bulkUpdatePricing(pricingArray) {
    try {
      await this.initialize();
      
      console.log(`📦 Mise à jour en lot de ${pricingArray.length} prix`);
      
      const results = [];
      for (const pricingData of pricingArray) {
        try {
          const result = await DeliveryPricing.upsertPricing(pricingData);
          results.push({ success: true, data: result });
        } catch (error) {
          results.push({ success: false, error: error.message, data: pricingData });
        }
      }
      
      // Invalider le cache
      this.clearCache();
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ ${successCount}/${pricingArray.length} prix mis à jour avec succès`);
      
      return results;

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour en lot:', error);
      throw error;
    }
  }

  /**
   * Supprimer un prix
   */
  async deletePricing(service, wilayaCode, commune) {
    try {
      await this.initialize();
      
      console.log(`🗑️ Suppression prix pour ${service} - ${commune}`);
      
      const result = await DeliveryPricing.findOneAndDelete({
        service,
        'wilaya.code': wilayaCode,
        commune: new RegExp(commune, 'i')
      });
      
      if (result) {
        // Invalider le cache
        this.clearCache();
        console.log('✅ Prix supprimé avec succès');
        return true;
      } else {
        console.log('⚠️ Prix non trouvé pour suppression');
        return false;
      }

    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Rechercher des prix par critères
   */
  async searchPricing(criteria) {
    try {
      await this.initialize();
      
      const query = {};
      
      if (criteria.service) query.service = criteria.service;
      if (criteria.wilayaCode) query['wilaya.code'] = criteria.wilayaCode;
      if (criteria.commune) query.commune = new RegExp(criteria.commune, 'i');
      if (criteria.zone) query.zone = criteria.zone;
      if (criteria.status) query.status = criteria.status;
      
      const results = await DeliveryPricing.find(query)
        .sort({ 'wilaya.code': 1, commune: 1 })
        .limit(criteria.limit || 100);
      
      console.log(`🔍 ${results.length} prix trouvés pour les critères`);
      return results;

    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      return [];
    }
  }

  /**
   * Parser la destination pour extraire les informations
   */
  parseDestination(destination) {
    // Format attendu: "Commune, Wilaya" ou "Service:Commune, Wilaya"
    const parts = destination.split(',').map(s => s.trim());
    
    if (parts.length < 2) return null;
    
    let service = 'yalidine'; // Service par défaut
    let commune = parts[0];
    const wilayaName = parts[1];
    
    // Vérifier si un service est spécifié
    if (commune.includes(':')) {
      const serviceParts = commune.split(':');
      service = serviceParts[0].toLowerCase();
      commune = serviceParts[1].trim();
    }
    
    // Mapper le nom de wilaya vers le code (simplifié)
    const wilayaCode = this.getWilayaCode(wilayaName);
    
    return {
      service,
      commune,
      wilayaName,
      wilayaCode
    };
  }

  /**
   * Obtenir le code de wilaya à partir du nom (mapping simplifié)
   */
  getWilayaCode(wilayaName) {
    const wilayaMapping = {
      'Alger': 16, 'Oran': 31, 'Constantine': 25, 'Annaba': 23,
      'Blida': 9, 'Batna': 5, 'Djelfa': 17, 'Sétif': 19,
      'Sidi Bel Abbès': 22, 'Biskra': 7, 'Tébessa': 12, 'El Oued': 39,
      'Skikda': 21, 'Tiaret': 14, 'Béjaïa': 6, 'Tlemcen': 13,
      'Ouargla': 30, 'Bouira': 10, 'Tizi Ouzou': 15, 'Médéa': 26
    };
    
    return wilayaMapping[wilayaName] || 16; // Alger par défaut
  }

  /**
   * Calculer le prix final avec tous les suppléments
   */
  calculateFinalPrice(pricing, weight, declaredValue, deliveryType) {
    const totalPrice = pricing.calculateTotalPrice(deliveryType, weight, declaredValue);
    
    return {
      price: totalPrice,
      basePrice: pricing.pricing[deliveryType] || pricing.pricing.home,
      supplements: {
        overweight: weight > pricing.pricing.supplements.overweightThreshold ? 
          (weight - pricing.pricing.supplements.overweightThreshold) * pricing.pricing.supplements.overweightFee : 0,
        cod: declaredValue > 0 ? 
          (declaredValue * pricing.pricing.supplements.codFeePercentage / 100) + pricing.pricing.supplements.codFeeFixed : 0
      },
      service: pricing.service,
      location: `${pricing.commune}, ${pricing.wilaya.name}`,
      deliveryType,
      dataSource: 'mongodb'
    };
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
    console.log('🧹 Cache des prix vidé');
  }

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    try {
      await this.initialize();
      
      const stats = await DeliveryPricing.aggregate([
        {
          $group: {
            _id: '$service',
            count: { $sum: 1 },
            avgHomePrice: { $avg: '$pricing.home' },
            avgOfficePrice: { $avg: '$pricing.office' }
          }
        }
      ]);
      
      return stats;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      return [];
    }
  }
}

// Instance singleton
const mongoDeliveryPricingService = new MongoDeliveryPricingService();

export default mongoDeliveryPricingService;
