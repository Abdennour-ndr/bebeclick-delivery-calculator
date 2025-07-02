/**
 * Service MongoDB pour la gestion des produits
 * Gère le catalogue des produits avec recherche et synchronisation
 */

import { Product } from '../models/index.js';
import { connectToDatabase } from '../config/database.js';

class MongoProductService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes pour les produits
    this.isInitialized = false;
    
    console.log('📦 MongoDB Product Service initialisé');
  }

  /**
   * Initialiser la connexion à la base de données
   */
  async initialize() {
    try {
      if (!this.isInitialized) {
        await connectToDatabase();
        this.isInitialized = true;
        console.log('✅ MongoDB Product Service prêt');
      }
    } catch (error) {
      console.error('❌ Erreur d\'initialisation MongoDB Product:', error);
      throw error;
    }
  }

  /**
   * Rechercher des produits par nom ou SKU
   */
  async searchProducts(searchTerm, limit = 20) {
    try {
      await this.initialize();
      
      console.log(`🔍 Recherche produits: "${searchTerm}"`);
      
      // Vérifier le cache d'abord
      const cacheKey = `search:${searchTerm.toLowerCase()}:${limit}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        console.log('📋 Résultats trouvés dans le cache');
        return cachedResult;
      }

      // Rechercher dans MongoDB
      const products = await Product.searchProducts(searchTerm, limit);
      
      // Incrémenter le compteur d'utilisation pour les produits trouvés
      for (const product of products) {
        product.incrementUsage();
        await product.save();
      }
      
      // Mettre en cache
      this.setCache(cacheKey, products);
      
      console.log(`✅ ${products.length} produits trouvés`);
      return products;

    } catch (error) {
      console.error('❌ Erreur lors de la recherche de produits:', error);
      return [];
    }
  }

  /**
   * Obtenir un produit par SKU
   */
  async getProductBySku(sku) {
    try {
      await this.initialize();
      
      console.log(`📦 Recherche produit par SKU: ${sku}`);
      
      const product = await Product.findOne({
        sku: sku.toUpperCase(),
        status: 'active'
      });
      
      if (product) {
        product.incrementUsage();
        await product.save();
        console.log(`✅ Produit trouvé: ${product.name}`);
      } else {
        console.log('❌ Produit non trouvé');
      }
      
      return product;

    } catch (error) {
      console.error('❌ Erreur lors de la recherche par SKU:', error);
      return null;
    }
  }

  /**
   * Sauvegarder ou mettre à jour un produit
   */
  async saveProduct(productData) {
    try {
      await this.initialize();
      
      console.log(`💾 Sauvegarde produit: ${productData.name || productData.sku}`);
      
      // Valider les données requises
      if (!productData.sku || !productData.name) {
        throw new Error('SKU et nom du produit sont requis');
      }
      
      // Valider les dimensions
      if (!productData.dimensions || 
          !productData.dimensions.length || 
          !productData.dimensions.width || 
          !productData.dimensions.height || 
          !productData.dimensions.weight) {
        throw new Error('Dimensions complètes requises (longueur, largeur, hauteur, poids)');
      }
      
      const result = await Product.upsertProduct(productData);
      
      // Invalider le cache
      this.clearCache();
      
      console.log('✅ Produit sauvegardé avec succès');
      return result;

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du produit:', error);
      throw error;
    }
  }

  /**
   * Obtenir les produits par catégorie
   */
  async getProductsByCategory(category, limit = 50) {
    try {
      await this.initialize();
      
      console.log(`📂 Récupération produits par catégorie: ${category}`);
      
      const products = await Product.getByCategory(category, limit);
      
      console.log(`✅ ${products.length} produits trouvés dans la catégorie`);
      return products;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération par catégorie:', error);
      return [];
    }
  }

  /**
   * Obtenir les produits populaires
   */
  async getPopularProducts(limit = 10) {
    try {
      await this.initialize();
      
      const products = await Product.getPopularProducts(limit);
      
      console.log(`⭐ ${products.length} produits populaires récupérés`);
      return products;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits populaires:', error);
      return [];
    }
  }

  /**
   * Obtenir tous les produits avec pagination
   */
  async getAllProducts(page = 1, limit = 50, filters = {}) {
    try {
      await this.initialize();
      
      const skip = (page - 1) * limit;
      const query = { status: 'active' };
      
      // Appliquer les filtres
      if (filters.category) query.category = new RegExp(filters.category, 'i');
      if (filters.brand) query.brand = new RegExp(filters.brand, 'i');
      if (filters.minPrice) query['pricing.salePrice'] = { $gte: filters.minPrice };
      if (filters.maxPrice) {
        query['pricing.salePrice'] = query['pricing.salePrice'] || {};
        query['pricing.salePrice'].$lte = filters.maxPrice;
      }
      
      const [products, total] = await Promise.all([
        Product.find(query)
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit),
        Product.countDocuments(query)
      ]);
      
      console.log(`📋 ${products.length}/${total} produits récupérés (page ${page})`);
      
      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits:', error);
      return { products: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
    }
  }

  /**
   * Mettre à jour le stock d'un produit
   */
  async updateStock(sku, quantity, operation = 'set') {
    try {
      await this.initialize();
      
      console.log(`📊 Mise à jour stock ${sku}: ${operation} ${quantity}`);
      
      const product = await Product.findOne({ sku: sku.toUpperCase() });
      if (!product) {
        throw new Error(`Produit ${sku} non trouvé`);
      }
      
      switch (operation) {
        case 'set':
          product.inventory.quantity = quantity;
          break;
        case 'add':
          product.inventory.quantity += quantity;
          break;
        case 'subtract':
          product.inventory.quantity = Math.max(0, product.inventory.quantity - quantity);
          break;
        default:
          throw new Error(`Opération ${operation} non supportée`);
      }
      
      product.inventory.lastStockUpdate = new Date();
      await product.save();
      
      console.log(`✅ Stock mis à jour: ${product.inventory.quantity}`);
      return product;

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du stock:', error);
      throw error;
    }
  }

  /**
   * Obtenir les produits avec stock faible
   */
  async getLowStockProducts() {
    try {
      await this.initialize();
      
      const products = await Product.getLowStockProducts();
      
      console.log(`⚠️ ${products.length} produits avec stock faible`);
      return products;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stocks faibles:', error);
      return [];
    }
  }

  /**
   * Importer des produits en lot
   */
  async bulkImportProducts(productsArray, source = 'import') {
    try {
      await this.initialize();
      
      console.log(`📦 Import en lot de ${productsArray.length} produits`);
      
      const results = [];
      for (const productData of productsArray) {
        try {
          // Ajouter la source des données
          productData.metadata = productData.metadata || {};
          productData.metadata.dataSource = source;
          
          const result = await Product.upsertProduct(productData);
          results.push({ success: true, data: result });
        } catch (error) {
          results.push({ success: false, error: error.message, data: productData });
        }
      }
      
      // Invalider le cache
      this.clearCache();
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ ${successCount}/${productsArray.length} produits importés avec succès`);
      
      return results;

    } catch (error) {
      console.error('❌ Erreur lors de l\'import en lot:', error);
      throw error;
    }
  }

  /**
   * Supprimer un produit (soft delete)
   */
  async deleteProduct(sku) {
    try {
      await this.initialize();
      
      console.log(`🗑️ Suppression produit: ${sku}`);
      
      const product = await Product.findOne({ sku: sku.toUpperCase() });
      if (!product) {
        throw new Error(`Produit ${sku} non trouvé`);
      }
      
      product.status = 'inactive';
      product.updateMetadata('system', 'Produit supprimé');
      await product.save();
      
      // Invalider le cache
      this.clearCache();
      
      console.log('✅ Produit supprimé avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
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
    console.log('🧹 Cache des produits vidé');
  }

  /**
   * Obtenir les statistiques des produits
   */
  async getStats() {
    try {
      await this.initialize();
      
      const stats = await Product.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgPrice: { $avg: '$pricing.salePrice' },
            totalStock: { $sum: '$inventory.quantity' }
          }
        }
      ]);
      
      const categoryStats = await Product.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$pricing.salePrice' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      return {
        general: stats,
        categories: categoryStats
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      return { general: [], categories: [] };
    }
  }
}

// Instance singleton
const mongoProductService = new MongoProductService();

export default mongoProductService;
