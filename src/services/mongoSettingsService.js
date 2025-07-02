/**
 * Service MongoDB pour la gestion des paramètres système
 * Centralise la configuration de l'application
 */

import { Settings } from '../models/index.js';
import { connectToDatabase } from '../config/database.js';

class MongoSettingsService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes pour les paramètres
    this.isInitialized = false;
    
    console.log('⚙️ MongoDB Settings Service initialisé');
  }

  /**
   * Initialiser la connexion à la base de données
   */
  async initialize() {
    try {
      if (!this.isInitialized) {
        await connectToDatabase();
        await Settings.initializeDefaultSettings();
        this.isInitialized = true;
        console.log('✅ MongoDB Settings Service prêt');
      }
    } catch (error) {
      console.error('❌ Erreur d\'initialisation MongoDB Settings:', error);
      throw error;
    }
  }

  /**
   * Obtenir un paramètre par clé
   */
  async getSetting(key, defaultValue = null, environment = 'all') {
    try {
      await this.initialize();
      
      // Vérifier le cache d'abord
      const cacheKey = `setting:${key}:${environment}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      console.log(`⚙️ Récupération paramètre: ${key}`);
      
      const value = await Settings.getValue(key, defaultValue, environment);
      
      // Mettre en cache
      this.setCache(cacheKey, value);
      
      return value;

    } catch (error) {
      console.error(`❌ Erreur lors de la récupération du paramètre ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Définir un paramètre
   */
  async setSetting(key, value, updatedBy = 'system', environment = 'all') {
    try {
      await this.initialize();
      
      console.log(`💾 Mise à jour paramètre: ${key}`);
      
      const result = await Settings.setSetting(key, value, updatedBy, environment);
      
      // Invalider le cache
      this.clearCacheForKey(key);
      
      console.log('✅ Paramètre mis à jour avec succès');
      return result;

    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour du paramètre ${key}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir tous les paramètres d'une catégorie
   */
  async getSettingsByCategory(category, environment = 'all') {
    try {
      await this.initialize();
      
      // Vérifier le cache
      const cacheKey = `category:${category}:${environment}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      console.log(`📂 Récupération paramètres catégorie: ${category}`);
      
      const settings = await Settings.getByCategory(category, environment);
      
      // Convertir en objet clé-valeur
      const settingsObject = {};
      settings.forEach(setting => {
        settingsObject[setting.key] = setting.getValue();
      });
      
      // Mettre en cache
      this.setCache(cacheKey, settingsObject);
      
      console.log(`✅ ${settings.length} paramètres récupérés pour ${category}`);
      return settingsObject;

    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de la catégorie ${category}:`, error);
      return {};
    }
  }

  /**
   * Obtenir les clés API
   */
  async getApiKeys() {
    return this.getSettingsByCategory('api-keys');
  }

  /**
   * Obtenir la configuration des services de livraison
   */
  async getDeliveryServicesConfig() {
    return this.getSettingsByCategory('delivery-services');
  }

  /**
   * Obtenir les paramètres de tarification
   */
  async getPricingConfig() {
    return this.getSettingsByCategory('pricing');
  }

  /**
   * Obtenir les paramètres d'interface utilisateur
   */
  async getUISettings() {
    return this.getSettingsByCategory('ui-settings');
  }

  /**
   * Mettre à jour plusieurs paramètres en une fois
   */
  async updateMultipleSettings(settingsObject, updatedBy = 'system') {
    try {
      await this.initialize();
      
      console.log(`📦 Mise à jour de ${Object.keys(settingsObject).length} paramètres`);
      
      const results = [];
      for (const [key, value] of Object.entries(settingsObject)) {
        try {
          const result = await this.setSetting(key, value, updatedBy);
          results.push({ key, success: true, result });
        } catch (error) {
          results.push({ key, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ ${successCount}/${results.length} paramètres mis à jour`);
      
      return results;

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour multiple:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau paramètre
   */
  async createSetting(settingData) {
    try {
      await this.initialize();
      
      console.log(`➕ Création paramètre: ${settingData.key}`);
      
      const result = await Settings.upsertSetting(settingData);
      
      // Invalider le cache
      this.clearCache();
      
      console.log('✅ Paramètre créé avec succès');
      return result;

    } catch (error) {
      console.error('❌ Erreur lors de la création du paramètre:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les paramètres avec leurs métadonnées
   */
  async getAllSettingsWithMetadata(environment = 'all') {
    try {
      await this.initialize();
      
      console.log('📋 Récupération de tous les paramètres avec métadonnées');
      
      const query = {};
      if (environment !== 'all') {
        query['metadata.environment'] = { $in: [environment, 'all'] };
      }
      
      const settings = await Settings.find(query).sort({ category: 1, key: 1 });
      
      // Grouper par catégorie
      const groupedSettings = {};
      settings.forEach(setting => {
        if (!groupedSettings[setting.category]) {
          groupedSettings[setting.category] = [];
        }
        
        groupedSettings[setting.category].push({
          key: setting.key,
          value: setting.sensitive ? '***' : setting.getValue(),
          dataType: setting.dataType,
          description: setting.description,
          sensitive: setting.sensitive,
          userEditable: setting.userEditable,
          lastUpdated: setting.metadata.lastUpdated,
          updatedBy: setting.metadata.updatedBy
        });
      });
      
      console.log(`✅ ${settings.length} paramètres récupérés`);
      return groupedSettings;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération complète:', error);
      return {};
    }
  }

  /**
   * Réinitialiser un paramètre à sa valeur par défaut
   */
  async resetSettingToDefault(key, updatedBy = 'system') {
    try {
      await this.initialize();
      
      console.log(`🔄 Réinitialisation paramètre: ${key}`);
      
      const setting = await Settings.getSetting(key);
      if (!setting) {
        throw new Error(`Paramètre ${key} non trouvé`);
      }
      
      setting.resetToDefault(updatedBy);
      await setting.save();
      
      // Invalider le cache
      this.clearCacheForKey(key);
      
      console.log('✅ Paramètre réinitialisé');
      return setting;

    } catch (error) {
      console.error(`❌ Erreur lors de la réinitialisation de ${key}:`, error);
      throw error;
    }
  }

  /**
   * Valider la configuration actuelle
   */
  async validateConfiguration() {
    try {
      await this.initialize();
      
      console.log('🔍 Validation de la configuration');
      
      const issues = [];
      
      // Vérifier les clés API requises
      const apiKeys = await this.getApiKeys();
      const requiredApiKeys = [
        'google.sheets.api.key',
        'google.maps.api.key',
        'yalidine.api.id',
        'yalidine.api.token'
      ];
      
      for (const key of requiredApiKeys) {
        const value = apiKeys[key];
        if (!value || value.length < 10) {
          issues.push({
            type: 'missing_api_key',
            key,
            message: `Clé API ${key} manquante ou invalide`
          });
        }
      }
      
      // Vérifier les paramètres de tarification
      const pricingConfig = await this.getPricingConfig();
      if (pricingConfig['pricing.cod.percentage'] > 10) {
        issues.push({
          type: 'invalid_pricing',
          key: 'pricing.cod.percentage',
          message: 'Pourcentage de remboursement trop élevé (>10%)'
        });
      }
      
      console.log(`✅ Validation terminée: ${issues.length} problèmes détectés`);
      return {
        valid: issues.length === 0,
        issues
      };

    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      return {
        valid: false,
        issues: [{ type: 'validation_error', message: error.message }]
      };
    }
  }

  /**
   * Exporter la configuration
   */
  async exportConfiguration(includeSecrets = false) {
    try {
      await this.initialize();
      
      console.log('📤 Export de la configuration');
      
      const settings = await Settings.find({}).sort({ category: 1, key: 1 });
      
      const exportData = {
        exportDate: new Date().toISOString(),
        includeSecrets,
        settings: {}
      };
      
      settings.forEach(setting => {
        if (setting.sensitive && !includeSecrets) {
          return; // Ignorer les paramètres sensibles
        }
        
        exportData.settings[setting.key] = {
          value: setting.getValue(),
          dataType: setting.dataType,
          category: setting.category,
          description: setting.description
        };
      });
      
      console.log(`✅ ${Object.keys(exportData.settings).length} paramètres exportés`);
      return exportData;

    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      throw error;
    }
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
    console.log('🧹 Cache des paramètres vidé');
  }

  clearCacheForKey(key) {
    // Supprimer toutes les entrées de cache contenant cette clé
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.includes(key)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  /**
   * Obtenir les statistiques des paramètres
   */
  async getStats() {
    try {
      await this.initialize();
      
      const stats = await Settings.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            sensitiveCount: {
              $sum: { $cond: ['$sensitive', 1, 0] }
            },
            userEditableCount: {
              $sum: { $cond: ['$userEditable', 1, 0] }
            }
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
const mongoSettingsService = new MongoSettingsService();

export default mongoSettingsService;
