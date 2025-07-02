/**
 * Service pour la gestion des produits via Google Sheets
 * Permet la synchronisation en temps réel entre tous les utilisateurs
 * Avec protection rate limiting
 */

import { makeRateLimitedRequest } from './apiRateLimiter.js';

// Configuration Google Sheets pour les produits
const PRODUCTS_SHEETS_CONFIG = {
  apiKey: 'AIzaSyCAx9J4hejd-vmM4xVoIqw_qNdC3AezZ90',
  spreadsheetId: '1upqT76F2lCYRtoensQAUPQHlQwxLn5xWvAeryWQ7DvU', // Même que BebeClick
  ranges: {
    products: 'Produits!A:H', // Colonnes: SKU, Nom, Longueur, Largeur, Hauteur, Poids, Prix, Date
    metadata: 'Metadata!A:B'
  }
};

class ProductsGoogleSheetsService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 1 * 60 * 1000; // 1 minute pour les produits
    this.isLoading = false;
    this.lastUpdate = null;

    console.log('🔑 Products Google Sheets Service initialisé avec API Key:', PRODUCTS_SHEETS_CONFIG.apiKey.substring(0, 10) + '...');
  }

  /**
   * Charger tous les produits depuis Google Sheets
   */
  async loadAllProducts() {
    if (this.isLoading) {
      return this.waitForLoading();
    }

    const cacheKey = 'all_products';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    this.isLoading = true;

    try {
      console.log('🔄 Chargement des produits depuis Google Sheets...');
      console.log('📋 Configuration:', {
        spreadsheetId: PRODUCTS_SHEETS_CONFIG.spreadsheetId,
        range: PRODUCTS_SHEETS_CONFIG.ranges.products,
        apiKey: PRODUCTS_SHEETS_CONFIG.apiKey.substring(0, 10) + '...'
      });

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${PRODUCTS_SHEETS_CONFIG.spreadsheetId}/values/${PRODUCTS_SHEETS_CONFIG.ranges.products}?key=${PRODUCTS_SHEETS_CONFIG.apiKey}`;

      const response = await makeRateLimitedRequest(async () => {
        return fetch(url);
      }, 'GoogleSheets-Products');

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Réponse Google Sheets:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Erreur Google Sheets: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      console.log(' Données reçues de Google Sheets:', {
        hasValues: !!data.values,
        rowCount: rows.length,
        firstRow: rows[0] || 'Aucune donnée',
        sampleRows: rows.slice(0, 3)
      });

      if (rows.length === 0) {
        console.log('⚠️ Aucune donnée produit trouvée dans Google Sheets');
        return [];
      }

      // Convertir les données en format utilisable
      const products = this.parseProductsData(rows);
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      // Sauvegarder en localStorage comme backup
      this.saveToLocalStorage(products);

      this.lastUpdate = new Date().toISOString();
      console.log(`✅ ${products.length} produits chargés depuis Google Sheets`);

      return products;
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error);
      
      // Retourner les données de fallback en cas d'erreur
      return this.getFallbackProducts();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Attendre la fin du chargement en cours
   */
  async waitForLoading() {
    while (this.isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.cache.get('all_products')?.data || [];
  }

  /**
   * Parser les données des produits du Google Sheet
   */
  parseProductsData(rows) {
    const products = [];
    
    // Ignorer la première ligne (headers)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 6) {
        const [sku, name, length, width, height, weight, price, dateAdded] = row;
        
        // Nettoyer et valider les données
        const cleanSku = String(sku || '').trim();
        const cleanName = String(name || '').trim();
        const cleanLength = parseFloat(length) || 0;
        const cleanWidth = parseFloat(width) || 0;
        const cleanHeight = parseFloat(height) || 0;
        const cleanWeight = parseFloat(weight) || 0;
        const cleanPrice = parseFloat(price) || 0;
        const cleanDate = String(dateAdded || '').trim();
        
        if (cleanName) {
          products.push({
            sku: cleanSku || this.generateSKU(cleanName),
            name: cleanName,
            dimensions: {
              length: cleanLength,
              width: cleanWidth,
              height: cleanHeight
            },
            weight: cleanWeight,
            price: cleanPrice,
            dateAdded: cleanDate || new Date().toISOString().split('T')[0]
          });
        }
      }
    }
    
    return products;
  }

  /**
   * Générer un SKU automatique
   */
  generateSKU(name) {
    const prefix = name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }

  /**
   * Rechercher des produits
   */
  async searchProducts(searchTerm) {
    const products = await this.loadAllProducts();
    const term = searchTerm.toLowerCase().trim();

    if (!term) return products;

    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term)
    ).slice(0, 10);
  }

  /**
   * Obtenir un produit par SKU
   */
  async getProductBySKU(sku) {
    const products = await this.loadAllProducts();
    return products.find(product => 
      product.sku.toLowerCase() === sku.toLowerCase()
    );
  }

  /**
   * Ajouter un nouveau produit dans Google Sheets
   */
  async addProduct(productData) {
    console.log('📝 Ajout produit dans Google Sheets:', productData);

    try {
      const newProduct = {
        sku: productData.sku || this.generateSKU(productData.name),
        name: productData.name,
        dimensions: {
          length: parseFloat(productData.length) || 0,
          width: parseFloat(productData.width) || 0,
          height: parseFloat(productData.height) || 0
        },
        weight: parseFloat(productData.weight) || 0,
        price: parseFloat(productData.price) || 0,
        dateAdded: new Date().toISOString().split('T')[0]
      };

      // Préparer les données pour Google Sheets
      const rowData = [
        newProduct.sku,
        newProduct.name,
        newProduct.dimensions.length,
        newProduct.dimensions.width,
        newProduct.dimensions.height,
        newProduct.weight,
        newProduct.price,
        newProduct.dateAdded
      ];

      // Ajouter à Google Sheets via l'API
      const success = await this.appendToGoogleSheets(rowData);

      if (success) {
        // Mettre à jour le cache local
        const products = await this.loadAllProducts();
        products.push(newProduct);

        this.cache.set('all_products', {
          data: products,
          timestamp: Date.now()
        });

        // Sauvegarder en localStorage
        this.saveToLocalStorage(products);

        console.log('✅ Produit ajouté avec succès dans Google Sheets');
        return newProduct;
      } else {
        throw new Error('Échec de l\'ajout dans Google Sheets');
      }
    } catch (error) {
      console.error('❌ Erreur ajout produit:', error);

      // Fallback: ajouter au cache local seulement
      const products = await this.loadAllProducts();
      const newProduct = {
        sku: productData.sku || this.generateSKU(productData.name),
        name: productData.name,
        dimensions: {
          length: parseFloat(productData.length) || 0,
          width: parseFloat(productData.width) || 0,
          height: parseFloat(productData.height) || 0
        },
        weight: parseFloat(productData.weight) || 0,
        price: parseFloat(productData.price) || 0,
        dateAdded: new Date().toISOString().split('T')[0]
      };

      products.push(newProduct);

      this.cache.set('all_products', {
        data: products,
        timestamp: Date.now()
      });

      this.saveToLocalStorage(products);

      console.log('⚠️ Produit ajouté au cache local seulement');
      return newProduct;
    }
  }

  /**
   * Ajouter une ligne à Google Sheets
   */
  async appendToGoogleSheets(rowData) {
    try {
      console.log('📝 Ajout ligne à Google Sheets:', rowData);

      // URL pour l'API d'ajout de Google Sheets
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${PRODUCTS_SHEETS_CONFIG.spreadsheetId}/values/${PRODUCTS_SHEETS_CONFIG.ranges.products}:append?valueInputOption=RAW&key=${PRODUCTS_SHEETS_CONFIG.apiKey}`;

      const requestBody = {
        values: [rowData]
      };

      const response = await makeRateLimitedRequest(async () => {
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      }, 'GoogleSheets-Append');

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Ligne ajoutée avec succès:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur ajout Google Sheets:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur appendToGoogleSheets:', error);
      return false;
    }
  }

  /**
   * Sauvegarder dans localStorage comme backup
   */
  saveToLocalStorage(products) {
    try {
      localStorage.setItem('bebeclick_products_backup', JSON.stringify(products));
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  }

  /**
   * Charger depuis localStorage comme backup
   */
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('bebeclick_products_backup');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Erreur chargement localStorage:', error);
      return [];
    }
  }

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    const products = await this.loadAllProducts();
    
    const totalProducts = products.length;
    const avgPrice = products.length > 0 
      ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
      : 0;
    
    const avgWeight = products.length > 0
      ? Math.round(products.reduce((sum, p) => sum + p.weight, 0) / products.length * 100) / 100
      : 0;

    return {
      totalProducts,
      avgPrice,
      avgWeight,
      lastUpdate: this.lastUpdate,
      dataSource: 'Google Sheets'
    };
  }

  /**
   * Forcer le rechargement des données
   */
  async forceReload() {
    this.cache.clear();
    return await this.loadAllProducts();
  }

  /**
   * Exporter les données en CSV
   */
  async exportToCSV() {
    const products = await this.loadAllProducts();
    const rows = ['SKU,Nom,Longueur,Largeur,Hauteur,Poids,Prix,Date'];
    
    products.forEach(product => {
      rows.push([
        product.sku,
        product.name,
        product.dimensions.length,
        product.dimensions.width,
        product.dimensions.height,
        product.weight,
        product.price,
        product.dateAdded
      ].join(','));
    });

    return rows.join('\n');
  }

  /**
   * Données de fallback en cas d'erreur Google Sheets
   */
  getFallbackProducts() {
    // Essayer de charger depuis localStorage d'abord
    const localProducts = this.loadFromLocalStorage();
    if (localProducts.length > 0) {
      console.log('📦 Utilisation backup localStorage');
      return localProducts;
    }

    // Produits d'exemple par défaut
    return [
      {
        sku: 'BEB001',
        name: 'Produit Exemple 1',
        dimensions: { length: 30, width: 20, height: 15 },
        weight: 1.5,
        price: 2500,
        dateAdded: '2024-01-01'
      },
      {
        sku: 'BEB002',
        name: 'Produit Exemple 2',
        dimensions: { length: 25, width: 25, height: 10 },
        weight: 1.0,
        price: 1800,
        dateAdded: '2024-01-01'
      }
    ];
  }

  /**
   * Forcer le rechargement des données
   */
  async forceReload() {
    console.log('🔄 Rechargement forcé des produits...');
    this.cache.clear();
    this.isLoading = false;
    return await this.loadAllProducts();
  }

  /**
   * Vérifier la connectivité Google Sheets
   */
  async testConnection() {
    try {
      console.log('🔍 Test de connexion Google Sheets...');
      console.log('🔑 Utilisation API Key:', PRODUCTS_SHEETS_CONFIG.apiKey.substring(0, 10) + '...');
      console.log('📊 Spreadsheet ID:', PRODUCTS_SHEETS_CONFIG.spreadsheetId);

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${PRODUCTS_SHEETS_CONFIG.spreadsheetId}?key=${PRODUCTS_SHEETS_CONFIG.apiKey}`;

      const response = await makeRateLimitedRequest(async () => {
        return fetch(url);
      }, 'GoogleSheets-Test');

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connexion Google Sheets réussie');
        console.log('📋 Titre du document:', data.properties?.title || 'Non disponible');
        return true;
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Réponse Google Sheets non-OK:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Test connexion Google Sheets échoué:', error);
      return false;
    }
  }
}

// Instance singleton
const productsGoogleSheetsService = new ProductsGoogleSheetsService();

export default productsGoogleSheetsService;
