/**
 * Modèle MongoDB pour les produits
 * Gère le catalogue des produits avec dimensions et informations de livraison
 */

import mongoose from 'mongoose';

// Schéma pour les produits
const productSchema = new mongoose.Schema({
  // Informations de base
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // SKU unique
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },

  // Marque
  brand: {
    type: String,
    trim: true,
    index: true
  },

  // Catégorie
  category: {
    type: String,
    trim: true,
    index: true
  },

  // Sous-catégorie
  subcategory: {
    type: String,
    trim: true
  },

  // Description
  description: {
    type: String,
    trim: true
  },

  // Prix
  pricing: {
    // Prix de vente (DA)
    salePrice: {
      type: Number,
      min: 0
    },
    
    // Prix d'achat (DA)
    costPrice: {
      type: Number,
      min: 0
    },
    
    // Prix de gros (DA)
    wholesalePrice: {
      type: Number,
      min: 0
    },
    
    // Devise
    currency: {
      type: String,
      default: 'DZD',
      enum: ['DZD', 'EUR', 'USD']
    }
  },

  // Dimensions et poids
  dimensions: {
    // Longueur (cm)
    length: {
      type: Number,
      min: 0,
      required: true
    },
    
    // Largeur (cm)
    width: {
      type: Number,
      min: 0,
      required: true
    },
    
    // Hauteur (cm)
    height: {
      type: Number,
      min: 0,
      required: true
    },
    
    // Poids réel (kg)
    weight: {
      type: Number,
      min: 0,
      required: true
    },
    
    // Poids volumétrique calculé (kg)
    volumetricWeight: {
      type: Number,
      min: 0
    },
    
    // Unité de mesure
    unit: {
      type: String,
      default: 'cm',
      enum: ['cm', 'mm', 'm']
    }
  },

  // Informations de livraison
  shipping: {
    // Fragile
    fragile: {
      type: Boolean,
      default: false
    },
    
    // Nécessite un emballage spécial
    specialPackaging: {
      type: Boolean,
      default: false
    },
    
    // Restrictions de livraison
    restrictions: {
      noWeekendDelivery: {
        type: Boolean,
        default: false
      },
      homeDeliveryOnly: {
        type: Boolean,
        default: false
      },
      signatureRequired: {
        type: Boolean,
        default: false
      }
    },
    
    // Catégorie de transport
    transportCategory: {
      type: String,
      enum: ['standard', 'fragile', 'heavy', 'oversized'],
      default: 'standard'
    }
  },

  // Stock et disponibilité
  inventory: {
    // Quantité en stock
    quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // Stock minimum
    minStock: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // Disponible pour la vente
    available: {
      type: Boolean,
      default: true
    },
    
    // Dernière mise à jour du stock
    lastStockUpdate: {
      type: Date,
      default: Date.now
    }
  },

  // Images et médias
  media: {
    // Image principale
    mainImage: String,
    
    // Images supplémentaires
    additionalImages: [String],
    
    // URL de la fiche produit
    productUrl: String
  },

  // Statut
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'draft'],
    default: 'active',
    index: true
  },

  // Métadonnées
  metadata: {
    // Source des données
    dataSource: {
      type: String,
      enum: ['manual', 'pos-api', 'google-sheets', 'import'],
      default: 'manual'
    },
    
    // ID externe (POS, etc.)
    externalId: String,
    
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
    
    // Tags pour la recherche
    tags: [String],
    
    // Popularité (nombre de fois utilisé dans les calculs)
    usageCount: {
      type: Number,
      default: 0
    }
  }

}, {
  timestamps: true,
  collection: 'products'
});

// Index pour les recherches
productSchema.index({ 
  name: 'text',
  brand: 'text',
  category: 'text',
  'metadata.tags': 'text'
}, {
  name: 'product_text_search'
});

// Index composé pour les recherches fréquentes
productSchema.index({ 
  status: 1,
  category: 1,
  brand: 1
});

// Index pour les recherches par dimensions
productSchema.index({ 
  'dimensions.weight': 1,
  'dimensions.volumetricWeight': 1
});

// Méthodes du schéma
productSchema.methods = {
  /**
   * Calculer le poids volumétrique
   */
  calculateVolumetricWeight() {
    const { length, width, height } = this.dimensions;
    // Formule standard: (L × l × h) / 5000 pour cm³ vers kg
    const volumetricWeight = (length * width * height) / 5000;
    this.dimensions.volumetricWeight = Math.round(volumetricWeight * 100) / 100;
    return this.dimensions.volumetricWeight;
  },

  /**
   * Obtenir le poids facturable (max entre réel et volumétrique)
   */
  getBillableWeight() {
    const realWeight = this.dimensions.weight;
    const volumetricWeight = this.dimensions.volumetricWeight || this.calculateVolumetricWeight();
    return Math.max(realWeight, volumetricWeight);
  },

  /**
   * Vérifier si le produit est en stock
   */
  isInStock() {
    return this.inventory.available && this.inventory.quantity > 0;
  },

  /**
   * Vérifier si le stock est faible
   */
  isLowStock() {
    return this.inventory.quantity <= this.inventory.minStock;
  },

  /**
   * Incrémenter le compteur d'utilisation
   */
  incrementUsage() {
    this.metadata.usageCount += 1;
    this.metadata.lastUpdated = new Date();
  },

  /**
   * Obtenir le nom complet avec marque
   */
  getFullName() {
    return this.brand ? `${this.brand} ${this.name}` : this.name;
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
productSchema.statics = {
  /**
   * Rechercher des produits par nom ou SKU
   */
  async searchProducts(searchTerm, limit = 20) {
    // Recherche par SKU exact d'abord
    const skuMatch = await this.findOne({
      sku: searchTerm.toUpperCase(),
      status: 'active'
    });
    
    if (skuMatch) {
      return [skuMatch];
    }
    
    // Recherche textuelle
    return this.find({
      $text: { $search: searchTerm },
      status: 'active'
    }, { 
      score: { $meta: 'textScore' } 
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
  },

  /**
   * Obtenir les produits par catégorie
   */
  async getByCategory(category, limit = 50) {
    return this.find({
      category: new RegExp(category, 'i'),
      status: 'active'
    })
    .sort({ name: 1 })
    .limit(limit);
  },

  /**
   * Obtenir les produits populaires
   */
  async getPopularProducts(limit = 10) {
    return this.find({
      status: 'active',
      'metadata.usageCount': { $gt: 0 }
    })
    .sort({ 'metadata.usageCount': -1 })
    .limit(limit);
  },

  /**
   * Obtenir les produits avec stock faible
   */
  async getLowStockProducts() {
    return this.find({
      status: 'active',
      'inventory.available': true,
      $expr: { $lte: ['$inventory.quantity', '$inventory.minStock'] }
    })
    .sort({ 'inventory.quantity': 1 });
  },

  /**
   * Mettre à jour ou créer un produit
   */
  async upsertProduct(productData) {
    const filter = { sku: productData.sku };

    return this.findOneAndUpdate(
      filter,
      { 
        ...productData,
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
productSchema.pre('save', function(next) {
  // Normaliser les données
  if (this.name) this.name = this.name.trim();
  if (this.sku) this.sku = this.sku.trim().toUpperCase();
  if (this.brand) this.brand = this.brand.trim();
  if (this.category) this.category = this.category.trim();
  
  // Calculer le poids volumétrique
  this.calculateVolumetricWeight();
  
  // Mettre à jour les métadonnées
  this.metadata.lastUpdated = new Date();
  
  next();
});

// Créer et exporter le modèle
const Product = mongoose.model('Product', productSchema);

export default Product;
