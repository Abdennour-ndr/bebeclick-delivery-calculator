/**
 * Diagnostic avancé pour identifier pourquoi l'API Yalidine ne fonctionne pas
 */

// Configuration API Yalidine
const YALIDINE_API_CONFIG = {
  baseUrl: 'https://api.yalidine.app/v1',
  apiId: '53332088154627079445',
  apiToken: 'C3BpezWbhXURmYJnddfLgKKB49j1e6s1pZ8HMPT2lNSOQulb5EqMF8PQLaFrgii6'
};

class YalidineApiDiagnostic {
  constructor() {
    this.results = {};
  }

  /**
   * Diagnostic complet de l'API
   */
  async runCompleteDiagnostic() {
    console.log('🔍 DIAGNOSTIC COMPLET API YALIDINE');
    console.log('=====================================');
    
    const diagnostic = {
      timestamp: new Date().toISOString(),
      config: {
        baseUrl: YALIDINE_API_CONFIG.baseUrl,
        apiId: YALIDINE_API_CONFIG.apiId,
        tokenLength: YALIDINE_API_CONFIG.apiToken.length,
        tokenPrefix: YALIDINE_API_CONFIG.apiToken.substring(0, 10) + '...'
      },
      tests: {}
    };

    // Test 1: Connectivité de base
    diagnostic.tests.connectivity = await this.testConnectivity();
    
    // Test 2: CORS Policy
    diagnostic.tests.cors = await this.testCORS();
    
    // Test 3: Authentication
    diagnostic.tests.auth = await this.testAuthentication();
    
    // Test 4: Headers
    diagnostic.tests.headers = await this.testHeaders();
    
    // Test 5: Endpoints spécifiques
    diagnostic.tests.endpoints = await this.testEndpoints();
    
    // Test 6: Alternative methods
    diagnostic.tests.alternatives = await this.testAlternatives();

    // Analyse et recommandations
    diagnostic.analysis = this.analyzeResults(diagnostic.tests);
    diagnostic.recommendations = this.getRecommendations(diagnostic.analysis);

    console.log('📊 RÉSULTATS DU DIAGNOSTIC:');
    console.log(diagnostic);

    return diagnostic;
  }

  /**
   * Test 1: Connectivité de base
   */
  async testConnectivity() {
    console.log('🌐 Test 1: Connectivité de base...');
    
    const test = {
      name: 'Connectivité',
      success: false,
      details: {}
    };

    try {
      // Test ping simple
      const startTime = Date.now();
      const response = await fetch(YALIDINE_API_CONFIG.baseUrl, {
        method: 'HEAD',
        mode: 'no-cors' // Éviter CORS pour ce test
      });
      
      test.details.responseTime = Date.now() - startTime;
      test.details.status = 'Serveur accessible';
      test.success = true;
      
    } catch (error) {
      test.details.error = error.message;
      test.details.status = 'Serveur inaccessible';
    }

    console.log('✅ Connectivité:', test);
    return test;
  }

  /**
   * Test 2: CORS Policy
   */
  async testCORS() {
    console.log('🔒 Test 2: CORS Policy...');
    
    const test = {
      name: 'CORS',
      success: false,
      details: {}
    };

    try {
      // Test simple GET sans headers
      const response = await fetch(`${YALIDINE_API_CONFIG.baseUrl}/wilayas?page_size=1`);
      
      test.details.status = response.status;
      test.details.statusText = response.statusText;
      test.details.corsAllowed = true;
      test.success = response.ok;
      
    } catch (error) {
      test.details.error = error.message;
      test.details.corsAllowed = false;
      
      if (error.message.includes('CORS')) {
        test.details.issue = 'CORS Policy bloque les requêtes';
        test.details.solution = 'Utiliser un proxy ou server-side requests';
      }
    }

    console.log('🔒 CORS:', test);
    return test;
  }

