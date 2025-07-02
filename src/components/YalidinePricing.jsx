import React, { useState, useEffect } from 'react';
import yalidineHybridService from '../services/yalidineHybridService';
import firebaseService from '../services/firebaseService';
import YalidineDiagnostic from './YalidineDiagnostic';
import { useResponsive } from '../hooks/use-mobile';

function YalidinePricing() {
  // Hooks pour la responsivité
  const responsive = useResponsive();

  // États pour les données
  const [wilayas, setWilayas] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [communes, setCommunes] = useState([]);
  const [filteredCommunes, setFilteredCommunes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceInfo, setServiceInfo] = useState({});
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // États pour l'édition
  const [editingCommune, setEditingCommune] = useState(null);
  const [newCommune, setNewCommune] = useState({
    name: '',
    office: '',
    home: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // États pour Firebase
  const [firebasePricing, setFirebasePricing] = useState([]);
  const [dataSource, setDataSource] = useState('firebase'); // 'firebase' ou 'api'
  const [firebaseStatus, setFirebaseStatus] = useState('loading');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedWilaya) {
      loadCommunesForWilaya();
    }
  }, [selectedWilaya]);

  useEffect(() => {
    filterCommunes();
  }, [communes, searchTerm]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement données depuis Firebase...');

      // Essayer de charger depuis Firebase d'abord
      try {
        setFirebaseStatus('loading');

        // Tester la connexion Firebase
        const connectionTest = await firebaseService.testConnection();
        if (!connectionTest.success) {
          throw new Error('Firebase non disponible');
        }

        // Charger les wilayas depuis Firebase
        const firebaseWilayas = await firebaseService.getWilayas();
        console.log(`📊 ${firebaseWilayas.length} wilayas trouvées dans Firebase`);

        if (firebaseWilayas.length > 0) {
          const formattedWilayas = firebaseWilayas
            .map(w => ({
              code: w.code.toString().padStart(2, '0'),
              name: w.name,
              nameAr: w.nameAr,
              zone: w.geography?.region || 'centre',
              id: w.code,
              region: w.geography?.region
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          setWilayas(formattedWilayas);
          setDataSource('firebase');
          setFirebaseStatus('connected');
          setServiceInfo({
            mode: 'Firebase',
            apiAvailable: true,
            fallbackMode: false,
            source: 'Firebase Database'
          });

          console.log(`✅ ${formattedWilayas.length} wilayas chargées depuis Firebase`);
          return;
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase indisponible, fallback vers API Yalidine:', firebaseError.message);
        setFirebaseStatus('error');
      }

      // Fallback vers l'API Yalidine si Firebase échoue
      console.log('🔄 Chargement depuis API Yalidine...');
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
      setDataSource('api');

      // Obtenir info service
      const info = yalidineHybridService.getServiceInfo();
      setServiceInfo({
        ...info,
        source: 'API Yalidine (Fallback)'
      });

      console.log(`✅ ${formattedWilayas.length} wilayas chargées depuis API (Mode: ${info.mode})`);

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      setFirebaseStatus('error');
      setServiceInfo({
        mode: 'Erreur',
        apiAvailable: false,
        fallbackMode: true,
        source: 'Aucune source disponible'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCommunesForWilaya = async () => {
    if (!selectedWilaya) return;

    setLoading(true);
    try {
      console.log(`🏘️ Chargement communes pour wilaya ${selectedWilaya}...`);

      const wilayaId = parseInt(selectedWilaya);
      const wilaya = wilayas.find(w => w.id === wilayaId);
      const wilayaCode = wilayaId; // Le code de la wilaya est le même que l'ID

      let communesList = [];

      // Essayer de charger depuis Firebase d'abord
      if (dataSource === 'firebase' && firebaseStatus === 'connected') {
        try {
          console.log(`📊 Chargement communes depuis Firebase pour wilaya code: ${wilayaCode}...`);

          // Vérifier la structure des données d'abord
          await firebaseService.checkDataStructure();

          // Charger les communes depuis Firebase avec le code de la wilaya
          const firebaseCommunes = await firebaseService.getCommunesByWilaya(wilayaCode);
          console.log(`📍 ${firebaseCommunes.length} communes trouvées dans Firebase`);

          // استخدام الأسعار المحفوظة مباشرة في البلديات من CSV
          console.log(`💰 استخدام الأسعار من البلديات مباشرة`);

          communesList = firebaseCommunes.map(c => {
            console.log(`📍 بلدية ${c.name}: مكتب=${c.pricing?.yalidine?.office}DA, منزل=${c.pricing?.yalidine?.home}DA`);

            return {
              id: c.code || c.id,
              name: c.name,
              office: c.pricing?.yalidine?.office || 0,
              home: c.pricing?.yalidine?.home || 0,
              hasStopDesk: c.pricing?.yalidine?.office > 0,
              zone: c.geography?.region || 'centre',
              deliveryTime: 48,
              pricing: c.pricing?.yalidine,
              source: 'firebase-csv'
            };
          }).sort((a, b) => a.name.localeCompare(b.name));

          // استخدام البيانات من Firebase (من CSV)
          if (communesList.length > 0) {
            setCommunes(communesList);
            console.log(`✅ ${communesList.length} communes chargées depuis Firebase (CSV data)`);
            return;
          }
        } catch (firebaseError) {
          console.warn('⚠️ Erreur Firebase pour communes, fallback vers API:', firebaseError.message);
        }
      }

      // Fallback vers l'API Yalidine
      console.log('🔄 Chargement communes depuis API Yalidine...');
      const allCommunes = await yalidineHybridService.loadCommunes();

      communesList = allCommunes
        .filter(c => c.wilaya_id === wilayaId && c.is_deliverable)
        .map(c => {
          const zonePricing = yalidineHybridService.getZonePricing()[wilaya?.zone || 3];

          return {
            id: c.id,
            name: c.name,
            office: c.has_stop_desk ? (c.pricing?.office || zonePricing.express_desk) : null,
            home: c.pricing?.home || zonePricing.express_home,
            hasStopDesk: c.has_stop_desk,
            zone: wilaya?.zone || 3,
            deliveryTime: c.delivery_time_parcel || 48,
            source: 'api'
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setCommunes(communesList);
      console.log(`✅ ${communesList.length} communes chargées depuis API`);

    } catch (error) {
      console.error('❌ Erreur chargement communes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCommunes = () => {
    if (!searchTerm.trim()) {
      setFilteredCommunes(communes);
      return;
    }

    const filtered = communes.filter(commune =>
      commune.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCommunes(filtered);
  };

  const handleRefresh = async () => {
    console.log('🔄 Actualisation des données...');

    // Forcer le rechargement depuis Firebase
    setFirebaseStatus('loading');
    setDataSource('firebase');

    // Recharger les données
    await loadInitialData();

    if (selectedWilaya) {
      await loadCommunesForWilaya();
    }

    console.log('✅ Actualisation terminée');
  };

  const switchToFirebase = async () => {
    console.log('🔥 Basculement vers Firebase...');
    setDataSource('firebase');
    setFirebaseStatus('loading');
    await loadInitialData();
    if (selectedWilaya) {
      await loadCommunesForWilaya();
    }
  };

  const switchToAPI = async () => {
    console.log('🌐 Basculement vers API...');
    setDataSource('api');
    await yalidineHybridService.forceReload();
    await loadInitialData();
    if (selectedWilaya) {
      await loadCommunesForWilaya();
    }
  };

  const handleEditCommune = (commune) => {
    setEditingCommune(commune);
    setNewCommune({
      name: commune.name,
      office: commune.office || '',
      home: commune.home || ''
    });
  };

  const handleSaveCommune = async () => {
    if (!editingCommune || !newCommune.name) return;

    try {
      console.log('💾 Sauvegarde commune dans Firebase:', newCommune);

      // Préparer les données de prix
      const pricingData = {
        service: 'yalidine',
        wilayaCode: parseInt(selectedWilaya),
        wilayaName: wilayas.find(w => w.code === selectedWilaya)?.name || '',
        commune: newCommune.name,
        communeCode: editingCommune.id,
        pricing: {
          home: parseInt(newCommune.home) || 0,
          office: parseInt(newCommune.office) || 0,
          supplements: {
            codFeePercentage: 1,
            codFeeFixed: 0,
            overweightFee: 250,
            overweightThreshold: 5
          }
        },
        zone: editingCommune.zone || 3,
        metadata: {
          dataSource: 'manual-edit',
          createdBy: 'yalidine-pricing-interface',
          updatedAt: new Date().toISOString()
        }
      };

      // Sauvegarder dans Firebase
      if (dataSource === 'firebase' && firebaseStatus === 'connected') {
        const result = await firebaseService.savePricing(pricingData);
        console.log('✅ Prix sauvegardé dans Firebase:', result.id);

        // Mettre à jour l'interface
        const updatedCommunes = communes.map(c =>
          c.id === editingCommune.id
            ? { ...c, name: newCommune.name, home: parseInt(newCommune.home), office: parseInt(newCommune.office) }
            : c
        );
        setCommunes(updatedCommunes);

        alert('✅ Prix sauvegardé avec succès dans Firebase!');
      } else {
        console.warn('⚠️ Firebase non disponible, sauvegarde locale uniquement');
        alert('⚠️ Firebase non disponible. Modification locale uniquement.');
      }

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setEditingCommune(null);
      setNewCommune({ name: '', office: '', home: '' });
    }
  };

  const handleCancelEdit = () => {
    setEditingCommune(null);
    setNewCommune({ name: '', office: '', home: '' });
  };

  const getStatusColor = () => {
    if (firebaseStatus === 'connected' && dataSource === 'firebase') return 'text-green-600';
    if (serviceInfo.apiAvailable && !serviceInfo.fallbackMode) return 'text-blue-600';
    if (serviceInfo.fallbackMode || dataSource === 'api') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (firebaseStatus === 'connected' && dataSource === 'firebase') return 'Firebase Database';
    if (serviceInfo.apiAvailable && !serviceInfo.fallbackMode) return 'API Yalidine';
    if (serviceInfo.fallbackMode || dataSource === 'api') return 'API Yalidine (Fallback)';
    if (firebaseStatus === 'loading') return 'Connexion...';
    return 'Service indisponible';
  };

  const getStatusIcon = () => {
    if (firebaseStatus === 'connected' && dataSource === 'firebase') return '🔥';
    if (serviceInfo.apiAvailable && !serviceInfo.fallbackMode) return '🌐';
    if (serviceInfo.fallbackMode || dataSource === 'api') return '⚠️';
    if (firebaseStatus === 'loading') return '⏳';
    return '❌';
  };

  return (
    <div className="yalidine-pricing-container">
      {/* Header */}
      <div className="pricing-header">
        <div className="header-content">
          <h2 className="pricing-title">
            {responsive.isMobile ? 'Tarifs Yalidine' : 'Tarifs Yalidine Firebase'}
          </h2>
          <div className="header-actions">
            <div className="status-indicator">
              <span className="status-icon">{getStatusIcon()}</span>
              <span className={`status-dot ${
                (firebaseStatus === 'connected' && dataSource === 'firebase') || serviceInfo.apiAvailable ? 'active' : 'inactive'
              }`}></span>
              <span className={`status-text ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <div className="data-source-switcher">
              <button
                onClick={switchToFirebase}
                disabled={loading || (dataSource === 'firebase' && firebaseStatus === 'connected')}
                className={`source-btn firebase ${dataSource === 'firebase' ? 'active' : ''}`}
                title="Utiliser Firebase"
              >
                🔥 Firebase
              </button>
              <button
                onClick={switchToAPI}
                disabled={loading || dataSource === 'api'}
                className={`source-btn api ${dataSource === 'api' ? 'active' : ''}`}
                title="Utiliser API Yalidine"
              >
                🌐 API
              </button>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="refresh-btn"
              title="Actualiser les données"
            >
              <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>⟳</span>
              {responsive.isMobile ? '' : 'Actualiser'}
            </button>
            <button
              onClick={() => setShowDiagnostic(!showDiagnostic)}
              className="diagnostic-btn"
            >
              {responsive.isMobile ? '🔧' : 'Diagnostic'}
            </button>
          </div>
        </div>
        
        {showDiagnostic && (
          <div className="diagnostic-panel">
            <YalidineDiagnostic />

            {/* Informations Firebase */}
            <div className="firebase-info">
              <h4>📊 Informations Firebase</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`info-value ${firebaseStatus}`}>
                    {firebaseStatus === 'connected' ? '✅ Connecté' :
                     firebaseStatus === 'loading' ? '⏳ Connexion...' :
                     '❌ Erreur'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Source active:</span>
                  <span className="info-value">
                    {dataSource === 'firebase' ? '🔥 Firebase' : '🌐 API Yalidine'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Wilayas:</span>
                  <span className="info-value">{wilayas.length}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Communes:</span>
                  <span className="info-value">{communes.length}</span>
                </div>
                {communes.length > 0 && (
                  <div className="info-item">
                    <span className="info-label">Prix disponibles:</span>
                    <span className="info-value">
                      {communes.filter(c => c.home || c.office).length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wilaya Selection */}
      <div className="wilaya-section">
        <div className="section-header">
          <h3 className="section-title">Sélection de la wilaya</h3>
          <div className="section-info">
            <span className="section-count">{wilayas.length} wilayas disponibles</span>
            <span className={`data-source ${dataSource === 'firebase' ? 'firebase' : 'api'}`}>
              {dataSource === 'firebase' ? '🔥 Firebase' : '🌐 API'}
            </span>
          </div>
        </div>
        
        <div className="wilaya-selector">
          <select
            value={selectedWilaya}
            onChange={(e) => setSelectedWilaya(e.target.value)}
            className="wilaya-select"
            disabled={loading}
          >
            <option value="">Choisir une wilaya...</option>
            {wilayas.map(wilaya => (
              <option key={wilaya.code} value={wilaya.code}>
                {wilaya.code} - {wilaya.name} (Zone {wilaya.zone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Communes Section */}
      {selectedWilaya && (
        <div className="communes-section">
          <div className="section-header">
            <h3 className="section-title">
              Communes - {wilayas.find(w => w.code === selectedWilaya)?.name}
            </h3>
            <div className="section-actions">
              <div className="section-info">
                <span className="section-count">
                  {filteredCommunes.length} commune{filteredCommunes.length > 1 ? 's' : ''}
                </span>
                {communes.length > 0 && (
                  <span className={`data-source ${communes[0]?.source === 'firebase' ? 'firebase' : 'api'}`}>
                    {communes[0]?.source === 'firebase' ? '🔥 Prix Firebase' : '🌐 Prix API'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="add-btn"
              >
                Ajouter commune
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="search-section">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Rechercher une commune..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">⌕</span>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="add-form">
              <h4>Ajouter une nouvelle commune</h4>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Nom de la commune"
                  value={newCommune.name}
                  onChange={(e) => setNewCommune({...newCommune, name: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Prix bureau (DA)"
                  value={newCommune.office}
                  onChange={(e) => setNewCommune({...newCommune, office: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Prix domicile (DA)"
                  value={newCommune.home}
                  onChange={(e) => setNewCommune({...newCommune, home: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button onClick={handleSaveCommune} className="save-btn">
                  Sauvegarder
                </button>
                <button onClick={() => setShowAddForm(false)} className="cancel-btn">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Communes Table */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>Chargement des communes...</span>
            </div>
          ) : (
            <div className="communes-table-container">
              <table className="communes-table">
                <thead>
                  <tr>
                    <th>Commune</th>
                    <th>Prix Bureau</th>
                    <th>Prix Domicile</th>
                    <th>Point Relais</th>
                    <th>Zone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommunes.map(commune => (
                    <tr key={commune.id} className="commune-row">
                      <td className="commune-name">{commune.name}</td>
                      <td className="price-cell">
                        {commune.office ? `${commune.office} DA` : 'Non disponible'}
                      </td>
                      <td className="price-cell">{commune.home} DA</td>
                      <td className="status-cell">
                        {commune.hasStopDesk ? (
                          <span className="status-badge available">Disponible</span>
                        ) : (
                          <span className="status-badge unavailable">Non disponible</span>
                        )}
                      </td>
                      <td className="zone-cell">Zone {commune.zone}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleEditCommune(commune)}
                          className="edit-btn"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredCommunes.length === 0 && !loading && (
                <div className="empty-state">
                  <p>Aucune commune trouvée</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="clear-search-btn"
                    >
                      Effacer la recherche
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingCommune && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Modifier {editingCommune.name}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Prix Bureau (DA)</label>
                <input
                  type="number"
                  value={newCommune.office}
                  onChange={(e) => setNewCommune({...newCommune, office: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Prix Domicile (DA)</label>
                <input
                  type="number"
                  value={newCommune.home}
                  onChange={(e) => setNewCommune({...newCommune, home: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={handleSaveCommune} className="save-btn">
                Sauvegarder
              </button>
              <button onClick={handleCancelEdit} className="cancel-btn">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default YalidinePricing;
