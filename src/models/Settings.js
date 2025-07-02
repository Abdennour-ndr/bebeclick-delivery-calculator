/**
 * Modèle MongoDB pour les paramètres système
 * Gère la configuration globale de l'application
 */

import mongoose from 'mongoose';

// Schéma pour les paramètres
const settingsSchema = new mongoose.Schema({
  // Clé unique du paramètre
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },

  // Valeur du paramètre
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Type de données
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },

  // Catégorie du paramètre
  category: {
    type: String,
    required: true,
    enum: [
      'api-keys',
      'delivery-services',
      'pricing',
      'ui-settings',
      'notifications',
      'system',
      'integrations',
      'security'
    ],
    index: true
  },

  // Description du paramètre
  description: {
    type: String,
    trim: true
  },

  // Paramètre sensible (mot de passe, clé API, etc.)
  sensitive: {
    type: Boolean,
    default: false
  },

  // Paramètre modifiable par l'utilisateur
  userEditable: {
    type: Boolean,
    default: true
  },

  // Valeur par défaut
  defaultValue: {
    type: mongoose.Schema.Types.Mixed
  },

  // Validation
  validation: {
    // Valeur requise
    required: {
      type: Boolean,
      default: false
    },
    
    // Valeurs autorisées (pour enum)
    allowedValues: [mongoose.Schema.Types.Mixed],
    
    // Valeur minimale (pour numbers)
    minValue: Number,
    
    // Valeur maximale (pour numbers)
    maxValue: Number,
    
    // Pattern regex (pour strings)
    pattern: String,
    
    // Longueur minimale (pour strings)
    minLength: Number,
    
    // Longueur maximale (pour strings)
    maxLength: Number
  },

  // Métadonnées
  metadata: {
    // Dernière mise à jour
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    
    // Utilisateur qui a fait la mise à jour
    updatedBy: {
      type: String,
      default: 'system'
    },
    
    // Version du paramètre
    version: {
      type: Number,
      default: 1
    },
    
    // Notes
    notes: String,
    
    // Environnement (dev, prod, etc.)
    environment: {
      type: String,
      enum: ['development', 'production', 'staging', 'all'],
      default: 'all'
    }
  }

}, {
  timestamps: true,
  collection: 'settings'
});

// Index pour les recherches par catégorie
settingsSchema.index({ 
  category: 1,
  'metadata.environment': 1
});

