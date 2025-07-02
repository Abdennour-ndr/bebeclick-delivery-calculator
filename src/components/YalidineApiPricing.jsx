import React, { useState, useEffect } from 'react';
import yalidineHybridService from '../services/yalidineHybridService';
import yalidineApiDiagnostic from '../services/yalidineApiDiagnostic';

function YalidineApiPricing() {
  const [wilayas, setWilayas] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [communes, setCommunes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  useEffect(() => {
    loadData();
    checkConnection();
  }, []);

  useEffect(() => {
    if (selectedWilaya) {
      loadCommunes();
    }
  }, [selectedWilaya]);

  const checkConnection = async () => {
    try {
      const isConnected = await yalidineHybridService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await yalidineHybridService.getStats();
      const wilayasList = await yalidineHybridService.loadWilayas();
      
      // Convertir les wilayas API en format attendu
      const formattedWilayas = wilayasList.map(w => ({
        code: w.id.toString().padStart(2, '0'),
        name: w.name,
        zone: w.zone,
        isDeliverable: w.is_deliverable
      }));
      
      setWilayas(formattedWilayas);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunes = async () => {
    if (selectedWilaya) {
      setLoading(true);
      try {
        const allCommunes = await yalidineHybridService.loadCommunes();
        const wilayaId = parseInt(selectedWilaya);
        
        // Filtrer les communes par wilaya
        const communesList = allCommunes
          .filter(c => c.wilaya_id === wilayaId && c.is_deliverable)
          .map(c => {
            const wilaya = wilayas.find(w => w.code === selectedWilaya);
            const zone = wilaya ? wilaya.zone : 3;
            const zonePricing = yalidineHybridService.getZonePricing()[zone] || yalidineHybridService.getZonePricing()[3];
            
            return {
              name: c.name,
              office: c.has_stop_desk ? zonePricing.office : null,
              home: zonePricing.home,
              hasStopDesk: c.has_stop_desk,
              zone: zone
            };
          });
        
        setCommunes(communesList);
      } catch (error) {
        console.error('Erreur chargement communes:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      setLoading(true);
      try {
        const results = await yalidineHybridService.searchCommune(searchTerm);
        setCommunes(results.map(r => ({
          name: `${r.communeName} (${r.wilayaName})`,
          office: r.office,
          home: r.home,
          hasStopDesk: r.hasStopDesk,
          zone: r.zone,
          wilayaCode: r.wilayaCode,
          originalName: r.communeName
        })));
        setSelectedWilaya('');
      } catch (error) {
        console.error('Erreur recherche:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setCommunes([]);
    }
  };

  const forceReload = async () => {
    if (confirm('Recharger les données depuis l\'API Yalidine ?')) {
      setLoading(true);
      try {
        await yalidineHybridService.forceReload();
        await loadData();
        if (selectedWilaya) {
          await loadCommunes();
        }
        alert('Données rechargées avec succès!');
      } catch (error) {
        console.error('Erreur rechargement:', error);
        alert('Erreur lors du rechargement');
      } finally {
        setLoading(false);
      }
    }
  };

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      console.log('🔍 Lancement diagnostic Hybrid Yalidine...');
      const diagnostic = await yalidineHybridService.runFullDiagnostic();

      const summary = diagnostic.summary;
      const mode = diagnostic.mode;
      const tests = diagnostic.tests;

      let message = `🔍 Diagnostic Yalidine Complet\n\n`;
      message += `Mode: ${mode.mode}\n`;
      message += `API Disponible: ${mode.apiAvailable ? 'Oui' : 'Non'}\n`;
      message += `Tests réussis: ${summary.successfulTests}/${summary.totalTests}\n`;
      message += `Durée: ${summary.overallDuration}ms\n\n`;

      if (tests.wilayas?.success) {
        message += `✅ Wilayas: ${tests.wilayas.count} (${tests.wilayas.source})\n`;
      } else {
        message += `❌ Wilayas: Échec\n`;
      }

      if (tests.communes?.success) {
        message += `✅ Communes: ${tests.communes.count} (${tests.communes.source})\n`;
      } else {
        message += `❌ Communes: Échec\n`;
      }

      if (tests.search?.success) {
        message += `✅ Recherche: ${tests.search.resultsCount} résultats\n`;
      } else {
        message += `❌ Recherche: Échec\n`;
      }

      if (tests.pricing?.success) {
        message += `✅ Calcul prix: ${tests.pricing.result?.price || 'N/A'} DA\n`;
      } else {
        message += `❌ Calcul prix: Échec\n`;
      }

      message += `\n${summary.recommendation}\n\n`;
      message += `Voir la console pour les détails complets.`;

      alert(message);
    } catch (error) {
      console.error('Erreur diagnostic:', error);
      alert('Erreur lors du diagnostic. Voir la console.');
    } finally {
      setLoading(false);
    }
  };

  const runApiDiagnostic = async () => {
    setLoading(true);
    try {
      console.log('🔍 Lancement diagnostic API avancé...');
      const diagnostic = await yalidineApiDiagnostic.runCompleteDiagnostic();

      let message = `🔍 DIAGNOSTIC API YALIDINE\n\n`;

      // Problème principal
      message += `🎯 PROBLÈME PRINCIPAL: ${diagnostic.analysis.mainIssue}\n\n`;

      // Tests
      const tests = diagnostic.tests;
      message += `📊 RÉSULTATS DES TESTS:\n`;
      message += `• Connectivité: ${tests.connectivity.success ? '✅' : '❌'}\n`;
      message += `• CORS: ${tests.cors.success ? '✅' : '❌'}\n`;
      message += `• Auth: ${tests.auth.success ? '✅' : '❌'}\n`;
      message += `• Headers: ${tests.headers.success ? '✅' : '❌'}\n`;
      message += `• Endpoints: ${tests.endpoints.success ? '✅' : '❌'}\n\n`;

      // Blockers
      if (diagnostic.analysis.blockers.length > 0) {
        message += `🚫 BLOCKERS:\n`;
        diagnostic.analysis.blockers.forEach(blocker => {
          message += `• ${blocker}\n`;
        });
        message += `\n`;
      }

      // Recommandations
      if (diagnostic.recommendations.length > 0) {
        message += `💡 SOLUTIONS:\n`;
        diagnostic.recommendations.forEach(rec => {
          message += `${rec.priority === 'HIGH' ? '🔥' : '💡'} ${rec.solution}\n`;
          message += `   ${rec.description}\n\n`;
        });
      }

      message += `Voir la console pour les détails complets.`;

      alert(message);
    } catch (error) {
      console.error('Erreur diagnostic API:', error);
      alert('Erreur lors du diagnostic API. Voir la console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="yalidine-pricing">
      <div className="pricing-header">
        <h2>Tarifs Yalidine Hybrides</h2>
        <p>API Yalidine avec fallback automatique vers données statiques</p>
        <div className={`connection-status ${connectionStatus}`}>
          <span className="status-indicator"></span>
          {connectionStatus === 'connected' && 'Mode API - Données en temps réel'}
          {connectionStatus === 'disconnected' && 'Mode Statique - Données de base'}
          {connectionStatus === 'error' && 'Mode Statique - API indisponible'}
          {connectionStatus === 'unknown' && 'Détection du mode...'}
        </div>
        {stats.dataSource && (
          <div className="data-source-info">
            <small>Source: {stats.dataSource}</small>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="stats-section">
        {loading ? (
          <div className="loading-stats">
            <div className="loading-spinner"></div>
            <p>Chargement des données depuis l'API Yalidine...</p>
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{stats.deliverableWilayas || 0}</h3>
              <p>Wilayas Livrables</p>
            </div>
            <div className="stat-card">
              <h3>{stats.deliverableCommunes || 0}</h3>
              <p>Communes Livrables</p>
            </div>
            <div className="stat-card">
              <h3>{stats.communesWithStopDesk || 0}</h3>
              <p>Stop Desks</p>
            </div>
            <div className="stat-card">
              <h3>4</h3>
              <p>Zones Tarifaires</p>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="controls-section">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Rechercher une commune..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Rechercher
          </button>
        </div>

        <div className="wilaya-controls">
          <select
            value={selectedWilaya}
            onChange={(e) => {
              setSelectedWilaya(e.target.value);
              setSearchTerm('');
            }}
            className="wilaya-select"
          >
            <option value="">Sélectionner une wilaya</option>
            {wilayas.map(wilaya => (
              <option key={wilaya.code} value={wilaya.code}>
                {wilaya.code} - {wilaya.name} (Zone {wilaya.zone})
              </option>
            ))}
          </select>
        </div>

        <div className="action-controls">
          <button onClick={forceReload} className="reload-button">
            Recharger API
          </button>
          <button onClick={runDiagnostic} className="diagnostic-button">
            🔍 Diagnostic Service
          </button>
          <button onClick={runApiDiagnostic} className="api-diagnostic-button">
            🔧 Diagnostic API
          </button>
          {stats.lastUpdate && (
            <span className="last-update">
              Dernière MAJ: {new Date(stats.lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Tarifs par zone */}
      <div className="zone-pricing-section">
        <h3>Tarifs par Zone</h3>
        <div className="zone-grid">
          {Object.entries(yalidineHybridService.getZonePricing()).map(([zone, pricing]) => (
            <div key={zone} className="zone-card">
              <h4>Zone {zone}</h4>
              <div className="zone-prices">
                <div className="price-item">
                  <span>Domicile:</span>
                  <strong>{pricing.home} DA</strong>
                </div>
                <div className="price-item">
                  <span>Bureau (Stop Desk):</span>
                  <strong>{pricing.office} DA</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des communes */}
      {communes.length > 0 && (
        <div className="communes-section">
          <h3>
            {selectedWilaya 
              ? `Communes de ${wilayas.find(w => w.code === selectedWilaya)?.name}` 
              : `Résultats de recherche (${communes.length})`
            }
          </h3>
          
          <div className="communes-table">
            <div className="table-header">
              <div className="header-cell">Commune</div>
              <div className="header-cell">Zone</div>
              <div className="header-cell">Stop Desk</div>
              <div className="header-cell">Prix Bureau</div>
              <div className="header-cell">Prix Domicile</div>
            </div>
            
            {communes.map((commune, index) => (
              <div key={index} className="table-row">
                <div className="table-cell">
                  <strong>{commune.name}</strong>
                </div>
                <div className="table-cell">
                  Zone {commune.zone}
                </div>
                <div className="table-cell">
                  {commune.hasStopDesk ? '✅ Oui' : '❌ Non'}
                </div>
                <div className="table-cell">
                  {commune.office ? (
                    <span className="price-value available">
                      {commune.office} DA
                    </span>
                  ) : (
                    <span className="price-value unavailable">
                      Non disponible
                    </span>
                  )}
                </div>
                <div className="table-cell">
                  <span className="price-value available">
                    {commune.home} DA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {communes.length === 0 && selectedWilaya && !loading && (
        <div className="empty-state">
          <p>Aucune commune trouvée pour cette wilaya.</p>
        </div>
      )}

      <div className="api-info">
        <h3>Informations API</h3>
        <p>
          <strong>Source:</strong> API officielle Yalidine<br/>
          <strong>Tarification:</strong> Basée sur les zones géographiques et la disponibilité des stop desks<br/>
          <strong>Mise à jour:</strong> Données en temps réel depuis Yalidine
        </p>
      </div>
    </div>
  );
}

export default YalidineApiPricing;