  /**
   * Test 3: Authentication
   */
  async testAuthentication() {
    console.log('🔑 Test 3: Authentication...');
    
    const test = {
      name: 'Authentication',
      success: false,
      details: {}
    };

    try {
      // Test avec headers d'authentification
      const response = await fetch(`${YALIDINE_API_CONFIG.baseUrl}/wilayas?page_size=1`, {
        method: 'GET',
        headers: {
          'X-API-ID': YALIDINE_API_CONFIG.apiId,
          'X-API-TOKEN': YALIDINE_API_CONFIG.apiToken
        }
      });

      test.details.status = response.status;
      test.details.statusText = response.statusText;
      
      if (response.status === 401) {
        test.details.issue = 'Credentials invalides';
        test.details.apiId = YALIDINE_API_CONFIG.apiId;
        test.details.tokenValid = false;
      } else if (response.status === 403) {
        test.details.issue = 'Accès refusé - permissions insuffisantes';
      } else if (response.ok) {
        test.details.authValid = true;
        test.success = true;
      }

    } catch (error) {
      test.details.error = error.message;
      
      if (error.message.includes('CORS')) {
        test.details.issue = 'CORS empêche le test d\'authentification';
      }
    }

    console.log('🔑 Auth:', test);
    return test;
  }

  /**
   * Test 4: Headers
   */
  async testHeaders() {
    console.log('📋 Test 4: Headers...');
    
    const test = {
      name: 'Headers',
      success: false,
      details: {}
    };

    const headersToTest = [
      { 'Content-Type': 'application/json' },
      { 'Accept': 'application/json' },
      { 'User-Agent': 'BebeClick-Calculator/1.0' },
      { 'Origin': window.location.origin },
      { 'Referer': window.location.href }
    ];

    for (const headers of headersToTest) {
      try {
        const response = await fetch(`${YALIDINE_API_CONFIG.baseUrl}/wilayas?page_size=1`, {
          method: 'GET',
          headers: {
            ...headers,
            'X-API-ID': YALIDINE_API_CONFIG.apiId,
            'X-API-TOKEN': YALIDINE_API_CONFIG.apiToken
          }
        });

        test.details[Object.keys(headers)[0]] = {
          status: response.status,
          success: response.ok
        };

        if (response.ok) {
          test.success = true;
        }

      } catch (error) {
        test.details[Object.keys(headers)[0]] = {
          error: error.message,
          success: false
        };
      }
    }

    console.log('📋 Headers:', test);
    return test;
  }

