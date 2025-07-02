/**
 * Routes API pour la gestion des locations (Wilayas et Communes)
 * Endpoints CRUD pour la hiérarchie géographique
 */

import express from 'express';
import { mongoLocationService } from '../services/mongoServices.js';

const router = express.Router();

/**
 * GET /api/locations/wilayas
 * Obtenir toutes les wilayas
 */
router.get('/wilayas', async (req, res) => {
  try {
    const wilayas = await mongoLocationService.getWilayas();

    res.json({
      success: true,
      data: wilayas,
      count: wilayas.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /locations/wilayas:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des wilayas',
      message: error.message
    });
  }
});

/**
 * GET /api/locations/communes/:wilayaCode
 * Obtenir les communes d'une wilaya
 */
router.get('/communes/:wilayaCode', async (req, res) => {
  try {
    const { wilayaCode } = req.params;
    
    const communes = await mongoLocationService.getCommunesByWilaya(parseInt(wilayaCode));

    res.json({
      success: true,
      data: communes,
      wilayaCode: parseInt(wilayaCode),
      count: communes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur GET /locations/communes/${req.params.wilayaCode}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des communes',
      message: error.message
    });
  }
});

/**
 * GET /api/locations/search
 * Rechercher des locations par nom
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, type } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Terme de recherche requis',
        message: 'Le paramètre q est obligatoire'
      });
    }

    const locations = await mongoLocationService.searchLocations(searchTerm, type);

    res.json({
      success: true,
      data: locations,
      count: locations.length,
      searchTerm,
      type: type || 'tous',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /locations/search:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche de locations',
      message: error.message
    });
  }
});

/**
 * GET /api/locations/zone/:zone
 * Obtenir les locations par zone de tarification
 */
router.get('/zone/:zone', async (req, res) => {
  try {
    const { zone } = req.params;
    
    const locations = await mongoLocationService.getLocationsByPricingZone(parseInt(zone));

    res.json({
      success: true,
      data: locations,
      zone: parseInt(zone),
      count: locations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur GET /locations/zone/${req.params.zone}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération par zone',
      message: error.message
    });
  }
});

/**
 * GET /api/locations/:type/:code
 * Obtenir une location par type et code
 */
router.get('/:type/:code', async (req, res) => {
  try {
    const { type, code } = req.params;

    if (!['wilaya', 'commune', 'district'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type invalide',
        message: 'Type doit être: wilaya, commune ou district'
      });
    }

    const location = await mongoLocationService.getLocationByCode(type, parseInt(code));

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location non trouvée',
        message: `Aucune location trouvée: ${type} ${code}`
      });
    }

    res.json({
      success: true,
      data: location,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur GET /locations/${req.params.type}/${req.params.code}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la location',
      message: error.message
    });
  }
});

/**
 * POST /api/locations
 * Créer ou mettre à jour une location
 */
router.post('/', async (req, res) => {
  try {
    const locationData = req.body;

    // Validation des données requises
    const requiredFields = ['type', 'code', 'name'];
    const missingFields = requiredFields.filter(field => !locationData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        message: `Champs requis manquants: ${missingFields.join(', ')}`
      });
    }

    if (!['wilaya', 'commune', 'district'].includes(locationData.type)) {
      return res.status(400).json({
        success: false,
        error: 'Type invalide',
        message: 'Type doit être: wilaya, commune ou district'
      });
    }

    const result = await mongoLocationService.saveLocation(locationData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Location sauvegardée avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /locations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde de la location',
      message: error.message
    });
  }
});

/**
 * POST /api/locations/commune
 * Ajouter une nouvelle commune à une wilaya
 */
router.post('/commune', async (req, res) => {
  try {
    const { wilayaCode, communeData } = req.body;

    if (!wilayaCode || !communeData || !communeData.name) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        message: 'wilayaCode et communeData.name sont requis'
      });
    }

    const result = await mongoLocationService.addCommune(wilayaCode, communeData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Commune ajoutée avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /locations/commune:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout de la commune',
      message: error.message
    });
  }
});

/**
 * POST /api/locations/bulk
 * Importer plusieurs locations en une fois
 */
router.post('/bulk', async (req, res) => {
  try {
    const { locations, source = 'import' } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        message: 'locations doit être un tableau non vide'
      });
    }

    const results = await mongoLocationService.bulkImportLocations(locations, source);

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: errorCount === 0,
      data: results,
      summary: {
        total: locations.length,
        success: successCount,
        errors: errorCount
      },
      message: `${successCount}/${locations.length} locations importées avec succès`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /locations/bulk:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'import en lot',
      message: error.message
    });
  }
});

/**
 * PUT /api/locations/:type/:code
 * Mettre à jour une location
 */
router.put('/:type/:code', async (req, res) => {
  try {
    const { type, code } = req.params;
    const updateData = req.body;

    // S'assurer que le type et code correspondent
    updateData.type = type;
    updateData.code = parseInt(code);

    const result = await mongoLocationService.saveLocation(updateData);

    res.json({
      success: true,
      data: result,
      message: 'Location mise à jour avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur PUT /locations/${req.params.type}/${req.params.code}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la location',
      message: error.message
    });
  }
});

/**
 * PUT /api/locations/:type/:code/zone
 * Mettre à jour la zone de tarification d'une location
 */
router.put('/:type/:code/zone', async (req, res) => {
  try {
    const { type, code } = req.params;
    const { zone } = req.body;

    if (!zone || zone < 1 || zone > 10) {
      return res.status(400).json({
        success: false,
        error: 'Zone invalide',
        message: 'La zone doit être un nombre entre 1 et 10'
      });
    }

    const result = await mongoLocationService.updatePricingZone(type, parseInt(code), zone);

    res.json({
      success: true,
      data: result,
      message: 'Zone de tarification mise à jour avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur PUT /locations/${req.params.type}/${req.params.code}/zone:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la zone',
      message: error.message
    });
  }
});

/**
 * POST /api/locations/initialize-algeria
 * Initialiser les wilayas d'Algérie
 */
router.post('/initialize-algeria', async (req, res) => {
  try {
    const results = await mongoLocationService.initializeAlgerianWilayas();

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: errorCount === 0,
      data: results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount
      },
      message: `${successCount} wilayas d'Algérie initialisées`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /locations/initialize-algeria:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'initialisation des wilayas',
      message: error.message
    });
  }
});

/**
 * GET /api/locations/stats
 * Obtenir les statistiques des locations
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await mongoLocationService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /locations/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      message: error.message
    });
  }
});

export default router;
