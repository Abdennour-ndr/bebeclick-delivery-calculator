/**
 * Serveur simple pour tester MongoDB
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'BebeClick MongoDB API - Version Simple',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API MongoDB fonctionne!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware d'erreur
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Route non trouvée
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur simple démarré sur le port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📋 Test: http://localhost:${PORT}/api/test`);
});

export default app;