  /**
   * Test 5: Endpoints spécifiques
   */
  async testEndpoints() {
    console.log('🎯 Test 5: Endpoints...');
    
    const test = {
      name: 'Endpoints',
      success: false,
      details: {}
    };

    const endpoints = [
      '/wilayas',
      '/communes',
      '/centers',
      '/fees'
    ];

    for (const endpoint of endpoints) {
      try {
        let url = `${YALIDINE_API_CONFIG.baseUrl}${endpoint}?page_size=1`;
        
        // Paramètres spéciaux pour fees
        if (endpoint === '/fees') {
          url += '&from_wilaya_id=16&to_wilaya_id=31';
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-API-ID': YALIDINE_API_CONFIG.apiId,
            'X-API-TOKEN': YALIDINE_API_CONFIG.apiToken,
            'Content-Type': 'application/json'
          }
        });

        test.details[endpoint] = {
          status: response.status,
          statusText: response.statusText,
          success: response.ok
        };

        if (response.ok) {
          const data = await response.json();
          test.details[endpoint].dataReceived = true;
          test.details[endpoint].dataSize = JSON.stringify(data).length;
          test.success = true;
        }

      } catch (error) {
        test.details[endpoint] = {
          error: error.message,
          success: false
        };
      }
    }

    console.log('🎯 Endpoints:', test);
    return test;
  }

  /**
   * Test 6: Méthodes alternatives
   */
  async testAlternatives() {
    console.log('🔄 Test 6: Alternatives...');
    
    const test = {
      name: 'Alternatives',
      success: false,
      details: {}
    };

    // Test 1: JSONP (si supporté)
    try {
      test.details.jsonp = {
        supported: false,
        note: 'JSONP non supporté par l\'API Yalidine'
      };
    } catch (error) {
      test.details.jsonp = { error: error.message };
    }

    // Test 2: Proxy public
    try {
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${YALIDINE_API_CONFIG.baseUrl}/wilayas?page_size=1`;
      const response = await fetch(proxyUrl, {
        headers: {
          'X-API-ID': YALIDINE_API_CONFIG.apiId,
          'X-API-TOKEN': YALIDINE_API_CONFIG.apiToken
        }
      });

      test.details.corsProxy = {
        status: response.status,
        success: response.ok,
        note: 'Proxy CORS public'
      };

      if (response.ok) {
        test.success = true;
      }

    } catch (error) {
      test.details.corsProxy = {
        error: error.message,
        success: false
      };
    }

    console.log('🔄 Alternatives:', test);
    return test;
  }

  /**
   * Analyser les résultats
   */
  analyzeResults(tests) {
    const analysis = {
      mainIssue: null,
      secondaryIssues: [],
      workingFeatures: [],
      blockers: []
    };

    // Identifier le problème principal
    if (!tests.connectivity.success) {
      analysis.mainIssue = 'CONNECTIVITY';
      analysis.blockers.push('Serveur Yalidine inaccessible');
    } else if (!tests.cors.success && tests.cors.details.corsAllowed === false) {
      analysis.mainIssue = 'CORS';
      analysis.blockers.push('CORS Policy bloque les requêtes depuis le navigateur');
    } else if (!tests.auth.success) {
      analysis.mainIssue = 'AUTHENTICATION';
      analysis.blockers.push('Credentials API invalides ou permissions insuffisantes');
    } else {
      analysis.mainIssue = 'UNKNOWN';
    }

    // Identifier les fonctionnalités qui marchent
    Object.entries(tests).forEach(([testName, testResult]) => {
      if (testResult.success) {
        analysis.workingFeatures.push(testName);
      } else {
        analysis.secondaryIssues.push(testName);
      }
    });

    return analysis;
  }

  /**
   * Obtenir des recommandations
   */
  getRecommendations(analysis) {
    const recommendations = [];

    switch (analysis.mainIssue) {
      case 'CORS':
        recommendations.push({
          priority: 'HIGH',
          solution: 'Utiliser un serveur proxy',
          description: 'Créer un endpoint backend qui fait les requêtes à Yalidine',
          implementation: 'Node.js/Express proxy ou Cloudflare Workers'
        });
        recommendations.push({
          priority: 'MEDIUM',
          solution: 'Extension navigateur',
          description: 'Utiliser une extension CORS pour le développement',
          implementation: 'CORS Unblock ou similaire (développement uniquement)'
        });
        break;

      case 'AUTHENTICATION':
        recommendations.push({
          priority: 'HIGH',
          solution: 'Vérifier les credentials',
          description: 'Contacter Yalidine pour valider API ID et Token',
          implementation: 'Support technique Yalidine'
        });
        break;

      case 'CONNECTIVITY':
        recommendations.push({
          priority: 'HIGH',
          solution: 'Vérifier la connectivité réseau',
          description: 'Problème réseau ou serveur Yalidine down',
          implementation: 'Attendre ou contacter Yalidine'
        });
        break;

      default:
        recommendations.push({
          priority: 'MEDIUM',
          solution: 'Utiliser le mode fallback',
          description: 'Continuer avec les données statiques',
          implementation: 'Déjà implémenté dans le système hybride'
        });
    }

    return recommendations;
  }
}

// Instance singleton
const yalidineApiDiagnostic = new YalidineApiDiagnostic();

export default yalidineApiDiagnostic;
