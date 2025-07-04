import React, { useState, useEffect, useCallback, useRef } from 'react';
import Select from 'react-select';
import firebaseService from '../services/firebaseService';
import { MapPin, Database, CheckCircle, MapPinIcon } from 'lucide-react';

function YalidineWilayaCommuneSelector({ value, onChange }) {
  const [wilayas, setWilayas] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const loadingRef = useRef(false);

  // Styles personnalisés pour React Select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '48px',
      fontSize: '17px',
      border: state.isFocused ? '2px solid #3b82f6' : '2px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        border: '2px solid #3b82f6',
      },
      padding: '4px 8px',
      backgroundColor: '#ffffff',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '17px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1f2937',
      fontSize: '17px',
      fontWeight: '500',
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '16px',
      padding: '12px 16px',
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
        ? '#f3f4f6'
        : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#1f2937',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6',
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 9999,
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '200px',
      borderRadius: '12px',
    }),
    loadingIndicator: (provided) => ({
      ...provided,
      color: '#3b82f6',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#6b7280',
      '&:hover': {
        color: '#3b82f6',
      },
    }),
  };

  // Gérer la valeur initiale
  useEffect(() => {
    if (value && typeof value === 'object' && value.wilayaCode && value.communeName) {
      // Trouver la wilaya correspondante
      const wilayaOption = wilayas.find(w => w.value === value.wilayaCode.toString());
      if (wilayaOption && !selectedWilaya) {
        setSelectedWilaya(wilayaOption);
        // Charger les communes pour cette wilaya
        loadCommunes(value.wilayaCode.toString()).then(() => {
          // Trouver la commune correspondante après le chargement
          setTimeout(() => {
            const communeOption = communes.find(c => c.label === value.communeName);
            if (communeOption && !selectedCommune) {
              setSelectedCommune(communeOption);
            }
          }, 100);
        });
      }
    } else if (typeof value === 'string' && value) {
      // Reset si c'est un string vide ou différent
      setSelectedWilaya(null);
      setSelectedCommune(null);
    }
  }, [value, wilayas]); // إزالة communes من dependency array

  useEffect(() => {
    loadWilayas();

    // Recharger les données toutes les 5 minutes pour s'assurer d'avoir les dernières données
    const interval = setInterval(() => {
      console.log('🔄 Rechargement automatique des wilayas...');
      loadWilayas();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedWilaya && selectedWilaya.value) {
      // فقط تحميل البلديات إذا لم تكن محملة من قبل لهذه الولاية
      if (communes.length === 0 || !communes[0]?.wilayaCode || communes[0].wilayaCode !== selectedWilaya.value) {
        console.log(`🏘️ تحميل البلديات للولاية ${selectedWilaya.value}...`);
        loadCommunes(selectedWilaya.value);
      }
    } else {
      setCommunes([]);
      setSelectedCommune(null);
      setLoadingCommunes(false); // تأكد من إيقاف التحميل
    }
  }, [selectedWilaya]);

  // إيقاف التحميل عند تغيير البلدية المختارة
  useEffect(() => {
    if (selectedCommune !== null) {
      loadingRef.current = false;
      setLoadingCommunes(false);
    }
  }, [selectedCommune]);

  useEffect(() => {
    // Mettre à jour la valeur finale avec informations complètes
    if (selectedWilaya && selectedCommune) {
      // إيقاف التحميل عند وجود كلا الاختيارين
      loadingRef.current = false;
      setLoadingCommunes(false);
      
      const destination = `${selectedCommune.name}, ${selectedWilaya.name}`;

      // Passer les informations complètes incluant les prix
      const fullDestinationInfo = {
        text: destination,
        wilayaCode: parseInt(selectedWilaya.code), // استخدام code من البيانات
        wilayaName: selectedWilaya.name,
        communeName: selectedCommune.name,
        pricing: {
          yalidine: selectedCommune.pricing || {}, // البيانات مباشرة من Firebase
          source: 'firebase'
        },
        zone: selectedWilaya.zone !== undefined ? selectedWilaya.zone : (selectedWilaya.deliveryConfig?.pricingZone !== undefined ? selectedWilaya.deliveryConfig.pricingZone : 1)
      };

      console.log('📍 Destination sélectionnée avec prix détaillés:');
      console.log('  - selectedCommune.pricing:', selectedCommune.pricing);
      console.log('  - fullDestinationInfo.pricing.yalidine:', fullDestinationInfo.pricing.yalidine);

      console.log('📍 Destination sélectionnée avec prix:', fullDestinationInfo);
      onChange(fullDestinationInfo);
    } else {
      onChange('');
    }
  }, [selectedWilaya, selectedCommune, onChange]);

  const loadWilayas = async () => {
    setLoading(true);
    try {
      console.log('📍 Chargement wilayas depuis Firebase...');

      const wilayasList = await firebaseService.getWilayas();
      console.log(`📍 ${wilayasList.length} wilayas chargées depuis Firebase`);

      // Convertir en format React Select et trier par code
      const wilayaOptions = wilayasList
        .sort((a, b) => {
          const codeA = parseInt(a.code) || 0;
          const codeB = parseInt(b.code) || 0;
          return codeA - codeB;
        })
        .map(wilaya => ({
          value: wilaya.code.toString(),
          label: `${wilaya.code} - ${wilaya.name}`,
          name: wilaya.name,
          code: wilaya.code,
          zone: wilaya.deliveryConfig?.pricingZone !== undefined ? wilaya.deliveryConfig.pricingZone : 1,
          is_deliverable: true
        }));

      setWilayas(wilayaOptions);
    } catch (error) {
      console.error('Erreur chargement wilayas depuis Firebase:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunes = async (wilayaCode) => {
    if (!wilayaCode) return;

    // منع التحميل المتعدد
    if (loadingRef.current) {
      console.log('🚫 تحميل البلديات قيد التنفيذ بالفعل، تجاهل الطلب');
      return;
    }

    console.log(`🏘️ بدء تحميل البلديات للولاية ${wilayaCode}...`);
    setLoadingCommunes(true);
    loadingRef.current = true;
    try {
      console.log(`🏘️ Chargement communes pour wilaya ${wilayaCode} depuis Firebase...`);

      const wilayaId = parseInt(wilayaCode);
      const communesList = await firebaseService.getCommunesByWilaya(wilayaId);

      // Convertir en format React Select
      const communeOptions = communesList
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(commune => {
          console.log(`🏘️ معالجة بلدية: ${commune.name}, pricing:`, commune.pricing);
          return {
            value: commune.name,
            label: commune.name,
            name: commune.name,
            has_stop_desk: commune.pricing?.office > 0,
            delivery_time: 48,
            pricing: commune.pricing, // البيانات مخزنة مباشرة في pricing
            is_deliverable: true,
            wilayaCode: wilayaCode // إضافة معرف الولاية لتجنب إعادة التحميل
          };
        });

      setCommunes(communeOptions);
      setSelectedCommune(null); // Reset commune selection
      console.log(`🏘️ ${communeOptions.length} communes chargées depuis Firebase pour wilaya ${wilayaCode}`);
    } catch (error) {
      console.error('Erreur chargement communes depuis Firebase:', error);
      setCommunes([]); // تأكد من إفراغ القائمة في حالة الخطأ
    } finally {
      console.log('🏘️ إيقاف تحميل البلديات...');
      loadingRef.current = false;
      setLoadingCommunes(false);
    }
  };

  // Gestionnaires d'événements pour React Select
  const handleWilayaChange = useCallback((selectedOption) => {
    setSelectedWilaya(selectedOption);
    setSelectedCommune(null);
    // لا نحتاج لاستدعاء loadCommunes هنا لأن useEffect سيتولى ذلك
  }, []);

  const handleCommuneChange = useCallback((selectedOption) => {
    console.log('🏘️ Commune sélectionnée:', selectedOption);

    // إيقاف التحميل فوراً عند اختيار أي بلدية (حتى لو null)
    loadingRef.current = false;
    setLoadingCommunes(false);

    // تحديث البلدية المختارة
    setSelectedCommune(selectedOption);

    console.log('✅ تم إيقاف التحميل وتحديث البلدية المختارة');
  }, []);

  // معالجات إضافية لإيقاف التحميل
  const stopLoading = useCallback(() => {
    loadingRef.current = false;
    setLoadingCommunes(false);
  }, []);

  return (
    <div className="destination-selector" style={{ fontSize: '18px' }}>
      <div className="form-section-professional">
        <div className="section-header">
          <MapPin className="section-icon" />
          <h3 className="section-title" style={{ fontSize: '20px' }}>Adresse de destination</h3>
        </div>

        <div className="data-source-professional">
          <div className="source-info">
            <Database className="source-icon" />
            <span style={{ fontSize: '16px' }}>Source: Firebase Database (CSV Data)</span>
          </div>
          <button
            onClick={() => loadWilayas()}
            disabled={loading}
            className="refresh-btn-professional"
            title="Actualiser les données depuis Firebase"
            style={{ fontSize: '16px' }}
          >
            <span className={`refresh-icon-professional ${loading ? 'spinning' : ''}`}>⟳</span>
            Actualiser
          </button>
        </div>

        {/* Sélection de la Wilaya */}
        <div className="input-professional">
          <label style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <MapPin size={16} />
            <span>Sélectionner la wilaya</span>
          </label>

          <Select
            value={selectedWilaya}
            onChange={handleWilayaChange}
            options={wilayas}
            styles={customStyles}
            placeholder="Tapez pour rechercher une wilaya..."
            isSearchable
            isClearable
            isLoading={loading}
            loadingMessage={() => "Chargement des wilayas..."}
            noOptionsMessage={() => "Aucune wilaya trouvée"}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />

          {!selectedWilaya && (
            <div className="help-text-professional" style={{ marginTop: '8px', fontSize: '16px', color: '#6b7280' }}>
              Sélectionnez d'abord la wilaya, puis la commune dans cette wilaya
            </div>
          )}
        </div>

        {/* Sélection de la Commune */}
        {selectedWilaya && (
          <div className="input-professional">
            <label style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={16} />
              <span>Sélectionner la commune</span>
            </label>

            <Select
              key={`commune-select-${selectedWilaya?.value || 'none'}-${communes.length}`}
              value={selectedCommune}
              onChange={handleCommuneChange}
              options={communes}
              styles={customStyles}
              placeholder="Tapez pour rechercher une commune..."
              isSearchable
              isClearable
              isLoading={loadingCommunes && loadingRef.current}
              isDisabled={!selectedWilaya}
              onMenuOpen={stopLoading}
              onMenuClose={stopLoading}
              onInputChange={stopLoading}
              onFocus={stopLoading}
              loadingMessage={() => "Chargement des communes..."}
              noOptionsMessage={() => "Aucune commune trouvée"}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              formatOptionLabel={(option) => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{option.label}</span>
                  {option.has_stop_desk && (
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      Point relais
                    </span>
                  )}
                </div>
              )}
            />
          </div>
        )}

        {/* Résumé de la sélection - Design compact et moderne */}
        {selectedWilaya && selectedCommune && (
          <div style={{
            marginTop: '16px',
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease'
          }}>
            {/* Background decoration subtile */}
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-30%',
              width: '150%',
              height: '150%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)',
              pointerEvents: 'none'
            }} />

            {/* Header compact */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              position: 'relative',
              zIndex: 1
            }}>
              <CheckCircle size={16} color="white" />
              <h4 style={{
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                margin: 0,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}>
                Destination sélectionnée
              </h4>
            </div>

            {/* Contenu compact */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              position: 'relative',
              zIndex: 1,
              flexWrap: 'wrap'
            }}>
              {/* Nom de la commune et wilaya */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                minWidth: '200px'
              }}>
                <MapPinIcon size={14} color="white" />
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    lineHeight: '1.2'
                  }}>
                    {selectedCommune?.label}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: '400',
                    lineHeight: '1.2'
                  }}>
                    {selectedWilaya?.name}
                  </span>
                </div>
              </div>

              {/* Zone badge */}
              <div style={{
                padding: '4px 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: '12px',
                  color: 'white',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Zone {selectedWilaya?.zone}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default YalidineWilayaCommuneSelector;
