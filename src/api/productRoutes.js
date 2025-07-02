/**
 * Routes API pour la gestion des produits
 * Endpoints CRUD pour le catalogue des produits
 */

import express from 'express';
import { mongoProductService } from '../services/mongoServices.js';

const router = express.Router();

/**
 * GET /api/products
 * Obtenir tous les produits avec pagination et filtres
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      brand,
      minPrice,
      maxPrice,
      status = 'active'
    } = req.query;

    const filters = { status };
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);

    const result = await mongoProductService.getAllProducts(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      filters,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /products:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des produits',
      message: error.message
    });
  }
});

/**
 * GET /api/products/search
 * Rechercher des produits par nom ou SKU
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, limit = 20 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Terme de recherche requis',
        message: 'Le paramètre q est obligatoire'
      });
    }

    const products = await mongoProductService.searchProducts(searchTerm, parseInt(limit));

    res.json({
      success: true,
      data: products,
      count: products.length,
      searchTerm,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /products/search:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche de produits',
      message: error.message
    });
  }
});

/**
 * GET /api/products/popular
 * Obtenir les produits populaires
 */
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await mongoProductService.getPopularProducts(parseInt(limit));

    res.json({
      success: true,
      data: products,
      count: products.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /products/popular:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des produits populaires',
      message: error.message
    });
  }
});

/**
 * GET /api/products/low-stock
 * Obtenir les produits avec stock faible
 */
router.get('/low-stock', async (req, res) => {
  try {
    const products = await mongoProductService.getLowStockProducts();

    res.json({
      success: true,
      data: products,
      count: products.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /products/low-stock:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des stocks faibles',
      message: error.message
    });
  }
});

/**
 * GET /api/products/category/:category
 * Obtenir les produits par catégorie
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;

    const products = await mongoProductService.getProductsByCategory(category, parseInt(limit));

    res.json({
      success: true,
      data: products,
      category,
      count: products.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur GET /products/category/${req.params.category}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des produits par catégorie',
      message: error.message
    });
  }
});

/**
 * GET /api/products/:sku
 * Obtenir un produit par SKU
 */
router.get('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    const product = await mongoProductService.getProductBySku(sku);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé',
        message: `Aucun produit trouvé avec le SKU: ${sku}`
      });
    }

    res.json({
      success: true,
      data: product,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur GET /products/${req.params.sku}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du produit',
      message: error.message
    });
  }
});

/**
 * POST /api/products
 * Créer ou mettre à jour un produit
 */
router.post('/', async (req, res) => {
  try {
    const productData = req.body;

    // Validation des données requises
    const requiredFields = ['sku', 'name', 'dimensions'];
    const missingFields = requiredFields.filter(field => !productData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        message: `Champs requis manquants: ${missingFields.join(', ')}`
      });
    }

    // Validation des dimensions
    const { dimensions } = productData;
    if (!dimensions.length || !dimensions.width || !dimensions.height || !dimensions.weight) {
      return res.status(400).json({
        success: false,
        error: 'Dimensions incomplètes',
        message: 'Longueur, largeur, hauteur et poids sont requis'
      });
    }

    const result = await mongoProductService.saveProduct(productData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Produit sauvegardé avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /products:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde du produit',
      message: error.message
    });
  }
});

/**
 * POST /api/products/bulk
 * Importer plusieurs produits en une fois
 */
router.post('/bulk', async (req, res) => {
  try {
    const { products, source = 'import' } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        message: 'products doit être un tableau non vide'
      });
    }

    const results = await mongoProductService.bulkImportProducts(products, source);

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: errorCount === 0,
      data: results,
      summary: {
        total: products.length,
        success: successCount,
        errors: errorCount
      },
      message: `${successCount}/${products.length} produits importés avec succès`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /products/bulk:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'import en lot',
      message: error.message
    });
  }
});

/**
 * PUT /api/products/:sku
 * Mettre à jour un produit
 */
router.put('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const updateData = req.body;

    // S'assurer que le SKU correspond
    updateData.sku = sku;

    const result = await mongoProductService.saveProduct(updateData);

    res.json({
      success: true,
      data: result,
      message: 'Produit mis à jour avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur PUT /products/${req.params.sku}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du produit',
      message: error.message
    });
  }
});

/**
 * PUT /api/products/:sku/stock
 * Mettre à jour le stock d'un produit
 */
router.put('/:sku/stock', async (req, res) => {
  try {
    const { sku } = req.params;
    const { quantity, operation = 'set' } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        error: 'Quantité requise',
        message: 'Le paramètre quantity est obligatoire'
      });
    }

    const result = await mongoProductService.updateStock(sku, quantity, operation);

    res.json({
      success: true,
      data: result,
      message: 'Stock mis à jour avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur PUT /products/${req.params.sku}/stock:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du stock',
      message: error.message
    });
  }
});

/**
 * DELETE /api/products/:sku
 * Supprimer un produit (soft delete)
 */
router.delete('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    const success = await mongoProductService.deleteProduct(sku);

    if (success) {
      res.json({
        success: true,
        message: 'Produit supprimé avec succès',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Produit non trouvé',
        message: `Aucun produit trouvé avec le SKU: ${sku}`
      });
    }

  } catch (error) {
    console.error(`❌ Erreur DELETE /products/${req.params.sku}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du produit',
      message: error.message
    });
  }
});

/**
 * GET /api/products/stats
 * Obtenir les statistiques des produits
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await mongoProductService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /products/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      message: error.message
    });
  }
});

export default router;
