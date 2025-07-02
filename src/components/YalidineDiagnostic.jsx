import React, { useState } from 'react';
import yalidineGoogleSheetsService from '../services/yalidineGoogleSheetsService';
import APIRateLimiterMonitor from './APIRateLimiterMonitor';

function YalidineDiagnostic() {
  const [testDestination, setTestDestination] = useState('Oran, Algeria');
  const [deliveryType, setDeliveryType] = useState('home');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const runDiagnostic = async () => {
    setLoading(true);
    setLogs([]);
    setResult(null);

    // Capturer les logs console
    const originalLog = console.log;
    const capturedLogs = [];
    
    console.log = (...args) => {
      const message = args.join(' ');
      capturedLogs.push({
        timestamp: new Date().toLocaleTimeString(),
        message: message
      });
      originalLog(...args);
    };

    try {
      // Test 1: Recherche directe
      console.log('=== DIAGNOSTIC YALIDINE ===');
      console.log(`Destination: "${testDestination}"`);
      console.log(`Type de livraison: ${deliveryType}`);
      
      const price = await yalidineGoogleSheetsService.searchPriceByDestination(
        testDestination, 
        deliveryType
      );

      // Test 2: Recherche par commune seulement
      const communeName = testDestination.split(',')[0].trim();
      console.log(`--- Test recherche par commune: "${communeName}" ---`);
      const communeResults = await yalidineGoogleSheetsService.searchCommune(communeName);
      
      // Test 3: Charger toutes les données
      console.log('--- Chargement données complètes ---');
      const allData = await yalidineGoogleSheetsService.loadAllPricing();
      const wilayas = Object.keys(allData);
      console.log(`Wilayas disponibles: ${wilayas.join(', ')}`);
      
      // Test 4: Recherche dans Oran spécifiquement
      if (allData['31']) {
        console.log('--- Données Oran (31) ---');
        console.log(`Nom wilaya: ${allData['31'].name}`);
        console.log(`Communes: ${Object.keys(allData['31'].communes).join(', ')}`);
        
        if (allData['31'].communes['Oran']) {
          console.log(`Prix Oran: Bureau=${allData['31'].communes['Oran'].office}, Domicile=${allData['31'].communes['Oran'].home}`);
        }
      }

      setResult({
        price: price,
        communeResults: communeResults,
        totalWilayas: wilayas.length,
        oranData: allData['31'] || null,
        success: price !== null
      });

    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
      setResult({
        error: error.message,
        success: false
      });
    } finally {
      // Restaurer console.log
      console.log = originalLog;
      setLogs(capturedLogs);
      setLoading(false);
    }
  };

  const testDestinations = [
    'Oran, Algeria',
    'Oran, Oran',
    'Alger, Algeria',
    'Alger, Alger',
    'Constantine, Algeria',
    'Blida, Algeria'
  ];

  return (
    <div className="yalidine-diagnostic">
      <div className="diagnostic-header">
        <h2>Diagnostic Yalidine</h2>
        <p>Outil de diagnostic pour tester la recherche des prix Yalidine</p>
      </div>

      <div className="diagnostic-controls">
        <div className="control-group">
          <label>Destination à tester:</label>
          <select 
            value={testDestination} 
            onChange={(e) => setTestDestination(e.target.value)}
            className="destination-select"
          >
            {testDestinations.map(dest => (
              <option key={dest} value={dest}>{dest}</option>
            ))}
          </select>
          <input
            type="text"
            value={testDestination}
            onChange={(e) => setTestDestination(e.target.value)}
            placeholder="Ou tapez une destination personnalisée"
            className="destination-input"
          />
        </div>

        <div className="control-group">
          <label>Type de livraison:</label>
          <div className="delivery-type-controls">
            <label>
              <input
                type="radio"
                value="office"
                checked={deliveryType === 'office'}
                onChange={(e) => setDeliveryType(e.target.value)}
              />
              Bureau
            </label>
            <label>
              <input
                type="radio"
                value="home"
                checked={deliveryType === 'home'}
                onChange={(e) => setDeliveryType(e.target.value)}
              />
              Domicile
            </label>
          </div>
        </div>

        <button 
          onClick={runDiagnostic} 
          disabled={loading}
          className="diagnostic-button"
        >
          {loading ? 'Test en cours...' : 'Lancer le diagnostic'}
        </button>
      </div>

      {result && (
        <div className="diagnostic-results">
          <h3>Résultats du diagnostic</h3>
          
          <div className={`result-summary ${result.success ? 'success' : 'error'}`}>
            {result.success ? (
              <div>
                <h4>✅ Prix trouvé: {result.price} DA</h4>
                <p>La recherche a réussi!</p>
              </div>
            ) : (
              <div>
                <h4>❌ Aucun prix trouvé</h4>
                <p>La recherche a échoué. Voir les logs pour plus de détails.</p>
                {result.error && <p className="error-message">Erreur: {result.error}</p>}
              </div>
            )}
          </div>

          {result.communeResults && result.communeResults.length > 0 && (
            <div className="commune-results">
              <h4>Résultats de recherche par commune:</h4>
              <ul>
                {result.communeResults.map((commune, index) => (
                  <li key={index}>
                    {commune.communeName} ({commune.wilayaName}) - 
                    Bureau: {commune.office} DA, Domicile: {commune.home} DA
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.oranData && (
            <div className="oran-data">
              <h4>Données Oran disponibles:</h4>
              <p><strong>Nom:</strong> {result.oranData.name}</p>
              <p><strong>Communes:</strong> {Object.keys(result.oranData.communes).length}</p>
              <ul>
                {Object.entries(result.oranData.communes).slice(0, 5).map(([name, prices]) => (
                  <li key={name}>
                    {name}: Bureau {prices.office} DA, Domicile {prices.home} DA
                  </li>
                ))}
                {Object.keys(result.oranData.communes).length > 5 && (
                  <li>... et {Object.keys(result.oranData.communes).length - 5} autres</li>
                )}
              </ul>
            </div>
          )}

          <div className="data-summary">
            <p><strong>Total wilayas chargées:</strong> {result.totalWilayas}</p>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="diagnostic-logs">
          <h3>Logs détaillés</h3>
          <div className="logs-container">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                <span className="log-timestamp">{log.timestamp}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moniteur Rate Limiter */}
      <APIRateLimiterMonitor />

      <div className="diagnostic-tips">
        <h3>Conseils de dépannage</h3>
        <ul>
          <li><strong>Prix non trouvé:</strong> Vérifiez que la destination existe dans Google Sheets</li>
          <li><strong>Format destination:</strong> Utilisez "Commune, Wilaya" ou "Commune, Algeria"</li>
          <li><strong>Données manquantes:</strong> Vérifiez la connexion à Google Sheets</li>
          <li><strong>Recherche lente:</strong> Les données sont mises en cache pendant 2 minutes</li>
          <li><strong>Rate Limiting:</strong> Les requêtes API sont limitées à 3/sec et 30/min pour la sécurité</li>
        </ul>
      </div>
    </div>
  );
}

export default YalidineDiagnostic;
