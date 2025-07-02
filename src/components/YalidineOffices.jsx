import React, { useState, useEffect } from 'react';
import yalidineHybridService from '../services/yalidineHybridService';

function YalidineOffices() {
  const [wilayas, setWilayas] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [offices, setOffices] = useState([]);
  const [filteredOffices, setFilteredOffices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [serviceInfo, setServiceInfo] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedWilaya || searchTerm) {
      searchOffices();
    } else {
      setFilteredOffices([]);
    }
  }, [selectedWilaya, searchTerm]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement données bureaux...');
      
      // Charger les wilayas
      const wilayasList = await yalidineHybridService.loadWilayas();
      const formattedWilayas = wilayasList
        .filter(w => w.is_deliverable)
        .map(w => ({
          code: w.id.toString().padStart(2, '0'),
          name: w.name,
          zone: w.zone,
          id: w.id
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setWilayas(formattedWilayas);
      
      // Obtenir info service
      const info = yalidineHybridService.getServiceInfo();
      setServiceInfo(info);
      
      console.log(`✅ ${formattedWilayas.length} wilayas chargées pour bureaux`);
    } catch (error) {
      console.error('❌ Erreur chargement données bureaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchOffices = async () => {
    setLoading(true);
    setLoadingMessage('Recherche des bureaux...');

    try {
      console.log(`🏢 Recherche bureaux: "${searchTerm}" dans wilaya ${selectedWilaya}`);

      const wilayaId = selectedWilaya ? parseInt(selectedWilaya) : null;

      // Mettre à jour le message selon la source de données
      const info = yalidineHybridService.getServiceInfo();
      if (info.fallbackMode) {
        setLoadingMessage('Chargement depuis données locales...');
      } else {
        setLoadingMessage('Connexion à l\'API Zimou Express...');
      }

      const results = await yalidineHybridService.searchOffices(searchTerm, wilayaId);

      setFilteredOffices(results);
      console.log(`✅ ${results.length} bureaux trouvés`);
    } catch (error) {
      console.error('❌ Erreur recherche bureaux:', error);
      setFilteredOffices([]);
      setLoadingMessage('Erreur de chargement');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleRefresh = async () => {
    await yalidineHybridService.forceReload();
    await loadInitialData();
    if (selectedWilaya || searchTerm) {
      await searchOffices();
    }
  };

  const handleFallbackMode = async () => {
    setLoading(true);
    setLoadingMessage('Basculement vers données locales...');

    try {
      // Forcer le mode fallback
      yalidineHybridService.fallbackMode = true;
      yalidineHybridService.apiAvailable = false;

      // Recharger les données
      await loadInitialData();
      if (selectedWilaya || searchTerm) {
        await searchOffices();
      }
    } catch (error) {
      console.error('❌ Erreur basculement fallback:', error);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const getStatusColor = () => {
    if (serviceInfo.apiAvailable && !serviceInfo.fallbackMode) return 'text-green-600';
    if (serviceInfo.fallbackMode) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (serviceInfo.apiAvailable && !serviceInfo.fallbackMode) return 'API Zimou Express';
    if (serviceInfo.fallbackMode) return 'Données locales';
    return 'Service indisponible';
  };

  return (
    <div className="yalidine-offices-container">
      {/* Header */}
      <div className="offices-header">
        <div className="header-content">
          <h2 className="offices-title">Bureaux et Points Relais</h2>
          <div className="header-actions">
            <div className="status-indicator">
              <span className={`status-dot ${serviceInfo.apiAvailable ? 'active' : 'inactive'}`}></span>
              <span className={`status-text ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="refresh-btn"
              title="Actualiser les données"
            >
              <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>⟳</span>
              Actualiser
            </button>
            {!serviceInfo.fallbackMode && (
              <button
                onClick={handleFallbackMode}
                disabled={loading}
                className="fallback-btn"
                title="Utiliser les données locales"
              >
                Mode Local
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-grid">
          <div className="search-field">
            <label className="field-label">Rechercher un bureau</label>
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Nom du bureau, commune, adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">⌕</span>
            </div>
          </div>
          
          <div className="filter-field">
            <label className="field-label">Filtrer par wilaya</label>
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="wilaya-select"
            >
              <option value="">Toutes les wilayas</option>
              {wilayas.map(wilaya => (
                <option key={wilaya.code} value={wilaya.code}>
                  {wilaya.code} - {wilaya.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="results-section">
        <div className="results-header">
          <h3 className="results-title">
            {loading ? (loadingMessage || 'Recherche en cours...') : `${filteredOffices.length} bureau${filteredOffices.length > 1 ? 'x' : ''} trouvé${filteredOffices.length > 1 ? 's' : ''}`}
          </h3>
          {!loading && filteredOffices.length > 0 && (
            <span className="data-source">
              Source: {serviceInfo.fallbackMode ? 'Données locales' : 'API Zimou Express'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <div className="loading-details">
              <span className="loading-main">{loadingMessage || 'Chargement des bureaux...'}</span>
              {!serviceInfo.fallbackMode && (
                <span className="loading-sub">Cela peut prendre jusqu'à 45 secondes...</span>
              )}
            </div>
          </div>
        ) : (
          <div className="offices-grid">
            {filteredOffices.map(office => (
              <div key={office.id} className="office-card">
                <div className="office-header">
                  <h4 className="office-name">{office.name}</h4>
                  <span className={`office-status ${office.is_active ? 'active' : 'inactive'}`}>
                    {office.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                
                <div className="office-details">
                  <div className="detail-row">
                    <span className="detail-label">Adresse:</span>
                    <span className="detail-value">{office.address}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Commune:</span>
                    <span className="detail-value">{office.commune_name}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Wilaya:</span>
                    <span className="detail-value">{office.wilaya_name}</span>
                  </div>
                  
                  {office.phone && (
                    <div className="detail-row">
                      <span className="detail-label">Téléphone:</span>
                      <span className="detail-value">{office.phone}</span>
                    </div>
                  )}
                </div>

                {office.coordinates && office.coordinates.latitude && (
                  <div className="office-actions">
                    <button
                      onClick={() => {
                        const url = `https://maps.google.com/?q=${office.coordinates.latitude},${office.coordinates.longitude}`;
                        window.open(url, '_blank');
                      }}
                      className="map-btn"
                    >
                      Voir sur la carte
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {!loading && filteredOffices.length === 0 && (selectedWilaya || searchTerm) && (
              <div className="empty-state">
                <p>Aucun bureau trouvé</p>
                <p className="empty-subtitle">
                  Essayez de modifier vos critères de recherche
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedWilaya('');
                  }}
                  className="clear-search-btn"
                >
                  Effacer les filtres
                </button>
              </div>
            )}
            
            {!loading && filteredOffices.length === 0 && !selectedWilaya && !searchTerm && (
              <div className="empty-state">
                <p>Recherchez des bureaux</p>
                <p className="empty-subtitle">
                  Utilisez la recherche ou sélectionnez une wilaya pour voir les bureaux disponibles
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default YalidineOffices;
