/**
 * Modèle MongoDB pour les prix de livraison
 * Gère les tarifs pour tous les services de livraison
 */

import mongoose from 'mongoose';

// Schéma pour les prix de livraison
const deliveryPricingSchema = new mongoose.Schema({
  // Service de livraison
  service: {
    type: String,
    required: true,
    enum: ['yalidine', 'zaki', 'jamal-delivery'],
    index: true
  },

  // Informations géographiques
  wilaya: {
    code: {
      type: Number,
      required: true,
      min: 1,
      max: 58
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },

  commune: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // Zone de tarification (pour Zaki et autres)
  zone: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },

  // Prix de livraison
  pricing: {
    // Prix livraison à domicile
    home: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Prix livraison au bureau/point relais
    office: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Frais supplémentaires
    supplements: {
      // Frais de remboursement (%)
      codFeePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
      },
      
      // Frais de remboursement fixe
      codFeeFixed: {
        type: Number,
        default: 0,
        min: 0
      },
      
      // Frais de surpoids (par kg)
      overweightFee: {
        type: Number,
        default: 0,
        min: 0
      },
      
      // Seuil de surpoids (kg)
      overweightThreshold: {
        type: Number,
        default: 5,
        min: 0
      }
    }
  },

  // Configuration spécifique au service
  serviceConfig: {
    // Pour Yalidine
    yalidine: {
      stopDeskId: String,
      centerCode: String,
      expressAvailable: {
        type: Boolean,
        default: true
      }
    },
    
    // Pour Zaki
    zaki: {
      distanceRange: {
        min: Number,
        max: Number
      },
      coverageArea: String
    },
    
    // Pour Jamal Delivery
    jamalDelivery: {
      serviceLevel: {
        type: String,
        enum: ['standard', 'express', 'premium'],
        default: 'standard'
      }
    }
  },

  // Statut et disponibilité
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

  // Disponibilité du service
  availability: {
    homeDelivery: {
      type: Boolean,
      default: true
    },
    officeDelivery: {
      type: Boolean,
      default: true
    },
    weekendDelivery: {
      type: Boolean,
      default: false
    }
  },

  // Métadonnées
  metadata: {
    // Source des données
    dataSource: {
      type: String,
      enum: ['manual', 'api', 'import', 'sync'],
      default: 'manual'
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
    
    // Validité des données
    validFrom: Date,
    validUntil: Date
  }

}, {
  timestamps: true, // Ajoute createdAt et updatedAt automatiquement
  collection: 'delivery_pricing'
});

// Index composé pour optimiser les requêtes
deliveryPricingSchema.index({ 
  service: 1, 
  'wilaya.code': 1, 
  commune: 1 
}, { 
  unique: true,
  name: 'service_location_unique'
});

// Index pour les recherches par zone
deliveryPricingSchema.index({ 
  service: 1, 
  zone: 1 
});

// Index pour les recherches par statut
deliveryPricingSchema.index({ 
  status: 1,
  'availability.homeDelivery': 1,
  'availability.officeDelivery': 1
});

// Méthodes du schéma
deliveryPricingSchema.methods = {
  /**
   * Calculer le prix total avec suppléments
   */
  calculateTotalPrice(deliveryType = 'home', weight = 0, declaredValue = 0) {
    const basePrice = this.pricing[deliveryType] || this.pricing.home;
    let totalPrice = basePrice;
    
    // Ajouter frais de surpoids
    if (weight > this.pricing.supplements.overweightThreshold) {
      const overweight = weight - this.pricing.supplements.overweightThreshold;
      totalPrice += overweight * this.pricing.supplements.overweightFee;
    }
    
    // Ajouter frais de remboursement
    if (declaredValue > 0) {
      const codFee = (declaredValue * this.pricing.supplements.codFeePercentage / 100) + 
                     this.pricing.supplements.codFeeFixed;
      totalPrice += codFee;
    }
    
    return Math.round(totalPrice);
  },

  /**
   * Vérifier la disponibilité du service
   */
  isAvailable(deliveryType = 'home') {
    if (this.status !== 'active') return false;
    
    const availabilityKey = deliveryType === 'home' ? 'homeDelivery' : 'officeDelivery';
    return this.availability[availabilityKey];
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
deliveryPricingSchema.statics = {
  /**
   * Trouver les prix par service et localisation
   */
  async findByLocation(service, wilayaCode, commune) {
    return this.findOne({
      service,
      'wilaya.code': wilayaCode,
      commune: new RegExp(commune, 'i'),
      status: 'active'
    });
  },

  /**
   * Obtenir tous les prix pour un service
   */
  async getServicePricing(service) {
    return this.find({
      service,
      status: 'active'
    }).sort({ 'wilaya.code': 1, commune: 1 });
  },

  /**
   * Mettre à jour ou créer un prix
   */
  async upsertPricing(pricingData) {
    const filter = {
      service: pricingData.service,
      'wilaya.code': pricingData.wilaya.code,
      commune: pricingData.commune
    };

    return this.findOneAndUpdate(
      filter,
      { 
        ...pricingData,
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
deliveryPricingSchema.pre('save', function(next) {
  // Normaliser le nom de la commune
  if (this.commune) {
    this.commune = this.commune.trim();
  }
  
  // Mettre à jour les métadonnées
  this.metadata.lastUpdated = new Date();
  
  next();
});

// Créer et exporter le modèle
const DeliveryPricing = mongoose.model('DeliveryPricing', deliveryPricingSchema);

export default DeliveryPricing;
