/**
 * Configuration MongoDB pour BebeClick Delivery Calculator
 * Gestion de la connexion et des paramètres de base de données
 */

import mongoose from 'mongoose';

// Configuration MongoDB
export const DATABASE_CONFIG = {
  // URL de connexion MongoDB (configuration côté serveur uniquement)
  mongoUri: import.meta.env?.VITE_MONGODB_URI || 'mongodb://localhost:27017/bebeclick-delivery',
  
  // Options de connexion Mongoose
  options: {
    // Nouvelle syntaxe de connexion
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
    // Paramètres de performance
    maxPoolSize: 10, // Maintenir jusqu'à 10 connexions socket
    serverSelectionTimeoutMS: 5000, // Garder en essayant d'envoyer des opérations pendant 5 secondes
    socketTimeoutMS: 45000, // Fermer les sockets après 45 secondes d'inactivité
    bufferMaxEntries: 0, // Désactiver mongoose buffering
    bufferCommands: false, // Désactiver mongoose buffering
    
    // Paramètres de reconnexion
    heartbeatFrequencyMS: 10000, // Vérifier la connexion toutes les 10 secondes
    retryWrites: true,
    
    // Index et schéma
    autoIndex: true, // Construire les index automatiquement
    autoCreate: true, // Créer les collections automatiquement
  },
  
  // Noms des collections
  collections: {
    deliveryPricing: 'delivery_pricing',
    locations: 'locations',
    products: 'products',
    settings: 'settings',
    users: 'users',
    logs: 'logs'
  },
  
  // Configuration de développement
  development: {
    debug: true,
    logQueries: true
  },
  
  // Configuration de production
  production: {
    debug: false,
    logQueries: false
  }
};

// Instance de connexion MongoDB
let mongoConnection = null;

/**
 * Établir la connexion MongoDB
 */
export const connectToDatabase = async () => {
  try {
    if (mongoConnection && mongoose.connection.readyState === 1) {
      console.log('📊 MongoDB: Connexion existante réutilisée');
      return mongoConnection;
    }

    console.log('📊 MongoDB: Tentative de connexion...');
    console.log(`🔗 URI: ${DATABASE_CONFIG.mongoUri.replace(/\/\/.*@/, '//***:***@')}`);

    // Configurer les événements de connexion
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB: Connexion établie avec succès');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB: Erreur de connexion:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB: Connexion fermée');
    });

    // Établir la connexion
    mongoConnection = await mongoose.connect(DATABASE_CONFIG.mongoUri, DATABASE_CONFIG.options);
    
    // Activer le debug en développement
    if (process.env.NODE_ENV !== 'production' && DATABASE_CONFIG.development.debug) {
      mongoose.set('debug', DATABASE_CONFIG.development.logQueries);
    }

    console.log('🎉 MongoDB: Prêt pour les opérations');
    return mongoConnection;

  } catch (error) {
    console.error('💥 MongoDB: Échec de la connexion:', error);
    throw error;
  }
};

/**
 * Fermer la connexion MongoDB
 */
export const disconnectFromDatabase = async () => {
  try {
    if (mongoConnection) {
      await mongoose.connection.close();
      mongoConnection = null;
      console.log('👋 MongoDB: Connexion fermée proprement');
    }
  } catch (error) {
    console.error('❌ MongoDB: Erreur lors de la fermeture:', error);
    throw error;
  }
};

/**
 * Vérifier l'état de la connexion
 */
export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};

/**
 * Initialiser la base de données avec des données par défaut
 */
export const initializeDatabase = async () => {
  try {
    console.log('🔧 MongoDB: Initialisation de la base de données...');
    
    // Vérifier la connexion
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }

    // Créer les index nécessaires
    await createIndexes();
    
    console.log('✅ MongoDB: Base de données initialisée');
    return true;

  } catch (error) {
    console.error('❌ MongoDB: Erreur d\'initialisation:', error);
    throw error;
  }
};

/**
 * Créer les index pour optimiser les performances
 */
const createIndexes = async () => {
  try {
    console.log('📇 MongoDB: Création des index...');
    
    // Index pour les prix de livraison
    await mongoose.connection.db.collection(DATABASE_CONFIG.collections.deliveryPricing)
      .createIndex({ service: 1, wilaya: 1, commune: 1 }, { unique: true });
    
    // Index pour les locations
    await mongoose.connection.db.collection(DATABASE_CONFIG.collections.locations)
      .createIndex({ type: 1, code: 1 }, { unique: true });
    
    // Index pour les produits
    await mongoose.connection.db.collection(DATABASE_CONFIG.collections.products)
      .createIndex({ sku: 1 }, { unique: true });
    await mongoose.connection.db.collection(DATABASE_CONFIG.collections.products)
      .createIndex({ name: 'text', brand: 'text' });
    
    console.log('✅ MongoDB: Index créés avec succès');

  } catch (error) {
    console.error('❌ MongoDB: Erreur lors de la création des index:', error);
    // Ne pas faire échouer l'initialisation pour les erreurs d'index
  }
};

// Gestion propre de la fermeture de l'application
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt de l\'application...');
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt de l\'application (SIGTERM)...');
  await disconnectFromDatabase();
  process.exit(0);
});

export default {
  connect: connectToDatabase,
  disconnect: disconnectFromDatabase,
  status: getDatabaseStatus,
  initialize: initializeDatabase,
  config: DATABASE_CONFIG
};