// Méthodes du schéma
settingsSchema.methods = {
  /**
   * Obtenir la valeur avec validation
   */
  getValue() {
    return this.value;
  },

  /**
   * Définir une nouvelle valeur avec validation
   */
  setValue(newValue, updatedBy = 'system') {
    // Validation du type
    if (!this.validateType(newValue)) {
      throw new Error(`Invalid data type for setting ${this.key}. Expected ${this.dataType}`);
    }

    // Validation des contraintes
    if (!this.validateConstraints(newValue)) {
      throw new Error(`Value validation failed for setting ${this.key}`);
    }

    this.value = newValue;
    this.metadata.lastUpdated = new Date();
    this.metadata.updatedBy = updatedBy;
    this.metadata.version += 1;

    return this;
  },

  /**
   * Valider le type de données
   */
  validateType(value) {
    switch (this.dataType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  },

  /**
   * Valider les contraintes
   */
  validateConstraints(value) {
    const { validation } = this;
    
    if (!validation) return true;

    // Valeur requise
    if (validation.required && (value === null || value === undefined || value === '')) {
      return false;
    }

    // Valeurs autorisées
    if (validation.allowedValues && validation.allowedValues.length > 0) {
      if (!validation.allowedValues.includes(value)) {
        return false;
      }
    }

    // Contraintes pour les nombres
    if (this.dataType === 'number') {
      if (validation.minValue !== undefined && value < validation.minValue) {
        return false;
      }
      if (validation.maxValue !== undefined && value > validation.maxValue) {
        return false;
      }
    }

    // Contraintes pour les chaînes
    if (this.dataType === 'string') {
      if (validation.minLength !== undefined && value.length < validation.minLength) {
        return false;
      }
      if (validation.maxLength !== undefined && value.length > validation.maxLength) {
        return false;
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        return false;
      }
    }

    return true;
  },

  /**
   * Réinitialiser à la valeur par défaut
   */
  resetToDefault(updatedBy = 'system') {
    if (this.defaultValue !== undefined) {
      this.setValue(this.defaultValue, updatedBy);
    }
    return this;
  }
};

// Méthodes statiques
settingsSchema.statics = {
  /**
   * Obtenir un paramètre par clé
   */
  async getSetting(key, environment = 'all') {
    const query = { key };
    if (environment !== 'all') {
      query['metadata.environment'] = { $in: [environment, 'all'] };
    }
    
    return this.findOne(query);
  },

  /**
   * Obtenir la valeur d'un paramètre
   */
  async getValue(key, defaultValue = null, environment = 'all') {
    const setting = await this.getSetting(key, environment);
    return setting ? setting.getValue() : defaultValue;
  },

  /**
   * Définir un paramètre
   */
  async setSetting(key, value, updatedBy = 'system', environment = 'all') {
    const setting = await this.getSetting(key, environment);
    
    if (setting) {
      setting.setValue(value, updatedBy);
      return setting.save();
    } else {
      throw new Error(`Setting ${key} not found`);
    }
  },

  /**
   * Obtenir tous les paramètres d'une catégorie
   */
  async getByCategory(category, environment = 'all') {
    const query = { category };
    if (environment !== 'all') {
      query['metadata.environment'] = { $in: [environment, 'all'] };
    }
    
    return this.find(query).sort({ key: 1 });
  },

  /**
   * Créer ou mettre à jour un paramètre
   */
  async upsertSetting(settingData) {
    const filter = { key: settingData.key };

    return this.findOneAndUpdate(
      filter,
      { 
        ...settingData,
        'metadata.lastUpdated': new Date()
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
  },

  /**
   * Initialiser les paramètres par défaut
   */
  async initializeDefaultSettings() {
    const defaultSettings = [
      // API Keys
      {
        key: 'google.sheets.api.key',
        value: process.env.GOOGLE_SHEETS_API_KEY || '',
        dataType: 'string',
        category: 'api-keys',
        description: 'Clé API Google Sheets',
        sensitive: true,
        validation: { required: true, minLength: 10 }
      },
      {
        key: 'google.maps.api.key',
        value: process.env.GOOGLE_MAPS_API_KEY || '',
        dataType: 'string',
        category: 'api-keys',
        description: 'Clé API Google Maps',
        sensitive: true,
        validation: { required: true, minLength: 10 }
      },
      {
        key: 'yalidine.api.id',
        value: process.env.YALIDINE_API_ID || '',
        dataType: 'string',
        category: 'api-keys',
        description: 'ID API Yalidine',
        sensitive: true
      },
      {
        key: 'yalidine.api.token',
        value: process.env.YALIDINE_API_TOKEN || '',
        dataType: 'string',
        category: 'api-keys',
        description: 'Token API Yalidine',
        sensitive: true
      },

      // Services de livraison
      {
        key: 'delivery.services.enabled',
        value: ['yalidine', 'zaki', 'jamal-delivery'],
        dataType: 'array',
        category: 'delivery-services',
        description: 'Services de livraison activés',
        defaultValue: ['yalidine', 'zaki', 'jamal-delivery']
      },
      {
        key: 'delivery.default.service',
        value: 'yalidine',
        dataType: 'string',
        category: 'delivery-services',
        description: 'Service de livraison par défaut',
        validation: { allowedValues: ['yalidine', 'zaki', 'jamal-delivery'] }
      },

      // Paramètres de tarification
      {
        key: 'pricing.cod.percentage',
        value: 1,
        dataType: 'number',
        category: 'pricing',
        description: 'Pourcentage de frais de remboursement',
        validation: { minValue: 0, maxValue: 10 }
      },
      {
        key: 'pricing.overweight.threshold',
        value: 5,
        dataType: 'number',
        category: 'pricing',
        description: 'Seuil de surpoids en kg',
        validation: { minValue: 1, maxValue: 50 }
      },

      // Interface utilisateur
      {
        key: 'ui.theme',
        value: 'light',
        dataType: 'string',
        category: 'ui-settings',
        description: 'Thème de l\'interface',
        validation: { allowedValues: ['light', 'dark', 'auto'] }
      },
      {
        key: 'ui.language',
        value: 'fr',
        dataType: 'string',
        category: 'ui-settings',
        description: 'Langue de l\'interface',
        validation: { allowedValues: ['fr', 'ar', 'en'] }
      }
    ];

    for (const setting of defaultSettings) {
      await this.upsertSetting(setting);
    }

    console.log('✅ Paramètres par défaut initialisés');
  }
};

// Middleware pre-save
settingsSchema.pre('save', function(next) {
  // Mettre à jour les métadonnées
  this.metadata.lastUpdated = new Date();
  
  next();
});

// Créer et exporter le modèle
const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
