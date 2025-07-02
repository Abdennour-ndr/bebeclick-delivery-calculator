/**
 * Service pour la gestion des tarifs Yalidine via Google Sheets
 * Permet la synchronisation en temps réel entre tous les utilisateurs
 */

// Configuration Google Sheets pour les tarifs Yalidine
const YALIDINE_SHEETS_CONFIG = {
  apiKey: 'AIzaSyCAx9J4hejd-vmM4xVoIqw_qNdC3AezZ90', // Nouveau mfتاح API
  spreadsheetId: '1INMkR43xyRIlHn1X_ilhAs12uxwoUTb_', // ID du fichier fees.xlsx converti
  ranges: {
    pricing: 'Tarifs!A:E', // Colonnes: Wilaya Code, Wilaya Name, Commune, Office Price, Home Price
    metadata: 'Metadata!A:B' // Informations sur les dernières mises à jour
  }
};

class YalidineGoogleSheetsService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 2 * 60 * 1000; // 2 minutes pour les tarifs
    this.isLoading = false;
    this.lastUpdate = null;
  }

  /**
   * Charger tous les tarifs depuis Google Sheets
   */
  async loadAllPricing() {
    if (this.isLoading) {
      return this.waitForLoading();
    }

    const cacheKey = 'all_pricing';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    this.isLoading = true;

    try {
      console.log('🔄 Chargement des tarifs Yalidine depuis Google Sheets...');
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${YALIDINE_SHEETS_CONFIG.spreadsheetId}/values/${YALIDINE_SHEETS_CONFIG.ranges.pricing}?key=${YALIDINE_SHEETS_CONFIG.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur Google Sheets: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];
      
      if (rows.length === 0) {
        throw new Error('Aucune donnée trouvée dans Google Sheets');
      }

      // Convertir les données en format utilisable
      const pricing = this.parseSheetData(rows);
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        data: pricing,
        timestamp: Date.now()
      });

      this.lastUpdate = new Date().toISOString();
      console.log(`✅ ${Object.keys(pricing).length} wilayas chargées depuis Google Sheets`);
      
      return pricing;
    } catch (error) {
      console.error('❌ Erreur chargement tarifs Yalidine:', error);
      
      // Retourner les données de fallback en cas d'erreur
      return this.getFallbackData();
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
    return this.cache.get('all_pricing')?.data || this.getFallbackData();
  }

  /**
   * Parser les données du Google Sheet
   */
  parseSheetData(rows) {
    const pricing = {};
    
    // Ignorer la première ligne (headers)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 5) {
        const [wilayaCode, wilayaName, communeName, officePrice, homePrice] = row;
        
        // Nettoyer et valider les données
        const cleanWilayaCode = String(wilayaCode).trim().padStart(2, '0');
        const cleanWilayaName = String(wilayaName).trim();
        const cleanCommuneName = String(communeName).trim();
        const cleanOfficePrice = parseInt(officePrice) || 0;
        const cleanHomePrice = parseInt(homePrice) || 0;
        
        if (cleanWilayaCode && cleanWilayaName && cleanCommuneName && cleanOfficePrice && cleanHomePrice) {
          // Initialiser la wilaya si elle n'existe pas
          if (!pricing[cleanWilayaCode]) {
            pricing[cleanWilayaCode] = {
              name: cleanWilayaName,
              communes: {}
            };
          }
          
          // Ajouter la commune
          pricing[cleanWilayaCode].communes[cleanCommuneName] = {
            office: cleanOfficePrice,
            home: cleanHomePrice
          };
        }
      }
    }
    
    return pricing;
  }

  /**
   * Obtenir toutes les wilayas
   */
  async getAllWilayas() {
    const pricing = await this.loadAllPricing();
    
    return Object.entries(pricing).map(([code, data]) => ({
      code,
      name: data.name,
      communeCount: Object.keys(data.communes).length
    })).sort((a, b) => a.code.localeCompare(b.code));
  }

  /**
   * Obtenir les communes d'une wilaya
   */
  async getCommunesByWilaya(wilayaCode) {
    const pricing = await this.loadAllPricing();
    const wilaya = pricing[wilayaCode];
    
    if (!wilaya) return [];

    return Object.entries(wilaya.communes).map(([name, prices]) => ({
      name,
      office: prices.office,
      home: prices.home
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Obtenir le prix de livraison
   */
  async getDeliveryPrice(wilayaCode, communeName, deliveryType = 'home') {
    const pricing = await this.loadAllPricing();
    const wilaya = pricing[wilayaCode];
    
    if (!wilaya) return null;

    const commune = wilaya.communes[communeName];
    if (!commune) return null;

    return commune[deliveryType] || commune.home;
  }

  /**
   * Rechercher une commune dans toutes les wilayas
   */
  async searchCommune(searchTerm) {
    const pricing = await this.loadAllPricing();
    const results = [];
    const term = searchTerm.toLowerCase().trim();

    if (!term) return results;

    Object.entries(pricing).forEach(([wilayaCode, wilayaData]) => {
      Object.entries(wilayaData.communes).forEach(([communeName, prices]) => {
        if (communeName.toLowerCase().includes(term)) {
          results.push({
            wilayaCode,
            wilayaName: wilayaData.name,
            communeName,
            office: prices.office,
            home: prices.home,
            score: this.calculateMatchScore(term, communeName.toLowerCase())
          });
        }
      });
    });

    // Trier par score de correspondance
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  /**
   * Calculer le score de correspondance pour le tri
   */
  calculateMatchScore(searchTerm, communeName) {
    if (communeName === searchTerm) return 100;
    if (communeName.startsWith(searchTerm)) return 90;
    if (communeName.includes(searchTerm)) return 70;
    return 50;
  }

  /**
   * Rechercher le prix par destination (format: "Commune, Wilaya" ou "Commune, Country")
   */
  async searchPriceByDestination(destination, deliveryType = 'home') {
    if (!destination) return null;

    console.log(`🔍 Recherche prix pour: "${destination}" (${deliveryType})`);

    const parts = destination.split(',').map(s => s.trim());

    if (parts.length < 2) {
      // Recherche simple par nom de commune
      const results = await this.searchCommune(parts[0]);
      if (results.length > 0) {
        console.log(`✅ Prix trouvé par commune: ${results[0][deliveryType]} DA`);
        return results[0][deliveryType];
      }
      return null;
    }

    let [communeName, locationName] = parts;

    // Nettoyer les noms pour la recherche
    communeName = this.cleanSearchTerm(communeName);
    locationName = this.cleanSearchTerm(locationName);

    console.log(`🔍 Recherche: commune="${communeName}", location="${locationName}"`);

    const pricing = await this.loadAllPricing();

    // Stratégie 1: Recherche directe par nom de wilaya
    let targetWilayaCode = this.findWilayaByName(pricing, locationName);

    // Stratégie 2: Si pas trouvé et locationName contient "Algeria", rechercher par commune
    if (!targetWilayaCode && locationName.toLowerCase().includes('algeria')) {
      console.log(`🔍 Recherche par commune car location="${locationName}" contient Algeria`);
      const results = await this.searchCommune(communeName);
      if (results.length > 0) {
        console.log(`✅ Prix trouvé par recherche commune: ${results[0][deliveryType]} DA`);
        return results[0][deliveryType];
      }
    }

    // Stratégie 3: Recherche par correspondance partielle de wilaya
    if (!targetWilayaCode) {
      targetWilayaCode = this.findWilayaByPartialMatch(pricing, locationName);
    }

    if (!targetWilayaCode) {
      console.log(`❌ Wilaya non trouvée pour: "${locationName}"`);
      // Fallback: recherche par commune seulement
      const results = await this.searchCommune(communeName);
      if (results.length > 0) {
        console.log(`✅ Prix fallback par commune: ${results[0][deliveryType]} DA`);
        return results[0][deliveryType];
      }
      return null;
    }

    console.log(`✅ Wilaya trouvée: ${targetWilayaCode} (${pricing[targetWilayaCode].name})`);

    // Rechercher la commune dans la wilaya trouvée
    const wilaya = pricing[targetWilayaCode];
    const commune = this.findCommuneInWilaya(wilaya, communeName);

    if (commune) {
      const price = wilaya.communes[commune][deliveryType];
      console.log(`✅ Prix final trouvé: ${price} DA pour ${commune}, ${wilaya.name}`);
      return price;
    }

    console.log(`❌ Commune "${communeName}" non trouvée dans ${wilaya.name}`);
    return null;
  }

  /**
   * Nettoyer les termes de recherche
   */
  cleanSearchTerm(term) {
    return term
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
      .replace(/\s+/g, ' '); // Normaliser les espaces
  }

  /**
   * Trouver une wilaya par nom exact
   */
  findWilayaByName(pricing, locationName) {
    const cleanLocation = this.cleanSearchTerm(locationName);

    return Object.keys(pricing).find(code => {
      const wilayaName = this.cleanSearchTerm(pricing[code].name);
      return wilayaName === cleanLocation || wilayaName.includes(cleanLocation);
    });
  }

  /**
   * Trouver une wilaya par correspondance partielle
   */
  findWilayaByPartialMatch(pricing, locationName) {
    const cleanLocation = this.cleanSearchTerm(locationName);

    // Recherche par correspondance partielle
    return Object.keys(pricing).find(code => {
      const wilayaName = this.cleanSearchTerm(pricing[code].name);
      return wilayaName.includes(cleanLocation) || cleanLocation.includes(wilayaName);
    });
  }

  /**
   * Trouver une commune dans une wilaya
   */
  findCommuneInWilaya(wilaya, communeName) {
    const cleanCommuneName = this.cleanSearchTerm(communeName);

    // Recherche exacte d'abord
    let commune = Object.keys(wilaya.communes).find(name =>
      this.cleanSearchTerm(name) === cleanCommuneName
    );

    if (commune) return commune;

    // Recherche par correspondance partielle
    commune = Object.keys(wilaya.communes).find(name => {
      const cleanName = this.cleanSearchTerm(name);
      return cleanName.includes(cleanCommuneName) || cleanCommuneName.includes(cleanName);
    });

    if (commune) return commune;

    // Recherche par mots-clés (pour "Oran" -> "Oran" dans la wilaya Oran)
    commune = Object.keys(wilaya.communes).find(name => {
      const cleanName = this.cleanSearchTerm(name);
      const communeWords = cleanCommuneName.split(' ');
      return communeWords.some(word => word.length > 2 && cleanName.includes(word));
    });

    return commune;
  }

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    const pricing = await this.loadAllPricing();
    const wilayas = Object.keys(pricing).length;
    let totalCommunes = 0;
    let avgOfficePrice = 0;
    let avgHomePrice = 0;
    let priceCount = 0;

    Object.values(pricing).forEach(wilaya => {
      const communes = Object.values(wilaya.communes);
      totalCommunes += communes.length;
      
      communes.forEach(commune => {
        avgOfficePrice += commune.office;
        avgHomePrice += commune.home;
        priceCount++;
      });
    });

    return {
      wilayas,
      totalCommunes,
      avgOfficePrice: priceCount > 0 ? Math.round(avgOfficePrice / priceCount) : 0,
      avgHomePrice: priceCount > 0 ? Math.round(avgHomePrice / priceCount) : 0,
      lastUpdate: this.lastUpdate,
      dataSource: 'Google Sheets'
    };
  }

  /**
   * Forcer le rechargement des données
   */
  async forceReload() {
    this.cache.clear();
    return await this.loadAllPricing();
  }

  /**
   * Exporter les données en CSV
   */
  async exportToCSV() {
    const pricing = await this.loadAllPricing();
    const rows = ['Wilaya Code,Wilaya Name,Commune,Office Price,Home Price'];
    
    Object.entries(pricing).forEach(([wilayaCode, wilayaData]) => {
      Object.entries(wilayaData.communes).forEach(([communeName, prices]) => {
        rows.push(`${wilayaCode},${wilayaData.name},${communeName},${prices.office},${prices.home}`);
      });
    });

    return rows.join('\n');
  }

  /**
   * Données de fallback en cas d'erreur Google Sheets
   */
  getFallbackData() {
    return {
      "16": {
        name: "Alger",
        communes: {
          "Alger Centre": { office: 400, home: 550 },
          "Alger": { office: 400, home: 550 },
          "Bab El Oued": { office: 400, home: 550 },
          "El Harrach": { office: 400, home: 550 },
          "Hussein Dey": { office: 400, home: 550 },
          "Kouba": { office: 400, home: 550 }
        }
      },
      "31": {
        name: "Oran",
        communes: {
          "Oran": { office: 450, home: 650 },
          "Es Senia": { office: 450, home: 650 },
          "Bir El Djir": { office: 450, home: 650 },
          "Gdyel": { office: 450, home: 650 },
          "Hassi Bounif": { office: 450, home: 650 },
          "Arzew": { office: 450, home: 650 }
        }
      },
      "25": {
        name: "Constantine",
        communes: {
          "Constantine": { office: 450, home: 650 },
          "El Khroub": { office: 450, home: 650 },
          "Hamma Bouziane": { office: 450, home: 650 }
        }
      },
      "09": {
        name: "Blida",
        communes: {
          "Blida": { office: 400, home: 550 },
          "Boufarik": { office: 400, home: 550 },
          "Larbaâ": { office: 400, home: 550 }
        }
      }
    };
  }

  /**
   * Vérifier la connectivité Google Sheets
   */
  async testConnection() {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${YALIDINE_SHEETS_CONFIG.spreadsheetId}?key=${YALIDINE_SHEETS_CONFIG.apiKey}`;
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.error('Test connexion Google Sheets échoué:', error);
      return false;
    }
  }
}

// Instance singleton
const yalidineGoogleSheetsService = new YalidineGoogleSheetsService();

export default yalidineGoogleSheetsService;
