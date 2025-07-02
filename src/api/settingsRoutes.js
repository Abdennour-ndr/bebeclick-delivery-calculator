/**
 * Routes API pour la gestion des paramètres système
 * Endpoints CRUD pour la configuration de l'application
 */

import express from 'express';
import { mongoSettingsService } from '../services/mongoServices.js';

const router = express.Router();

/**
 * GET /api/settings
 * Obtenir tous les paramètres avec leurs métadonnées
 */
router.get('/', async (req, res) => {
  try {
    const { environment = 'all' } = req.query;
    
    const settings = await mongoSettingsService.getAllSettingsWithMetadata(environment);

    res.json({
      success: true,
      data: settings,
      environment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /settings:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des paramètres',
      message: error.message
    });
  }
});

/**
 * GET /api/settings/category/:category
 * Obtenir tous les paramètres d'une catégorie
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { environment = 'all' } = req.query;
    
    const settings = await mongoSettingsService.getSettingsByCategory(category, environment);

    res.json({
      success: true,
      data: settings,
      category,
      environment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur GET /settings/category/${req.params.category}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la catégorie',
      message: error.message
    });
  }
});

/**
 * GET /api/settings/api-keys
 * Obtenir les clés API (valeurs masquées pour sécurité)
 */
router.get('/api-keys', async (req, res) => {
  try {
    const apiKeys = await mongoSettingsService.getApiKeys();
    
    // Masquer les valeurs sensibles
    const maskedApiKeys = {};
    Object.keys(apiKeys).forEach(key => {
      const value = apiKeys[key];
      maskedApiKeys[key] = value ? `${value.substring(0, 8)}...` : '';
    });

    res.json({
      success: true,
      data: maskedApiKeys,
      note: 'Valeurs masquées pour sécurité',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /settings/api-keys:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des clés API',
      message: error.message
    });
  }
});

/**
 * GET /api/settings/delivery-services
 * Obtenir la configuration des services de livraison
 */
router.get('/delivery-services', async (req, res) => {
  try {
    const config = await mongoSettingsService.getDeliveryServicesConfig();

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /settings/delivery-services:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la config des services',
      message: error.message
    });
  }
});

/**
 * GET /api/settings/pricing
 * Obtenir les paramètres de tarification
 */
router.get('/pricing', async (req, res) => {
  try {
    const config = await mongoSettingsService.getPricingConfig();

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /settings/pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la config de tarification',
      message: error.message
    });
  }
});

/**
 * GET /api/settings/ui
 * Obtenir les paramètres d'interface utilisateur
 */
router.get('/ui', async (req, res) => {
  try {
    const config = await mongoSettingsService.getUISettings();

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /settings/ui:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la config UI',
      message: error.message
    });
  }
});

/**
 * GET /api/settings/:key
 * Obtenir un paramètre spécifique
 */
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { environment = 'all', defaultValue } = req.query;
    
    const value = await mongoSettingsService.getSetting(key, defaultValue, environment);

    if (value === null && !defaultValue) {
      return res.status(404).json({
        success: false,
        error: 'Paramètre non trouvé',
        message: `Aucun paramètre trouvé avec la clé: ${key}`
      });
    }

    res.json({
      success: true,
      key,
      value,
      environment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur GET /settings/${req.params.key}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du paramètre',
      message: error.message
    });
  }
});

/**
 * POST /api/settings
 * Créer un nouveau paramètre
 */
router.post('/', async (req, res) => {
  try {
    const settingData = req.body;

    // Validation des données requises
    const requiredFields = ['key', 'value', 'dataType', 'category'];
    const missingFields = requiredFields.filter(field => !settingData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        message: `Champs requis manquants: ${missingFields.join(', ')}`
      });
    }

    const result = await mongoSettingsService.createSetting(settingData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Paramètre créé avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /settings:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du paramètre',
      message: error.message
    });
  }
});

/**
 * POST /api/settings/bulk
 * Mettre à jour plusieurs paramètres en une fois
 */
router.post('/bulk', async (req, res) => {
  try {
    const { settings, updatedBy = 'api' } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        message: 'settings doit être un objet clé-valeur'
      });
    }

    const results = await mongoSettingsService.updateMultipleSettings(settings, updatedBy);

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: errorCount === 0,
      data: results,
      summary: {
        total: Object.keys(settings).length,
        success: successCount,
        errors: errorCount
      },
      message: `${successCount}/${Object.keys(settings).length} paramètres mis à jour`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /settings/bulk:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour en lot',
      message: error.message
    });
  }
});

/**
 * PUT /api/settings/:key
 * Mettre à jour un paramètre spécifique
 */
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, updatedBy = 'api', environment = 'all' } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        error: 'Valeur requise',
        message: 'Le paramètre value est obligatoire'
      });
    }

    const result = await mongoSettingsService.setSetting(key, value, updatedBy, environment);

    res.json({
      success: true,
      data: result,
      message: 'Paramètre mis à jour avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur PUT /settings/${req.params.key}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du paramètre',
      message: error.message
    });
  }
});

/**
 * POST /api/settings/:key/reset
 * Réinitialiser un paramètre à sa valeur par défaut
 */
router.post('/:key/reset', async (req, res) => {
  try {
    const { key } = req.params;
    const { updatedBy = 'api' } = req.body;

    const result = await mongoSettingsService.resetSettingToDefault(key, updatedBy);

    res.json({
      success: true,
      data: result,
      message: 'Paramètre réinitialisé avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur POST /settings/${req.params.key}/reset:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation du paramètre',
      message: error.message
    });
  }
});

/**
 * GET /api/settings/validate/config
 * Valider la configuration actuelle
 */
router.get('/validate/config', async (req, res) => {
  try {
    const validation = await mongoSettingsService.validateConfiguration();

    const statusCode = validation.valid ? 200 : 400;
    
    res.status(statusCode).json({
      success: validation.valid,
      data: validation,
      message: validation.valid ? 'Configuration valide' : 'Problèmes de configuration détectés',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /settings/validate/config:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation',
      message: error.message
    });
  }
});

/**
 * GET /api/settings/export/config
 * Exporter la configuration
 */
router.get('/export/config', async (req, res) => {
  try {
    const { includeSecrets = false } = req.query;
    
    const exportData = await mongoSettingsService.exportConfiguration(includeSecrets === 'true');

    res.json({
      success: true,
      data: exportData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /settings/export/config:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export',
      message: error.message
    });
  }
});

/**
 * GET /api/settings/stats
 * Obtenir les statistiques des paramètres
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await mongoSettingsService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /settings/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      message: error.message
    });
  }
});

export default router;
