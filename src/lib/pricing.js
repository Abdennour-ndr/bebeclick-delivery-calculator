// Données de tarification pour les services de livraison

export const ZAKI_RATES = {
  name: 'Zaki',
  zones: [
    { minDistance: 0, maxDistance: 10, cost: 1000 },
    { minDistance: 11, maxDistance: 20, cost: 1500 },
    { minDistance: 21, maxDistance: 30, cost: 2000 },
    { minDistance: 31, maxDistance: 40, cost: 2500 },
    { minDistance: 41, maxDistance: 60, cost: 3500 },
    { minDistance: 61, maxDistance: Infinity, cost: 'contact' } // Contact pour plus de 60 km
  ]
};

export const JAMAL_DELIVERY_RATES = {
  name: 'Jamal Delivery',
  zones: [
    // À définir selon les informations fournies par l'utilisateur
    { minDistance: 0, maxDistance: Infinity, cost: 'À définir' }
  ]
};

export const YALIDINE_RATES = {
  name: 'Yalidine',
  wilayas: {
    // Tarifs de base par wilaya - à compléter avec les données fournies par l'utilisateur
    'Alger': { baseCost: 400, deliveryToOffice: false },
    'Blida': { baseCost: 450, deliveryToOffice: false },
    'Boumerdes': { baseCost: 450, deliveryToOffice: false },
    'Tipaza': { baseCost: 500, deliveryToOffice: false },
    // Autres wilayas à ajouter...
    'default': { baseCost: 600, deliveryToOffice: true }
  },
  volumetricWeightFormula: 1/5000, // (L x l x h) en cm ÷ 5000
  extraCostThreshold: {
    weight: 5, // kg
    volumetricWeight: 5 // kg
  },
  extraCostPerKg: {
    zones_0_1_2_3: 50, // DZD par kg supplémentaire pour zones 0, 1, 2, 3
    zones_4_5: 100     // DZD par kg supplémentaire pour zones 4, 5
  }
};

// Fonction pour calculer le coût Zaki
export function calculateZakiCost(distance) {
  const zone = ZAKI_RATES.zones.find(z => distance >= z.minDistance && distance <= z.maxDistance);
  if (!zone) return { error: 'Distance non prise en charge' };
  
  if (zone.cost === 'contact') {
    return { 
      service: 'Zaki',
      distance,
      baseCost: 'Contactez le service',
      totalCost: 'Contactez le service pour un devis',
      message: 'Pour des distances supérieures à 60 km, veuillez contacter le service de livraison.'
    };
  }
  
  return {
    service: 'Zaki',
    distance,
    baseCost: zone.cost,
    totalCost: zone.cost
  };
}

// Fonction pour calculer le coût Jamal Delivery
export function calculateJamalDeliveryCost(distance) {
  // À implémenter selon les tarifs fournis
  return {
    service: 'Jamal Delivery',
    distance,
    baseCost: 'À définir',
    totalCost: 'À définir',
    message: 'Tarifs Jamal Delivery à définir'
  };
}

import { cleanCost, cleanWeight, multiplyClean, sumCosts, formatNumber, smartRoundCost } from './mathUtils.js';

// Fonction pour calculer le coût Yalidine
export function calculateYalidineCost(wilaya, weight, dimensions, zone = 3) {
  const rates = YALIDINE_RATES.wilayas[wilaya] || YALIDINE_RATES.wilayas.default;
  let totalCost = rates.baseCost;
  let extraCost = 0;
  let volumetricWeight = 0;
  let deliveryType = rates.deliveryToOffice ? 'Livraison au bureau' : 'Livraison à domicile';

  // Calculer le poids volumétrique si les dimensions sont fournies
  if (dimensions && dimensions.length && dimensions.width && dimensions.height) {
    const rawVolumetricWeight = dimensions.length * dimensions.width * dimensions.height * YALIDINE_RATES.volumetricWeightFormula;
    volumetricWeight = cleanWeight(rawVolumetricWeight);
  }

  // Déterminer le poids à utiliser pour le calcul (le plus élevé entre poids réel et volumétrique)
  const effectiveWeight = Math.max(cleanWeight(weight || 0), volumetricWeight);

  // Calculer les coûts supplémentaires selon la zone
  if (effectiveWeight > YALIDINE_RATES.extraCostThreshold.weight) {
    const extraWeight = cleanWeight(effectiveWeight - YALIDINE_RATES.extraCostThreshold.weight);

    // Déterminer le tarif selon la zone
    const ratePerKg = (zone === 4 || zone === 5) ?
      YALIDINE_RATES.extraCostPerKg.zones_4_5 :
      YALIDINE_RATES.extraCostPerKg.zones_0_1_2_3;

    const rawExtraCost = extraWeight * ratePerKg;
    const cleanedExtraCost = cleanCost(rawExtraCost);
    extraCost = smartRoundCost(cleanedExtraCost); // Appliquer le taux d'ajustement intelligent
    totalCost = sumCosts(totalCost, extraCost);
    deliveryType = 'Livraison au bureau'; // Automatiquement au bureau si poids/volume excédentaire

    console.log('=== DEBUG YALIDINE CALCULATION (SMART ROUNDED) ===');
    console.log('Effective weight:', effectiveWeight);
    console.log('Extra weight:', extraWeight);
    console.log('Zone:', zone);
    console.log('Rate per kg:', ratePerKg);
    console.log('Raw extra cost:', rawExtraCost);
    console.log('Cleaned extra cost:', cleanedExtraCost);
    console.log('Smart rounded extra cost:', extraCost);
  }

  const result = {
    service: 'Yalidine',
    wilaya,
    baseCost: cleanCost(rates.baseCost),
    volumetricWeight: volumetricWeight > 0 ? formatNumber(volumetricWeight, 2) : null,
    extraCost: extraCost > 0 ? cleanCost(extraCost) : null,
    deliveryType,
    totalCost: cleanCost(totalCost)
  };

  console.log('=== FINAL YALIDINE RESULT (CLEANED) ===');
  console.log('Result object:', result);

  return result;
}

