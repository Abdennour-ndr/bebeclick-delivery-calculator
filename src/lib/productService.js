// Service de gestion des produits avec integration Google Sheets
class ProductService {
  constructor() {
    // Configuration Google Sheets
    this.SHEET_ID = '1upqT76F2lCYRtoensQAUPQHlQwxLn5xWvAeryWQ7DvU';
    this.API_KEY = 'AIzaSyCAx9J4hejd-vmM4xVoIqw_qNdC3AezZ90';
    
    // Base de donnees temporaire des produits
    this.mockProducts = [
      {
        id: 1,
        name: 'Poussette Premium',
        category: 'Poussettes',
        length: 85,
        width: 60,
        height: 105,
        weight: 12.5,
        sku: 'BB001',
        price: 25000
      },
      {
        id: 2,
        name: 'Siege auto enfant',
        category: 'Sieges auto',
        length: 45,
        width: 45,
        height: 65,
        weight: 8.2,
        sku: 'SA002',
        price: 18000
      },
      {
        id: 3,
        name: 'Lit bebe pliable',
        category: 'Lits',
        length: 120,
        width: 60,
        height: 85,
        weight: 15.0,
        sku: 'LB003',
        price: 22000
      },
      {
        id: 4,
        name: 'Poussette jumeaux',
        category: 'Poussettes',
        length: 90,
        width: 65,
        height: 110,
        weight: 18.5,
        sku: 'STR-002',
        price: 35000
      },
      {
        id: 5,
        name: 'Chaise haute',
        category: 'Chaises',
        length: 55,
        width: 55,
        height: 105,
        weight: 9.8,
        sku: 'CHR-001',
        price: 12000
      },
      {
        id: 6,
        name: 'Jouet educatif grand',
        category: 'Jouets',
        length: 40,
        width: 30,
        height: 25,
        weight: 3.2,
        sku: 'TOY-001',
        price: 8000
      },
      {
        id: 7,
        name: 'Velo enfant',
        category: 'Velos',
        length: 95,
        width: 45,
        height: 65,
        weight: 11.0,
        sku: 'BIK-001',
        price: 15000
      },
      {
        id: 8,
        name: 'Balancoire enfant',
        category: 'Balancoires',
        length: 110,
        width: 85,
        height: 95,
        weight: 16.5,
        sku: 'SWG-001',
        price: 28000
      },
      {
        id: 9,
        name: 'Trotteur bebe',
        category: 'Trotteurs',
        length: 70,
        width: 70,
        height: 60,
        weight: 6.5,
        sku: 'WLK-001',
        price: 9500
      },
      {
        id: 10,
        name: 'Chaise berceuse',
        category: 'Chaises',
        length: 85,
        width: 50,
        height: 65,
        weight: 7.8,
        sku: 'ROC-001',
        price: 14000
      },
      {
        id: 11,
        name: 'Landau de luxe',
        category: 'Poussettes',
        length: 95,
        width: 65,
        height: 110,
        weight: 14.2,
        sku: 'LAN-001',
        price: 32000
      },
      {
        id: 12,
        name: 'Berceau en bois',
        category: 'Lits',
        length: 100,
        width: 55,
        height: 80,
        weight: 18.5,
        sku: 'BER-001',
        price: 28000
      },
      {
        id: 13,
        name: 'Tricycle enfant',
        category: 'Velos',
        length: 80,
        width: 50,
        height: 60,
        weight: 8.5,
        sku: 'TRI-001',
        price: 12500
      },
      {
        id: 14,
        name: 'Rehausseur auto',
        category: 'Sieges auto',
        length: 35,
        width: 35,
        height: 20,
        weight: 2.8,
        sku: 'REH-001',
        price: 8500
      },
      {
        id: 15,
        name: 'Table a langer',
        category: 'Mobilier',
        length: 90,
        width: 50,
        height: 85,
        weight: 12.0,
        sku: 'TAB-001',
        price: 18000
      },
      {
        id: 16,
        name: 'Foppapedretti Poussette Premium',
        category: 'Poussettes',
        length: 88,
        width: 62,
        height: 108,
        weight: 13.5,
        sku: 'FOP-STR-001',
        price: 28000
      },
      {
        id: 17,
        name: 'Foppapedretti Chaise haute',
        category: 'Chaises',
        length: 58,
        width: 58,
        height: 110,
        weight: 11.2,
        sku: 'FOP-CHR-001',
        price: 15000
      },
      {
        id: 18,
        name: 'Foppapedretti Lit bebe',
        category: 'Lits',
        length: 125,
        width: 65,
        height: 90,
        weight: 16.8,
        sku: 'FOP-BED-001',
        price: 24000
      },
      {
        id: 19,
        name: 'Foppapedretti Table langer',
        category: 'Mobilier',
        length: 95,
        width: 55,
        height: 88,
        weight: 14.5,
        sku: 'FOP-TAB-001',
        price: 22000
      },
      {
        id: 20,
        name: 'Foppapedretti Siege auto',
        category: 'Sieges auto',
        length: 48,
        width: 48,
        height: 68,
        weight: 9.5,
        sku: 'FOP-CAR-001',
        price: 19500
      },
      {
        id: 21,
        name: 'Brevi Siege auto Premium',
        category: 'Sieges auto',
        length: 46,
        width: 46,
        height: 66,
        weight: 8.8,
        sku: 'BRE-CAR-001',
        price: 17500
      },
      {
        id: 22,
        name: 'Brevi Chaise haute',
        category: 'Chaises',
        length: 56,
        width: 56,
        height: 108,
        weight: 10.5,
        sku: 'BRE-CHR-001',
        price: 14500
      },
      {
        id: 23,
        name: 'Berceau Brevi Nanna Oh',
        category: 'Lits',
        length: 95,
        width: 55,
        height: 75,
        weight: 12.8,
        sku: 'BRE-BER-002',
        price: 16800
      }
    ];
  }

