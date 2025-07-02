/**
 * Service d'intégration entre POS API et Google Sheets
 * Gère la synchronisation et l'enrichissement des données produits
 */

import posService from './posService.js';
import productService from '../lib/productService.js';
import { cleanNumber, formatNumber } from '../lib/mathUtils.js';

class ProductIntegrationService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Importer des produits depuis POS et enrichir avec Google Sheets
   * @param {Object} options - Options d'importation
   * @returns {Promise<Object>} - Résultat de l'importation
   */
  async importAndEnrichProducts(options = {}) {
    try {
      console.log('🔄 Début de l\'importation des produits...');
      
      // 1. Récupérer les produits depuis POS
      const posProducts = await this.getPOSProducts(options);
      console.log(`📦 ${posProducts.length} produits récupérés depuis POS`);

      // 2. Enrichir avec les données Google Sheets
      const enrichedProducts = await this.enrichWithGoogleSheets(posProducts);
      console.log(`✨ ${enrichedProducts.length} produits enrichis`);

      // 3. Analyser les résultats
      const analysis = this.analyzeEnrichmentResults(enrichedProducts);
      
      return {
        success: true,
        products: enrichedProducts,
        analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'importation:', error);
      return {
        success: false,
        error: error.message,
        products: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Récupérer les produits depuis POS avec filtres
   * @param {Object} options - Options de récupération
   * @returns {Promise<Array>} - Liste des produits POS
   */
  async getPOSProducts(options = {}) {
    const {
      searchTerm,
      categoryId,
      brandId,
      limit = 100
    } = options;

    try {
      let products = [];

      if (searchTerm) {
        // Recherche par terme
        products = await posService.searchProducts(searchTerm);
      } else if (categoryId) {
        // Recherche par catégorie
        products = await posService.getProductsByCategory(categoryId);
      } else if (brandId) {
        // Recherche par marque
        products = await posService.getProductsByBrand(brandId);
      } else {
        // Récupération générale
        const response = await posService.getProducts({ per_page: limit });
        products = response.products;
      }

      return products.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération POS:', error);
      return [];
    }
  }

  /**
   * Enrichir les produits POS avec les données Google Sheets
   * @param {Array} posProducts - Produits depuis POS
   * @returns {Promise<Array>} - Produits enrichis
   */
  async enrichWithGoogleSheets(posProducts) {
    const enrichedProducts = [];

    for (const posProduct of posProducts) {
      try {
        // Rechercher dans Google Sheets
        const sheetData = await this.findInGoogleSheets(posProduct);
        
        // Créer le produit enrichi
        const enrichedProduct = {
          ...posProduct,
          // Données d'enrichissement
          enrichment: {
            found_in_sheets: !!sheetData,
            match_method: sheetData?.match_method || null,
            confidence: sheetData?.confidence || 0
          },
          // Dimensions (depuis Sheets ou vides)
          dimensions: sheetData ? {
            length: cleanNumber(sheetData.length),
            width: cleanNumber(sheetData.width), 
            height: cleanNumber(sheetData.height)
          } : {
            length: null,
            width: null,
            height: null
          },
          // Poids (depuis Sheets ou POS)
          weight: sheetData?.weight || posProduct.weight || null,
          // Statut pour l'interface
          needs_manual_input: !sheetData,
          // Données brutes des sheets
          sheet_data: sheetData || null
        };

        enrichedProducts.push(enrichedProduct);
      } catch (error) {
        console.error(`Erreur enrichissement produit ${posProduct.sku}:`, error);
        
        // Ajouter le produit sans enrichissement
        enrichedProducts.push({
          ...posProduct,
          enrichment: { found_in_sheets: false, error: error.message },
          dimensions: { length: null, width: null, height: null },
          weight: posProduct.weight || null,
          needs_manual_input: true,
          sheet_data: null
        });
      }
    }

    return enrichedProducts;
  }

  /**
   * Rechercher un produit dans Google Sheets
   * @param {Object} posProduct - Produit POS
   * @returns {Promise<Object|null>} - Données trouvées ou null
   */
  async findInGoogleSheets(posProduct) {
    try {
      // 1. Recherche par SKU (priorité maximale)
      if (posProduct.sku) {
        const skuMatch = await productService.searchProducts(posProduct.sku);
        if (skuMatch.length > 0) {
          return {
            ...skuMatch[0],
            match_method: 'sku',
            confidence: 1.0
          };
        }
      }

      // 2. Recherche par nom exact
      if (posProduct.name) {
        const nameMatch = await productService.searchProducts(posProduct.name);
        if (nameMatch.length > 0) {
          // Vérifier la similarité
          const similarity = this.calculateSimilarity(posProduct.name, nameMatch[0].name);
          if (similarity > 0.9) {
            return {
              ...nameMatch[0],
              match_method: 'exact_name',
              confidence: similarity
            };
          }
        }
      }

      // 3. Recherche fuzzy par nom
      if (posProduct.name) {
        const fuzzyMatches = await this.fuzzySearchInSheets(posProduct.name);
        if (fuzzyMatches.length > 0) {
          const bestMatch = fuzzyMatches[0];
          if (bestMatch.confidence > 0.7) {
            return {
              ...bestMatch,
              match_method: 'fuzzy_name',
              confidence: bestMatch.confidence
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Erreur recherche Google Sheets:', error);
      return null;
    }
  }

  /**
   * Recherche fuzzy dans Google Sheets
   * @param {string} searchTerm - Terme de recherche
   * @returns {Promise<Array>} - Résultats avec score de confiance
   */
  async fuzzySearchInSheets(searchTerm) {
    try {
      // Récupérer tous les produits des sheets (avec cache)
      const allSheetProducts = await this.getAllSheetProducts();
      
      // Calculer la similarité pour chaque produit
      const matches = allSheetProducts
        .map(product => ({
          ...product,
          confidence: this.calculateSimilarity(searchTerm, product.name)
        }))
        .filter(product => product.confidence > 0.5)
        .sort((a, b) => b.confidence - a.confidence);

      return matches.slice(0, 5); // Top 5 matches
    } catch (error) {
      console.error('Erreur recherche fuzzy:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les produits Google Sheets (avec cache)
   * @returns {Promise<Array>} - Tous les produits
   */
  async getAllSheetProducts() {
    const cacheKey = 'all_sheet_products';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const products = await productService.getAllProducts();
      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });
      return products;
    } catch (error) {
      console.error('Erreur récupération sheets:', error);
      return [];
    }
  }

  /**
   * Calculer la similarité entre deux chaînes
   * @param {string} str1 - Première chaîne
   * @param {string} str2 - Deuxième chaîne
   * @returns {number} - Score de similarité (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    // Normaliser les chaînes
    const normalize = (str) => str.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const s1 = normalize(str1);
    const s2 = normalize(str2);
    
    if (s1 === s2) return 1.0;
    
    // Algorithme de Levenshtein simplifié
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculer la distance de Levenshtein
   * @param {string} str1 - Première chaîne
   * @param {string} str2 - Deuxième chaîne
   * @returns {number} - Distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Analyser les résultats d'enrichissement
   * @param {Array} enrichedProducts - Produits enrichis
   * @returns {Object} - Analyse des résultats
   */
  analyzeEnrichmentResults(enrichedProducts) {
    const total = enrichedProducts.length;
    const foundInSheets = enrichedProducts.filter(p => p.enrichment.found_in_sheets).length;
    const needsManualInput = enrichedProducts.filter(p => p.needs_manual_input).length;
    
    const matchMethods = enrichedProducts
      .filter(p => p.enrichment.found_in_sheets)
      .reduce((acc, p) => {
        const method = p.enrichment.match_method;
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});

    return {
      total_products: total,
      found_in_sheets: foundInSheets,
      needs_manual_input: needsManualInput,
      coverage_percentage: total > 0 ? Math.round((foundInSheets / total) * 100) : 0,
      match_methods: matchMethods,
      recommendations: this.generateRecommendations(enrichedProducts)
    };
  }

  /**
   * Générer des recommandations basées sur l'analyse
   * @param {Array} enrichedProducts - Produits enrichis
   * @returns {Array} - Liste de recommandations
   */
  generateRecommendations(enrichedProducts) {
    const recommendations = [];
    
    const needsManual = enrichedProducts.filter(p => p.needs_manual_input);
    if (needsManual.length > 0) {
      recommendations.push({
        type: 'manual_input',
        priority: 'high',
        message: `${needsManual.length} produits nécessitent une saisie manuelle des dimensions`,
        products: needsManual.slice(0, 5).map(p => ({ sku: p.sku, name: p.name }))
      });
    }

    const lowConfidence = enrichedProducts.filter(p => 
      p.enrichment.found_in_sheets && p.enrichment.confidence < 0.8
    );
    if (lowConfidence.length > 0) {
      recommendations.push({
        type: 'verify_matches',
        priority: 'medium',
        message: `${lowConfidence.length} correspondances ont une faible confiance et doivent être vérifiées`,
        products: lowConfidence.slice(0, 5).map(p => ({ 
          sku: p.sku, 
          name: p.name, 
          confidence: p.enrichment.confidence 
        }))
      });
    }

    return recommendations;
  }

  /**
   * Sauvegarder un produit enrichi manuellement
   * @param {Object} productData - Données du produit
   * @returns {Promise<boolean>} - Succès de la sauvegarde
   */
  async saveEnrichedProduct(productData) {
    try {
      // Préparer les données pour Google Sheets
      const sheetData = {
        name: productData.name,
        sku: productData.sku,
        length: cleanNumber(productData.dimensions.length),
        width: cleanNumber(productData.dimensions.width),
        height: cleanNumber(productData.dimensions.height),
        weight: cleanNumber(productData.weight),
        brand: productData.brand || '',
        category: productData.category || '',
        updated_at: new Date().toISOString()
      };

      // Sauvegarder dans Google Sheets
      const success = await productService.saveProduct(sheetData);
      
      if (success) {
        // Invalider le cache
        this.cache.delete('all_sheet_products');
        console.log(`✅ Produit ${productData.sku} sauvegardé avec succès`);
      }
      
      return success;
    } catch (error) {
      console.error('Erreur sauvegarde produit enrichi:', error);
      return false;
    }
  }

  /**
   * Nettoyer le cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache nettoyé');
  }
}

// Instance singleton
const productIntegrationService = new ProductIntegrationService();

export default productIntegrationService;
