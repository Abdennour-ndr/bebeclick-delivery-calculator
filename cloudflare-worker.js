/**
 * Cloudflare Worker pour contourner CORS avec l'API Yalidine
 * Déployer sur: https://workers.cloudflare.com/
 * URL finale: https://yalidine-proxy.your-domain.workers.dev
 */

// Configuration Yalidine
const YALIDINE_CONFIG = {
  baseUrl: 'https://api.yalidine.app/v1',
  apiId: '53332088154627079445',
  apiToken: 'C3BpezWbhXURmYJnddfLgKKB49j1e6s1pZ8HMPT2lNSOQulb5EqMF8PQLaFrgii6'
};

// Domaines autorisés
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://calc-bebeclick.fly.dev',
  'https://bebeclick.com'
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Headers CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-ID, X-API-TOKEN',
      'Access-Control-Max-Age': '86400',
    };

    // Gérer les requêtes OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    // Route de santé
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        worker: 'Yalidine CORS Proxy',
        yalidine: {
          baseUrl: YALIDINE_CONFIG.baseUrl,
          apiId: YALIDINE_CONFIG.apiId,
          hasToken: !!YALIDINE_CONFIG.apiToken
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Route de test
    if (url.pathname === '/test-yalidine') {
      try {
        const yalidineUrl = `${YALIDINE_CONFIG.baseUrl}/wilayas?page_size=5`;
        
        const response = await fetch(yalidineUrl, {
          method: 'GET',
          headers: {
            'X-API-ID': YALIDINE_CONFIG.apiId,
            'X-API-TOKEN': YALIDINE_CONFIG.apiToken,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          return new Response(JSON.stringify({
            success: false,
            error: `${response.status} ${response.statusText}`,
            details: errorText
          }), {
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        const data = await response.json();
        return new Response(JSON.stringify({
          success: true,
          message: 'API Yalidine accessible via Cloudflare Worker',
          data: {
            totalWilayas: data.total_data,
            sampleWilayas: data.data?.slice(0, 3) || []
          }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    // Proxy pour l'API Yalidine
    if (url.pathname.startsWith('/api/yalidine/')) {
      try {
        // Construire l'URL Yalidine
        const yalidineEndpoint = url.pathname.replace('/api/yalidine', '');
        const yalidineUrl = `${YALIDINE_CONFIG.baseUrl}${yalidineEndpoint}${url.search}`;
        
        console.log(`🔗 Proxy: ${request.method} ${yalidineEndpoint} -> ${yalidineUrl}`);

        // Faire la requête vers Yalidine
        const yalidineResponse = await fetch(yalidineUrl, {
          method: request.method,
          headers: {
            'X-API-ID': YALIDINE_CONFIG.apiId,
            'X-API-TOKEN': YALIDINE_CONFIG.apiToken,
            'Content-Type': 'application/json'
          },
          body: request.method !== 'GET' ? await request.text() : undefined
        });

        // Copier la réponse avec headers CORS
        const responseBody = await yalidineResponse.text();
        
        return new Response(responseBody, {
          status: yalidineResponse.status,
          statusText: yalidineResponse.statusText,
          headers: {
            'Content-Type': yalidineResponse.headers.get('Content-Type') || 'application/json',
            ...corsHeaders
          }
        });

      } catch (error) {
        console.error('❌ Proxy Error:', error);
        return new Response(JSON.stringify({
          error: 'Proxy Error',
          message: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    // Route par défaut
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Route non trouvée',
      availableRoutes: [
        '/health',
        '/test-yalidine',
        '/api/yalidine/wilayas',
        '/api/yalidine/communes',
        '/api/yalidine/fees'
      ]
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

/**
 * Instructions de déploiement:
 * 
 * 1. Aller sur https://workers.cloudflare.com/
 * 2. Créer un nouveau Worker
 * 3. Copier ce code dans l'éditeur
 * 4. Déployer
 * 5. Noter l'URL du Worker (ex: https://yalidine-proxy.your-domain.workers.dev)
 * 6. Dans yalidineHybridService.js, remplacer:
 *    baseUrl: 'http://localhost:3001/api/yalidine'
 *    par:
 *    baseUrl: 'https://yalidine-proxy.your-domain.workers.dev/api/yalidine'
 * 
 * Routes disponibles:
 * - GET /health - Test de santé
 * - GET /test-yalidine - Test API Yalidine
 * - GET /api/yalidine/wilayas - Proxy wilayas
 * - GET /api/yalidine/communes - Proxy communes
 * - GET /api/yalidine/fees - Proxy tarifs
 */