  // Recherche flexible des produits
  async searchProducts(query) {
    console.log('Recherche des produits:', query);

    if (!query || query.length < 1) {
      return [];
    }

    try {
      // Essayer d'abord Google Sheets API
      const products = await this.fetchFromGoogleSheets(query);

      if (products.length > 0) {
        console.log('Produits trouves depuis Google Sheets:', products.length);
        return this.flexibleSearch(products, query);
      }

      // Fallback vers les donnees temporaires + produits manuels
      const allProducts = this.getAllProducts();
      const filtered = this.flexibleSearch(allProducts, query);

      console.log('Produits trouves (donnees locales):', filtered.length);
      return filtered;

    } catch (error) {
      console.error('Erreur lors de la recherche des produits:', error);

      // En cas d'erreur, utiliser les donnees locales + produits manuels
      const allProducts = this.getAllProducts();
      const filtered = this.flexibleSearch(allProducts, query);
      return filtered;
    }
  }

  // Recherche flexible et intelligente
  flexibleSearch(products, query) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    console.log('Recherche flexible pour:', query, 'Termes:', searchTerms, 'Produits disponibles:', products.length);

    const results = products.filter(product => {
      const searchableText = [
        product.name,
        product.category,
        product.sku,
        // Extraire la marque du nom du produit
        this.extractBrand(product.name),
        // Ajouter des mots-cles supplementaires
        this.getProductKeywords(product)
      ].join(' ').toLowerCase();

      // Recherche intelligente: TOUS les termes doivent correspondre
      return searchTerms.every(term => {
        const productName = product.name.toLowerCase();
        const productSku = (product.sku || '').toLowerCase();
        const productCategory = product.category.toLowerCase();

        // 1. Recherche exacte dans le SKU (priorite maximale)
        if (productSku && (productSku === term || productSku.includes(term))) {
          return true;
        }

        // 2. Recherche directe dans le nom du produit (n'importe ou dans le nom)
        if (productName.includes(term)) {
          return true;
        }

        // 3. Recherche dans chaque mot du nom du produit
        const nameWords = productName.split(/[\s\-_]+/); // Diviser par espaces, tirets, underscores
        const wordFound = nameWords.some(word => {
          // Mot exact
          if (word === term) return true;
          // Mot qui commence par le terme
          if (word.startsWith(term)) return true;
          // Mot qui contient le terme (pour des mots comme "nanna" dans le milieu)
          if (term.length >= 3 && word.includes(term)) return true;
          return false;
        });

        if (wordFound) return true;

        // 4. Recherche dans la categorie (seulement si c'est le seul terme de recherche)
        if (searchTerms.length === 1 && productCategory.includes(term)) {
          return true;
        }

        // 5. Recherche dans les mots-cles de categorie (correspondance exacte)
        if (term.length >= 3) {
          const keywords = this.getProductKeywords(product).toLowerCase();
          const keywordList = keywords.split(' ');

          // Correspondance exacte avec un mot-cle
          if (keywordList.includes(term)) {
            return true;
          }
        }

        return false;
      });
    });

    const sortedResults = results.sort((a, b) => {
      // Trier par pertinence
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });

