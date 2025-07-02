import React, { useState, useEffect } from 'react';
import posService from '../services/posService';
import productIntegrationService from '../services/productIntegrationService';

function ProductImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  useEffect(() => {
    checkPOSConnection();
  }, []);

  const checkPOSConnection = async () => {
    try {
      const isConnected = await posService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const options = {
        searchTerm: searchTerm.trim() || undefined,
        limit: 50
      };

      const results = await productIntegrationService.importAndEnrichProducts(options);
      setImportResults(results);
      
      if (results.success) {
        setSelectedProducts(results.products);
      }
    } catch (error) {
      console.error('Erreur importation:', error);
      setImportResults({
        success: false,
        error: error.message,
        products: []
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveProduct = async (product, manualData) => {
    try {
      const productData = {
        ...product,
        dimensions: manualData.dimensions,
        weight: manualData.weight
      };

      const success = await productIntegrationService.saveEnrichedProduct(productData);
      
      if (success) {
        // Mettre à jour le produit dans la liste
        setSelectedProducts(prev => 
          prev.map(p => 
            p.id === product.id 
              ? { ...p, needs_manual_input: false, dimensions: manualData.dimensions, weight: manualData.weight }
              : p
          )
        );
        alert('Produit sauvegardé avec succès!');
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="product-importer">
      <div className="importer-header">
        <h2>Importation des produits POS</h2>
        <div className={`connection-status ${connectionStatus}`}>
          <span className="status-indicator"></span>
          {connectionStatus === 'connected' && 'Connecté au POS'}
          {connectionStatus === 'disconnected' && 'Déconnecté du POS'}
          {connectionStatus === 'error' && 'Erreur de connexion'}
          {connectionStatus === 'unknown' && 'Vérification...'}
        </div>
      </div>

      <div className="import-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Rechercher des produits (nom ou SKU)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button
            onClick={handleImport}
            disabled={isImporting || connectionStatus !== 'connected'}
            className="import-button"
          >
            {isImporting ? 'Importation...' : 'Importer depuis POS'}
          </button>
        </div>

        {isImporting && (
          <div className="import-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <p>Importation et enrichissement en cours...</p>
          </div>
        )}
      </div>

      {importResults && (
        <div className="import-results">
          {importResults.success ? (
            <div className="results-summary">
              <h3>Résultats de l'importation</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">{importResults.analysis.total_products}</span>
                  <span className="stat-label">Produits importés</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{importResults.analysis.found_in_sheets}</span>
                  <span className="stat-label">Trouvés dans Sheets</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{importResults.analysis.needs_manual_input}</span>
                  <span className="stat-label">Saisie manuelle</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{importResults.analysis.coverage_percentage}%</span>
                  <span className="stat-label">Couverture</span>
                </div>
              </div>

              {importResults.analysis.recommendations.length > 0 && (
                <div className="recommendations">
                  <h4>Recommandations</h4>
                  {importResults.analysis.recommendations.map((rec, index) => (
                    <div key={index} className={`recommendation ${rec.priority}`}>
                      <p>{rec.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="error-message">
              <h3>Erreur lors de l'importation</h3>
              <p>{importResults.error}</p>
            </div>
          )}
        </div>
      )}

      {selectedProducts.length > 0 && (
        <div className="products-list">
          <h3>Produits importés</h3>
          <div className="products-grid">
            {selectedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSave={handleSaveProduct}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [manualData, setManualData] = useState({
    dimensions: {
      length: product.dimensions.length || '',
      width: product.dimensions.width || '',
      height: product.dimensions.height || ''
    },
    weight: product.weight || ''
  });

  const handleSave = () => {
    onSave(product, manualData);
    setIsEditing(false);
  };

  return (
    <div className={`product-card ${product.needs_manual_input ? 'needs-input' : 'complete'}`}>
      <div className="product-header">
        <h4>{product.name}</h4>
        <span className="product-sku">{product.sku}</span>
        {product.enrichment.found_in_sheets && (
          <span className="match-badge">
            {product.enrichment.match_method} ({Math.round(product.enrichment.confidence * 100)}%)
          </span>
        )}
      </div>

      <div className="product-info">
        <p><strong>Marque:</strong> {product.brand}</p>
        <p><strong>Catégorie:</strong> {product.category}</p>
        <p><strong>Prix:</strong> {product.price} DZD</p>
      </div>

      <div className="product-dimensions">
        <h5>Dimensions et poids</h5>
        {product.needs_manual_input || isEditing ? (
          <div className="manual-input">
            <div className="input-row">
              <input
                type="number"
                placeholder="Longueur (cm)"
                value={manualData.dimensions.length}
                onChange={(e) => setManualData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, length: e.target.value }
                }))}
              />
              <input
                type="number"
                placeholder="Largeur (cm)"
                value={manualData.dimensions.width}
                onChange={(e) => setManualData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, width: e.target.value }
                }))}
              />
              <input
                type="number"
                placeholder="Hauteur (cm)"
                value={manualData.dimensions.height}
                onChange={(e) => setManualData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, height: e.target.value }
                }))}
              />
            </div>
            <div className="input-row">
              <input
                type="number"
                placeholder="Poids (kg)"
                value={manualData.weight}
                onChange={(e) => setManualData(prev => ({
                  ...prev,
                  weight: e.target.value
                }))}
              />
            </div>
            <div className="input-actions">
              <button onClick={handleSave} className="save-button">
                Sauvegarder
              </button>
              {!product.needs_manual_input && (
                <button onClick={() => setIsEditing(false)} className="cancel-button">
                  Annuler
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="dimensions-display">
            <p>L: {product.dimensions.length}cm, l: {product.dimensions.width}cm, H: {product.dimensions.height}cm</p>
            <p>Poids: {product.weight}kg</p>
            <button onClick={() => setIsEditing(true)} className="edit-button">
              Modifier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductImporter;
