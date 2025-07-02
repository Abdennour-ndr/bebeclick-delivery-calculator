/**
 * Modèle MongoDB pour les locations (Wilayas et Communes)
 * Gère la hiérarchie géographique de l'Algérie
 */

import mongoose from 'mongoose';

// Schéma pour les locations
const locationSchema = new mongoose.Schema({
  // Type de location
  type: {
    type: String,
    required: true,
    enum: ['wilaya', 'commune', 'district'],
    index: true
  },

  // Code officiel
  code: {
    type: Number,
    required: true,
    index: true
  },

  // Nom en français
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // Nom en arabe
  nameAr: {
    type: String,
    trim: true
  },

  // Nom en berbère (si applicable)
  nameBer: {
    type: String,
    trim: true
  },

  // Hiérarchie géographique
  hierarchy: {
    // Code de la wilaya parente (pour communes)
    wilayaCode: {
      type: Number,
      index: true
    },
    
    // Nom de la wilaya parente
    wilayaName: String,
    
    // Code du district parent (si applicable)
    districtCode: Number,
    
    // Nom du district parent
    districtName: String
  },

  // Informations géographiques
  geography: {
    // Coordonnées GPS
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    
    // Zone géographique
    region: {
      type: String,
      enum: ['nord', 'centre', 'sud', 'est', 'ouest'],
      index: true
    },
    
    // Zone climatique
    climateZone: {
      type: String,
      enum: ['littoral', 'montagne', 'steppe', 'sahara']
    },
    
    // Superficie (km²)
    area: Number,
    
    // Population estimée
    population: Number
  },

  // Configuration de livraison
  deliveryConfig: {
    // Zone de tarification
    pricingZone: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
      index: true
    },
    
    // Services de livraison disponibles
    availableServices: [{
      service: {
        type: String,
        enum: ['yalidine', 'zaki', 'jamal-delivery']
      },
      available: {
        type: Boolean,
        default: true
      },
      homeDelivery: {
        type: Boolean,
        default: true
      },
      officeDelivery: {
        type: Boolean,
        default: true
      }
    }],
    
    // Délai de livraison moyen (jours)
    averageDeliveryTime: {
      type: Number,
      min: 1,
      max: 30,
      default: 3
    },
    
    // Restrictions spéciales
    restrictions: {
      weekendDelivery: {
        type: Boolean,
        default: false
      },
      expressDelivery: {
        type: Boolean,
        default: true
      },
      codAvailable: {
        type: Boolean,
        default: true
      }
    }
  },

  // Statut et disponibilité
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },

  // Métadonnées
  metadata: {
    // Source des données
    dataSource: {
      type: String,
      enum: ['official', 'yalidine-api', 'manual', 'import'],
      default: 'official'
    },
    
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
    
    // Notes et commentaires
    notes: String,
    
    // Validation des données
    verified: {
      type: Boolean,
      default: false
    },
    
    // Date de vérification
    verifiedAt: Date
  }

}, {
  timestamps: true,
  collection: 'locations'
});

// Index composé pour optimiser les requêtes
locationSchema.index({ 
  type: 1, 
  code: 1 
}, { 
  unique: true,
  name: 'type_code_unique'
});

// Index pour les recherches hiérarchiques
locationSchema.index({ 
  'hierarchy.wilayaCode': 1,
  type: 1,
  status: 1
});

// Index de recherche textuelle
locationSchema.index({ 
  name: 'text',
  nameAr: 'text'
}, {
  name: 'location_text_search'
});

// Index géographique
locationSchema.index({ 
  'geography.coordinates': '2dsphere'
});

// Méthodes du schéma
locationSchema.methods = {
  /**
   * Obtenir le nom complet avec hiérarchie
   */
  getFullName() {
    if (this.type === 'wilaya') {
      return `${this.name} (${this.code})`;
    } else if (this.type === 'commune') {
      return `${this.name}, ${this.hierarchy.wilayaName}`;
    }
    return this.name;
  },

  /**
   * Vérifier si un service de livraison est disponible
   */
  isServiceAvailable(serviceName, deliveryType = 'home') {
    const service = this.deliveryConfig.availableServices.find(s => s.service === serviceName);
    if (!service || !service.available) return false;
    
    const deliveryKey = deliveryType === 'home' ? 'homeDelivery' : 'officeDelivery';
    return service[deliveryKey];
  },

  /**
   * Obtenir la zone de tarification
   */
  getPricingZone() {
    return this.deliveryConfig.pricingZone;
  },

  /**
   * Mettre à jour les métadonnées
   */
  updateMetadata(updatedBy = 'system', notes = '') {
    this.metadata.lastUpdated = new Date();
    this.metadata.updatedBy = updatedBy;
    if (notes) this.metadata.notes = notes;
  }
};

// Méthodes statiques
locationSchema.statics = {
  /**
   * Obtenir toutes les wilayas
   */
  async getWilayas() {
    return this.find({
      type: 'wilaya',
      status: 'active'
    }).sort({ code: 1 });
  },

  /**
   * Obtenir les communes d'une wilaya
   */
  async getCommunesByWilaya(wilayaCode) {
    return this.find({
      type: 'commune',
      'hierarchy.wilayaCode': wilayaCode,
      status: 'active'
    }).sort({ name: 1 });
  },

  /**
   * Rechercher des locations par nom
   */
  async searchByName(searchTerm, type = null) {
    const query = {
      $text: { $search: searchTerm },
      status: 'active'
    };
    
    if (type) {
      query.type = type;
    }
    
    return this.find(query, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } });
  },

  /**
   * Obtenir les locations par zone de tarification
   */
  async getByPricingZone(zone) {
    return this.find({
      'deliveryConfig.pricingZone': zone,
      status: 'active'
    }).sort({ 'hierarchy.wilayaCode': 1, name: 1 });
  },

  /**
   * Mettre à jour ou créer une location
   */
  async upsertLocation(locationData) {
    const filter = {
      type: locationData.type,
      code: locationData.code
    };

    return this.findOneAndUpdate(
      filter,
      { 
        ...locationData,
        'metadata.lastUpdated': new Date()
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
  }
};

// Middleware pre-save
locationSchema.pre('save', function(next) {
  // Normaliser les noms
  if (this.name) {
    this.name = this.name.trim();
  }
  
  // Définir la zone de tarification par défaut basée sur la région
  if (!this.deliveryConfig.pricingZone && this.geography.region) {
    const zoneMapping = {
      'nord': 2,
      'centre': 3,
      'sud': 4,
      'est': 3,
      'ouest': 3
    };
    this.deliveryConfig.pricingZone = zoneMapping[this.geography.region] || 1;
  }
  
  // Mettre à jour les métadonnées
  this.metadata.lastUpdated = new Date();
  
  next();
});

// Créer et exporter le modèle
const Location = mongoose.model('Location', locationSchema);

export default Location;
