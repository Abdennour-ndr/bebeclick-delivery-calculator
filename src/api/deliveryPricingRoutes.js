/**
 * Routes API pour la gestion des prix de livraison
 * Endpoints CRUD pour les tarifs de tous les services de livraison
 */

import express from 'express';
import { mongoDeliveryPricingService } from '../services/mongoServices.js';

const router = express.Router();

/**
 * GET /api/delivery-pricing
 * Obtenir tous les prix de livraison avec filtres optionnels
 */
router.get('/', async (req, res) => {
  try {
    const {
      service,
      wilayaCode,
      commune,
      zone,
      status = 'active',
      page = 1,
      limit = 50
    } = req.query;

    const criteria = {
      status,
      limit: parseInt(limit)
    };

    if (service) criteria.service = service;
    if (wilayaCode) criteria.wilayaCode = parseInt(wilayaCode);
    if (commune) criteria.commune = commune;
    if (zone) criteria.zone = parseInt(zone);

    const results = await mongoDeliveryPricingService.searchPricing(criteria);

    res.json({
      success: true,
      data: results,
      count: results.length,
      filters: criteria,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /delivery-pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des prix',
      message: error.message
    });
  }
});

/**
 * GET /api/delivery-pricing/service/:service
 * Obtenir tous les prix pour un service spécifique
 */
router.get('/service/:service', async (req, res) => {
  try {
    const { service } = req.params;
    
    const pricing = await mongoDeliveryPricingService.getServicePricing(service);

    res.json({
      success: true,
      service,
      data: pricing,
      count: pricing.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur GET /delivery-pricing/service/${req.params.service}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des prix du service',
      message: error.message
    });
  }
});

/**
 * GET /api/delivery-pricing/calculate
 * Calculer le prix de livraison pour une destination
 */
router.get('/calculate', async (req, res) => {
  try {
    const {
      destination,
      deliveryType = 'home',
      weight = 0,
      declaredValue = 0,
      length = 0,
      width = 0,
      height = 0
    } = req.query;

    if (!destination) {
      return res.status(400).json({
        success: false,
        error: 'Destination requise',
        message: 'Le paramètre destination est obligatoire'
      });
    }

    const dimensions = {
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height)
    };

    const result = await mongoDeliveryPricingService.getDeliveryPrice(
      destination,
      deliveryType,
      parseFloat(weight),
      dimensions,
      parseFloat(declaredValue)
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Prix non trouvé',
        message: `Aucun prix trouvé pour la destination: ${destination}`
      });
    }

    res.json({
      success: true,
      data: result,
      query: {
        destination,
        deliveryType,
        weight: parseFloat(weight),
        declaredValue: parseFloat(declaredValue),
        dimensions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /delivery-pricing/calculate:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul du prix',
      message: error.message
    });
  }
});

/**
 * POST /api/delivery-pricing
 * Créer ou mettre à jour un prix de livraison
 */
router.post('/', async (req, res) => {
  try {
    const pricingData = req.body;

    // Validation des données requises
    const requiredFields = ['service', 'wilaya', 'commune', 'pricing'];
    const missingFields = requiredFields.filter(field => !pricingData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        message: `Champs requis manquants: ${missingFields.join(', ')}`
      });
    }

    const result = await mongoDeliveryPricingService.savePricing(pricingData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Prix de livraison sauvegardé avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /delivery-pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde du prix',
      message: error.message
    });
  }
});

/**
 * POST /api/delivery-pricing/bulk
 * Créer ou mettre à jour plusieurs prix en une fois
 */
router.post('/bulk', async (req, res) => {
  try {
    const { pricingArray } = req.body;

    if (!Array.isArray(pricingArray) || pricingArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        message: 'pricingArray doit être un tableau non vide'
      });
    }

    const results = await mongoDeliveryPricingService.bulkUpdatePricing(pricingArray);

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: errorCount === 0,
      data: results,
      summary: {
        total: pricingArray.length,
        success: successCount,
        errors: errorCount
      },
      message: `${successCount}/${pricingArray.length} prix mis à jour avec succès`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur POST /delivery-pricing/bulk:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour en lot',
      message: error.message
    });
  }
});

/**
 * PUT /api/delivery-pricing/:service/:wilayaCode/:commune
 * Mettre à jour un prix spécifique
 */
router.put('/:service/:wilayaCode/:commune', async (req, res) => {
  try {
    const { service, wilayaCode, commune } = req.params;
    const updateData = req.body;

    // Ajouter les paramètres de l'URL aux données
    updateData.service = service;
    updateData.wilaya = updateData.wilaya || {};
    updateData.wilaya.code = parseInt(wilayaCode);
    updateData.commune = commune;

    const result = await mongoDeliveryPricingService.savePricing(updateData);

    res.json({
      success: true,
      data: result,
      message: 'Prix mis à jour avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur PUT /delivery-pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du prix',
      message: error.message
    });
  }
});

/**
 * DELETE /api/delivery-pricing/:service/:wilayaCode/:commune
 * Supprimer un prix de livraison
 */
router.delete('/:service/:wilayaCode/:commune', async (req, res) => {
  try {
    const { service, wilayaCode, commune } = req.params;

    const success = await mongoDeliveryPricingService.deletePricing(
      service,
      parseInt(wilayaCode),
      commune
    );

    if (success) {
      res.json({
        success: true,
        message: 'Prix supprimé avec succès',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Prix non trouvé',
        message: `Aucun prix trouvé pour ${service} - ${commune} (${wilayaCode})`
      });
    }

  } catch (error) {
    console.error('❌ Erreur DELETE /delivery-pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du prix',
      message: error.message
    });
  }
});

/**
 * GET /api/delivery-pricing/stats
 * Obtenir les statistiques des prix de livraison
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await mongoDeliveryPricingService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur GET /delivery-pricing/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      message: error.message
    });
  }
});

export default router;
