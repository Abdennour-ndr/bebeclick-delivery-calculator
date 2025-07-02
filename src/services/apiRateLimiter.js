/**
 * Service de limitation du taux d'API pour éviter de dépasser les quotas
 * Limites: 3 requêtes/seconde, 30 requêtes/minute
 */

class APIRateLimiter {
  constructor() {
    // Limites de sécurité (plus strictes que Google)
    this.limits = {
      perSecond: 3,    // Google: 5, Notre limite: 3
      perMinute: 30    // Google: 50, Notre limite: 30
    };

    // Stockage des requêtes par période
    this.requests = {
      currentSecond: [],
      currentMinute: []
    };

    // Queue pour les requêtes en attente
    this.requestQueue = [];
    this.isProcessingQueue = false;

    console.log('🛡️ API Rate Limiter initialisé:', this.limits);
  }

  /**
   * Vérifier si on peut faire une requête maintenant
   */
  canMakeRequest() {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentMinute = Math.floor(now / 60000);

    // Nettoyer les anciennes requêtes
    this.cleanOldRequests(currentSecond, currentMinute);

    // Vérifier les limites
    const secondCount = this.requests.currentSecond.length;
    const minuteCount = this.requests.currentMinute.length;

    const canMake = secondCount < this.limits.perSecond && minuteCount < this.limits.perMinute;

    if (!canMake) {
      console.warn('⚠️ Rate limit atteint:', {
        secondCount: `${secondCount}/${this.limits.perSecond}`,
        minuteCount: `${minuteCount}/${this.limits.perMinute}`
      });
    }

    return canMake;
  }

  /**
   * Nettoyer les requêtes anciennes
   */
  cleanOldRequests(currentSecond, currentMinute) {
    // Nettoyer les requêtes de la seconde précédente
    this.requests.currentSecond = this.requests.currentSecond.filter(
      timestamp => Math.floor(timestamp / 1000) === currentSecond
    );

    // Nettoyer les requêtes de la minute précédente
    this.requests.currentMinute = this.requests.currentMinute.filter(
      timestamp => Math.floor(timestamp / 60000) === currentMinute
    );
  }

  /**
   * Enregistrer une nouvelle requête
   */
  recordRequest() {
    const now = Date.now();
    this.requests.currentSecond.push(now);
    this.requests.currentMinute.push(now);

    console.log('📊 Requête enregistrée:', {
      seconde: this.requests.currentSecond.length,
      minute: this.requests.currentMinute.length
    });
  }

  /**
   * Calculer le délai d'attente nécessaire
   */
  getWaitTime() {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentMinute = Math.floor(now / 60000);

    this.cleanOldRequests(currentSecond, currentMinute);

    let waitTime = 0;

    // Si on dépasse la limite par seconde
    if (this.requests.currentSecond.length >= this.limits.perSecond) {
      const oldestInSecond = Math.min(...this.requests.currentSecond);
      const nextSecond = (Math.floor(oldestInSecond / 1000) + 1) * 1000;
      waitTime = Math.max(waitTime, nextSecond - now);
    }

    // Si on dépasse la limite par minute
    if (this.requests.currentMinute.length >= this.limits.perMinute) {
      const oldestInMinute = Math.min(...this.requests.currentMinute);
      const nextMinute = (Math.floor(oldestInMinute / 60000) + 1) * 60000;
      waitTime = Math.max(waitTime, nextMinute - now);
    }

    return waitTime;
  }

  /**
   * Faire une requête avec limitation automatique
   */
  async makeRequest(requestFunction, context = 'API') {
    return new Promise((resolve, reject) => {
      // Ajouter à la queue
      this.requestQueue.push({
        requestFunction,
        context,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Traiter la queue
      this.processQueue();
    });
  }

  /**
   * Traiter la queue des requêtes
   */
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue[0];

      if (this.canMakeRequest()) {
        // Retirer de la queue
        this.requestQueue.shift();
        
        // Enregistrer la requête
        this.recordRequest();

        try {
          console.log(`🚀 Exécution requête ${request.context}`);
          const result = await request.requestFunction();
          request.resolve(result);
        } catch (error) {
          console.error(`❌ Erreur requête ${request.context}:`, error);
          request.reject(error);
        }
      } else {
        // Attendre avant la prochaine tentative
        const waitTime = this.getWaitTime();
        console.log(`⏳ Attente ${waitTime}ms avant prochaine requête`);
        
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // Attente minimale pour éviter les boucles infinies
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Obtenir les statistiques actuelles
   */
  getStats() {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentMinute = Math.floor(now / 60000);

    this.cleanOldRequests(currentSecond, currentMinute);

    return {
      perSecond: {
        current: this.requests.currentSecond.length,
        limit: this.limits.perSecond,
        remaining: this.limits.perSecond - this.requests.currentSecond.length
      },
      perMinute: {
        current: this.requests.currentMinute.length,
        limit: this.limits.perMinute,
        remaining: this.limits.perMinute - this.requests.currentMinute.length
      },
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue
    };
  }

  /**
   * Réinitialiser les compteurs (pour les tests)
   */
  reset() {
    this.requests.currentSecond = [];
    this.requests.currentMinute = [];
    this.requestQueue = [];
    this.isProcessingQueue = false;
    console.log('🔄 Rate limiter réinitialisé');
  }

  /**
   * Afficher les statistiques dans la console
   */
  logStats() {
    const stats = this.getStats();
    console.log('📊 API Rate Limiter Stats:', {
      'Seconde': `${stats.perSecond.current}/${stats.perSecond.limit}`,
      'Minute': `${stats.perMinute.current}/${stats.perMinute.limit}`,
      'Queue': stats.queueLength,
      'Processing': stats.isProcessing
    });
  }
}

// Instance singleton
const apiRateLimiter = new APIRateLimiter();

// Fonction helper pour les requêtes
export async function makeRateLimitedRequest(requestFunction, context = 'API') {
  return apiRateLimiter.makeRequest(requestFunction, context);
}

// Fonction pour obtenir les stats
export function getRateLimiterStats() {
  return apiRateLimiter.getStats();
}

// Fonction pour logger les stats
export function logRateLimiterStats() {
  apiRateLimiter.logStats();
}

// Fonction pour réinitialiser (tests)
export function resetRateLimiter() {
  apiRateLimiter.reset();
}

export default apiRateLimiter;
