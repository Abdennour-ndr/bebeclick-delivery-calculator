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

  useEffect(() => {
    if (value && typeof value === 'object' && value.wilayaCode && value.communeName) {
      const wilayaOption = wilayas.find(w => w.value === value.wilayaCode.toString());
      if (wilayaOption && !selectedWilaya) {
        setSelectedWilaya(wilayaOption);
        loadCommunes(value.wilayaCode.toString()).then(() => {
          setTimeout(() => {
            const communeOption = communes.find(c => c.label === value.communeName);
            if (communeOption && !selectedCommune) {
              setSelectedCommune(communeOption);
            }
          }, 100);
        });
      }
    } else if (typeof value === 'string' && value) {
      setSelectedWilaya(null);
      setSelectedCommune(null);
    }
  }, [value, wilayas]);

  useEffect(() => {
    loadWilayas();
    const interval = setInterval(() => {
      console.log('🔄 Rechargement automatique des wilayas...');
      loadWilayas();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedWilaya?.value) {
      if (communes.length === 0 || communes[0]?.wilayaCode !== selectedWilaya.value) {
        loadCommunes(selectedWilaya.value);
      }
    } else {
      setCommunes([]);
      setSelectedCommune(null);
      setLoadingCommunes(false);
    }
  }, [selectedWilaya]);

  useEffect(() => {
    if (selectedCommune !== null) {
      loadingRef.current = false;
      setLoadingCommunes(false);
    }
  }, [selectedCommune]);

  useEffect(() => {
    if (selectedWilaya && selectedCommune) {
      loadingRef.current = false;
      setLoadingCommunes(false);
      const destination = `${selectedCommune.name}, ${selectedWilaya.name}`;
      const fullDestinationInfo = {
        text: destination,
        wilayaCode: parseInt(selectedWilaya.code),
        wilayaName: selectedWilaya.name,
        communeName: selectedCommune.name,
        pricing: {
          yalidine: selectedCommune.pricing || {},
          source: 'firebase'
        },
        zone: selectedWilaya.zone !== undefined ? selectedWilaya.zone : (selectedWilaya.deliveryConfig?.pricingZone !== undefined ? selectedWilaya.deliveryConfig.pricingZone : 1)
      };
      onChange(fullDestinationInfo);
    } else {
      onChange('');
    }
  }, [selectedWilaya, selectedCommune, onChange]);

  const loadWilayas = async () => {
    setLoading(true);
    try {
      const wilayasList = await firebaseService.getWilayas();
      const wilayaOptions = wilayasList.sort((a, b) => parseInt(a.code) - parseInt(b.code)).map(wilaya => ({
        value: wilaya.code.toString(),
        label: `${wilaya.code} - ${wilaya.name}`,
        name: wilaya.name,
        code: wilaya.code,
        zone: wilaya.deliveryConfig?.pricingZone !== undefined ? wilaya.deliveryConfig.pricingZone : 1,
        is_deliverable: true
      }));
      setWilayas(wilayaOptions);
    } catch (error) {
      console.error('Erreur chargement wilayas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunes = async (wilayaCode) => {
    if (!wilayaCode || loadingRef.current) return;
    setLoadingCommunes(true);
    loadingRef.current = true;
    try {
      const communesList = await firebaseService.getCommunesByWilaya(parseInt(wilayaCode));
      const communeOptions = communesList.sort((a, b) => a.name.localeCompare(b.name)).map(commune => ({
        value: commune.name,
        label: commune.name,
        name: commune.name,
        has_stop_desk: commune.pricing?.office > 0,
        delivery_time: 48,
        pricing: commune.pricing,
        is_deliverable: true,
        wilayaCode
      }));
      setCommunes(communeOptions);
      setSelectedCommune(null);
    } catch (error) {
      console.error('Erreur chargement communes:', error);
      setCommunes([]);
    } finally {
      loadingRef.current = false;
      setLoadingCommunes(false);
    }
  };

  const handleWilayaChange = useCallback((selectedOption) => {
    setSelectedWilaya(selectedOption);
    setSelectedCommune(null);
  }, []);

  const handleCommuneChange = useCallback((selectedOption) => {
    loadingRef.current = false;
    setLoadingCommunes(false);
    setSelectedCommune(selectedOption);
  }, []);

  return (
    <div className="destination-selector">
      {/* UI rendering here... */}
    </div>
  );
}

export default YalidineWilayaCommuneSelector;

