/**
 * Serveur Express pour l'API MongoDB de BebeClick Delivery Calculator
 * Fournit les endpoints REST pour la gestion des données
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase, getDatabaseStatus } from './src/config/database.js';
import { initializeAllServices, checkServicesHealth } from './src/services/mongoServices.js';

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://calc-bebeclick.surge.sh'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'BebeClick Delivery Calculator - API MongoDB',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      database: '/api/database',
      deliveryPricing: '/api/delivery-pricing',
      products: '/api/products',
      locations: '/api/locations',
      settings: '/api/settings'
    }
  });
});

// Route de santé
app.get('/health', async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    const servicesHealth = await checkServicesHealth();
    
    const health = {
      status: dbStatus.state === 'connected' && servicesHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus.state,
        host: dbStatus.host,
        port: dbStatus.port,
        name: dbStatus.name
      },
      services: servicesHealth.services,
      uptime: process.uptime()
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route d'information sur la base de données
app.get('/api/database', async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    
    res.json({
      status: dbStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération du statut de la base de données',
      message: error.message
    });
  }
});

// Routes API simples pour commencer
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API MongoDB fonctionne!',
    timestamp: new Date().toISOString()
  });
});

// TODO: Ajouter les routes API complètes plus tard
// import deliveryPricingRoutes from './src/api/deliveryPricingRoutes.js';
// import productRoutes from './src/api/productRoutes.js';
// import locationRoutes from './src/api/locationRoutes.js';
// import settingsRoutes from './src/api/settingsRoutes.js';

// app.use('/api/delivery-pricing', deliveryPricingRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/locations', locationRoutes);
// app.use('/api/settings', settingsRoutes);

// Middleware de gestion d'erreurs
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  
  res.status(error.status || 500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue',
    timestamp: new Date().toISOString()
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Fonction de démarrage du serveur
async function startServer() {
  try {
    console.log('🚀 Démarrage du serveur BebeClick API...');
    
    // Connexion à MongoDB
    console.log('📊 Connexion à MongoDB...');
    await connectToDatabase();
    
    // Initialisation des services
    console.log('⚙️ Initialisation des services...');
    await initializeAllServices();
    
    // Démarrage du serveur HTTP
    const server = app.listen(PORT, () => {
      console.log(`✅ Serveur démarré avec succès`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Base de données: ${getDatabaseStatus().state}`);
      console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}`);
    });
    
    // Gestion propre de l'arrêt
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Signal ${signal} reçu, arrêt en cours...`);
      
      server.close(async () => {
        console.log('🔌 Serveur HTTP fermé');
        
        try {
          // Fermer la connexion MongoDB
          const { disconnectFromDatabase } = await import('./src/config/database.js');
          await disconnectFromDatabase();
          console.log('📊 Connexion MongoDB fermée');
        } catch (error) {
          console.error('❌ Erreur lors de la fermeture MongoDB:', error);
        }
        
        console.log('👋 Arrêt terminé');
        process.exit(0);
      });
      
      // Forcer l'arrêt après 10 secondes
      setTimeout(() => {
        console.error('⏰ Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };
    
    // Écouter les signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      console.error('💥 Exception non capturée:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Promesse rejetée non gérée:', reason);
      console.error('À:', promise);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('💥 Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Démarrer le serveur si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;
