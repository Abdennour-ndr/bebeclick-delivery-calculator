/**
 * Utilitaires mathématiques pour gérer les problèmes de précision des nombres flottants
 */

/**
 * Nettoie un nombre flottant et le convertit en entier propre
 * Gère les problèmes de précision JavaScript comme 5792.4800000000005
 * @param {number} value - La valeur à nettoyer
 * @returns {number} - Nombre entier nettoyé
 */
export function cleanNumber(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0;
  }

  // Si c'est déjà un entier, le retourner tel quel
  if (Number.isInteger(value)) {
    return value;
  }

  // Méthode 1: Arrondir à l'entier le plus proche
  const rounded = Math.round(value);
  
  // Méthode 2: Vérifier si la différence est très petite (erreur de précision)
  const difference = Math.abs(value - rounded);
  
  // Si la différence est très petite (< 0.0001), c'est probablement une erreur de précision
  if (difference < 0.0001) {
    return rounded;
  }

  // Méthode 3: Utiliser parseFloat avec toFixed pour nettoyer
  const cleaned = parseFloat(value.toFixed(0));
  
  return cleaned;
}

/**
 * Nettoie un coût et s'assure qu'il est un entier positif
 * @param {number} cost - Le coût à nettoyer
 * @returns {number} - Coût nettoyé (entier positif)
 */
export function cleanCost(cost) {
  const cleaned = cleanNumber(cost);
  return Math.max(0, cleaned); // S'assurer que c'est positif
}

/**
 * Arrondit un coût supplémentaire à la centaine la plus proche
 * @param {number} cost - Le coût à arrondir
 * @returns {number} - Coût arrondi à la centaine
 */
export function roundToHundred(cost) {
  const cleaned = cleanCost(cost);

  // Si le coût est inférieur à 100, le retourner tel quel
  if (cleaned < 100) {
    return cleaned;
  }

  // Arrondir à la centaine la plus proche
  return Math.round(cleaned / 100) * 100;
}

/**
 * Applique un ajustement intelligent pour les coûts supplémentaires
 * Arrondit vers le bas ou vers le haut selon des règles métier
 * @param {number} cost - Le coût original
 * @returns {number} - Coût ajusté
 */
export function smartRoundCost(cost) {
  const cleaned = cleanCost(cost);

  // Si le coût est inférieur à 100, le retourner tel quel
  if (cleaned < 100) {
    return cleaned;
  }

  // Obtenir les centaines et les dizaines
  const hundreds = Math.floor(cleaned / 100) * 100;
  const remainder = cleaned % 100;

  // Règles d'ajustement:
  // 0-25: arrondir vers le bas (ex: 5792 → 5700)
  // 26-75: arrondir vers 50 (ex: 5750 → 5750)
  // 76-100: arrondir vers le haut (ex: 5792 → 5800)

  if (remainder <= 25) {
    return hundreds; // Vers le bas
  } else if (remainder <= 75) {
    return hundreds + 50; // Vers 50
  } else {
    return hundreds + 100; // Vers le haut
  }
}

/**
 * Nettoie un poids et le garde avec 2 décimales maximum
 * @param {number} weight - Le poids à nettoyer
 * @returns {number} - Poids nettoyé
 */
export function cleanWeight(weight) {
  if (typeof weight !== 'number' || isNaN(weight)) {
    return 0;
  }

  // Arrondir à 2 décimales et nettoyer
  return Math.round(weight * 100) / 100;
}

/**
 * Calcule un pourcentage et retourne un entier propre
 * @param {number} amount - Montant de base
 * @param {number} percentage - Pourcentage (ex: 1 pour 1%)
 * @returns {number} - Résultat en entier
 */
export function calculatePercentage(amount, percentage) {
  const result = amount * (percentage / 100);
  return cleanCost(result);
}

/**
 * Additionne plusieurs coûts et retourne un entier propre
 * @param {...number} costs - Les coûts à additionner
 * @returns {number} - Somme en entier
 */
export function sumCosts(...costs) {
  const sum = costs.reduce((total, cost) => {
    return total + (cleanCost(cost) || 0);
  }, 0);
  
  return cleanCost(sum);
}

/**
 * Multiplie deux nombres et retourne un résultat nettoyé
 * @param {number} a - Premier nombre
 * @param {number} b - Deuxième nombre
 * @param {boolean} asInteger - Si true, retourne un entier
 * @returns {number} - Résultat nettoyé
 */
export function multiplyClean(a, b, asInteger = true) {
  const result = a * b;
  
  if (asInteger) {
    return cleanCost(result);
  } else {
    return cleanWeight(result);
  }
}

/**
 * Formate un nombre pour l'affichage (supprime les décimales inutiles)
 * @param {number} value - Valeur à formater
 * @param {number} decimals - Nombre de décimales max (défaut: 0)
 * @returns {string} - Nombre formaté
 */
export function formatNumber(value, decimals = 0) {
  const cleaned = cleanNumber(value);
  
  if (decimals === 0) {
    return cleaned.toString();
  }
  
  return cleaned.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Tests pour vérifier le bon fonctionnement
 */
export function testMathUtils() {
  console.log('=== Tests Math Utils ===');
  console.log('cleanNumber(5792.4800000000005):', cleanNumber(5792.4800000000005)); // Devrait être 5792
  console.log('cleanNumber(5792.9999999999):', cleanNumber(5792.9999999999)); // Devrait être 5793
  console.log('cleanCost(-100.5):', cleanCost(-100.5)); // Devrait être 0
  console.log('calculatePercentage(5000, 1):', calculatePercentage(5000, 1)); // Devrait être 50
  console.log('sumCosts(500, 4700.0000005, 50):', sumCosts(500, 4700.0000005, 50)); // Devrait être 5250
  console.log('formatNumber(5792.4800000000005):', formatNumber(5792.4800000000005)); // Devrait être "5792"

  console.log('=== Tests Smart Rounding ===');
  console.log('smartRoundCost(5792):', smartRoundCost(5792)); // Devrait être 5800 (92 > 75)
  console.log('smartRoundCost(5720):', smartRoundCost(5720)); // Devrait être 5700 (20 <= 25)
  console.log('smartRoundCost(5750):', smartRoundCost(5750)); // Devrait être 5750 (50 entre 26-75)
  console.log('smartRoundCost(4680):', smartRoundCost(4680)); // Devrait être 4700 (80 > 75)
  console.log('smartRoundCost(4615):', smartRoundCost(4615)); // Devrait être 4600 (15 <= 25)
  console.log('roundToHundred(5792):', roundToHundred(5792)); // Devrait être 5800
}