    console.log('Resultats trouves:', sortedResults.length, sortedResults.map(p => `${p.name} (${p.sku})`));
    return sortedResults;
  }

  // Extraire la marque du nom du produit
  extractBrand(productName) {
    const brands = [];
    const name = productName.toLowerCase();

    // Liste des marques connues avec leurs variations
    const knownBrands = [
      'foppapedretti', 'chicco', 'maxi-cosi', 'cybex', 'britax',
      'joie', 'graco', 'quinny', 'bugaboo', 'stokke', 'babyzen',
      'inglesina', 'peg-perego', 'cam', 'brevi', 'safety'
    ];

    // Chercher les marques dans le nom
    knownBrands.forEach(brand => {
      if (name.includes(brand)) {
        brands.push(brand);
        // Ajouter toutes les variations possibles pour la recherche
        for (let i = 3; i <= brand.length; i++) {
          brands.push(brand.substring(0, i));
        }
      }
    });

    // Extraire le premier mot comme marque potentielle
    const firstWord = name.split(' ')[0];
    if (firstWord.length > 3) {
      brands.push(firstWord);
      // Ajouter aussi les variations du premier mot
      for (let i = 3; i <= firstWord.length; i++) {
        brands.push(firstWord.substring(0, i));
      }
    }

    return brands.join(' ');
  }

  // Verifier si deux mots de marque sont similaires
  isSimilarBrand(word1, word2) {
    // Si l'un commence par l'autre
    if (word1.startsWith(word2) || word2.startsWith(word1)) {
      return true;
    }

    // Distance de Levenshtein simplifiee pour les marques
    if (Math.abs(word1.length - word2.length) <= 2) {
      let matches = 0;
      const minLength = Math.min(word1.length, word2.length);

      for (let i = 0; i < minLength; i++) {
        if (word1[i] === word2[i]) {
          matches++;
        }
      }

      // Si au moins 70% des caracteres correspondent
      return (matches / minLength) >= 0.7;
    }

    return false;
  }

  // Generer des mots-cles supplementaires pour chaque produit
  getProductKeywords(product) {
    const keywords = [];

    // Mots-cles bases sur la categorie
    const categoryKeywords = {
      'Poussettes': ['poussette', 'landau', 'buggy', 'stroller', 'promenade', 'sortie'],
      'Sieges auto': ['siege', 'auto', 'voiture', 'securite', 'carseat', 'rehausseur', 'transport'],
      'Lits': ['lit', 'berceau', 'couchage', 'dormir', 'sommeil', 'nuit'],
      'Chaises': ['chaise', 'assise', 'manger', 'haute', 'repas', 'berceuse'],
      'Jouets': ['jouet', 'jeu', 'educatif', 'eveil', 'apprentissage', 'divertissement'],
      'Velos': ['velo', 'tricycle', 'roulant', 'pedale', 'roue'],
      'Balancoires': ['balancoire', 'bascule', 'oscillant', 'mouvement'],
      'Trotteurs': ['trotteur', 'marche', 'mobilite', 'premiers pas'],
      'Mobilier': ['meuble', 'table', 'langer', 'rangement', 'chambre']
    };

    if (categoryKeywords[product.category]) {
      keywords.push(...categoryKeywords[product.category]);
    }

    // Mots-cles bases sur les caracteristiques
    if (product.weight > 15) keywords.push('lourd', 'grand');
    if (product.weight < 5) keywords.push('leger', 'petit');
    if (product.length > 100) keywords.push('long', 'grand');
    if (product.height > 100) keywords.push('haut', 'grand');

    // Mots-cles bases sur le prix
    if (product.price > 20000) keywords.push('premium', 'luxe', 'cher');
    if (product.price < 10000) keywords.push('economique', 'abordable');

    return keywords.join(' ');
  }

  // Calculer le score de pertinence
  calculateRelevanceScore(product, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    const productName = product.name.toLowerCase();
    const productSku = product.sku.toLowerCase();
    const queryWords = queryLower.split(' ');

    // Score maximum pour correspondance SKU exacte
    if (productSku === queryLower) score += 1000;

    // Score eleve pour correspondance SKU partielle
    if (productSku.includes(queryLower)) score += 500;

    // Score pour correspondance exacte de tous les mots dans le nom
    const allWordsMatch = queryWords.every(word => productName.includes(word));
    if (allWordsMatch) score += 200;

    // Score pour correspondance de marque au debut du nom
    const firstWord = productName.split(' ')[0];
    queryWords.forEach(queryWord => {
      if (firstWord === queryWord) score += 150;
      if (firstWord.startsWith(queryWord) && queryWord.length >= 4) score += 100;
    });

    // Score pour correspondance dans le nom
    queryWords.forEach(queryWord => {
      if (productName.includes(queryWord)) score += 50;
    });

    // Penalite si le produit contient des mots non recherches
    const productWords = productName.split(' ');
    const extraWords = productWords.filter(word =>
      !queryWords.some(qWord => word.includes(qWord) || qWord.includes(word))
    );
    score -= extraWords.length * 5;

    return Math.max(0, score);
  }

  // Recuperer toutes les donnees depuis Google Sheets
  async fetchFromGoogleSheets(query) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/Products!A:I?key=${this.API_KEY}`;

    try {
      console.log('Appel API Google Sheets:', url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Reponse Google Sheets:', data);

      if (data.values && data.values.length > 1) {
        const [headers, ...rows] = data.values;
        const products = rows
          .filter(row => row.length >= 7) // Au moins 7 colonnes (jusqu'au SKU)
          .map((row, index) => ({
            id: row[0] || `SHEET_${index + 1}`,
            name: (row[1] || '').trim(),
            category: (row[2] || '').trim(),
            length: parseFloat(row[3]) || 0,
            width: parseFloat(row[4]) || 0,
            height: parseFloat(row[5]) || 0,
            weight: parseFloat(row[6]) || 0,
            sku: (row[7] || '').trim(),
            price: parseFloat(row[8]) || 0
          }))
          .filter(product => product.name && product.name.length > 0); // Garder seulement les produits avec un nom

        return products; // Retourner tous les produits, le filtrage se fera dans flexibleSearch
      }

      return [];
    } catch (error) {
      console.error('Erreur lors de la recuperation depuis Google Sheets:', error);
      throw error;
    }
  }

  // Obtenir un produit par ID
  async getProductById(id) {
    return this.mockProducts.find(product => product.id === id);
  }

  // Obtenir toutes les categories
  getCategories() {
    const categories = [...new Set(this.mockProducts.map(p => p.category))];
    return categories.sort();
  }

  // Ajouter un nouveau produit (futur)
  async addProduct(productData) {
    // A implementer avec Google Sheets API
    console.log('Ajout nouveau produit:', productData);
    return { success: true, message: 'Produit ajoute avec succes' };
  }

  // Mettre a jour un produit (futur)
  async updateProduct(id, productData) {
    // A implementer avec Google Sheets API
    console.log('Mise a jour produit:', id, productData);
    return { success: true, message: 'Produit mis a jour avec succes' };
  }

  // Sauvegarder un produit saisi manuellement
  saveManualProduct(productData) {
    try {
      // Recuperer les produits sauvegardes du localStorage
      const savedProducts = this.getSavedProducts();

      // Generer un ID unique
      const newId = 'MANUAL_' + Date.now();

      // Creer le nouveau produit
      const newProduct = {
        id: newId,
        name: productData.name || 'Produit manuel',
        category: productData.category || 'Manuel',
        length: parseFloat(productData.length) || 0,
        width: parseFloat(productData.width) || 0,
        height: parseFloat(productData.height) || 0,
        weight: parseFloat(productData.weight) || 0,
        sku: productData.sku || newId,
        price: parseFloat(productData.price) || 0,
        isManual: true,
        dateAdded: new Date().toISOString()
      };

      // Ajouter le nouveau produit
      savedProducts.push(newProduct);

      // Limiter a 50 produits manuels maximum
      if (savedProducts.length > 50) {
        savedProducts.shift(); // Supprimer le plus ancien
      }

      // Sauvegarder dans localStorage
      localStorage.setItem('manualProducts', JSON.stringify(savedProducts));

      console.log('Produit manuel sauvegarde:', newProduct);
      return { success: true, product: newProduct };

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return { success: false, error: error.message };
    }
  }

  // Recuperer les produits sauvegardes
  getSavedProducts() {
    try {
      const saved = localStorage.getItem('manualProducts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Erreur lors de la recuperation des produits sauvegardes:', error);
      return [];
    }
  }

  // Supprimer un produit manuel
  deleteManualProduct(productId) {
    try {
      const savedProducts = this.getSavedProducts();
      const filtered = savedProducts.filter(p => p.id !== productId);
      localStorage.setItem('manualProducts', JSON.stringify(filtered));
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return { success: false, error: error.message };
    }
  }

  // Inclure les produits manuels dans la recherche
  getAllProducts() {
    const savedProducts = this.getSavedProducts();
    return [...this.mockProducts, ...savedProducts];
  }
}

export default new ProductService();
