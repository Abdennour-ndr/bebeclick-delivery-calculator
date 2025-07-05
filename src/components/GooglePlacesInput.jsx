import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Store } from 'lucide-react';

const GooglePlacesInput = ({ 
  value = '',
  onChange,
  onPlaceSelect,
  placeholder = "Rechercher une adresse, commune, magasin ou entreprise...",
  className = "",
  style = {},
  disabled = false
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Charger Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('✅ Google Maps API déjà disponible');
      setIsLoaded(true);
      return;
    }

    // Vérifier si le script existe déjà avec le même API key
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const existingScript = document.querySelector(`script[src*="key=${apiKey}"]`);

    if (existingScript) {
      console.log('⏳ Script Google Maps déjà en cours de chargement...');
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('✅ Google Maps API chargée (script existant)');
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Supprimer les anciens scripts Google Maps
    const oldScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    oldScripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });

    // Créer callback global unique
    if (!window.initGoogleMaps) {
      window.initGoogleMaps = () => {
        console.log('✅ Google Maps API chargée via callback');
        setIsLoaded(true);
      };
    }

    const script = document.createElement('script');
    console.log('🔑 API Key utilisée:', apiKey ? `${apiKey.substring(0, 10)}...` : 'UNDEFINED');

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&callback=initGoogleMaps`;
    script.async = true;
    script.onerror = () => {
      console.error('❌ Erreur lors du chargement de Google Maps API');
    };

    document.head.appendChild(script);

    return () => {
      // Ne pas supprimer le script au démontage pour éviter les rechargements
    };
  }, []);

  // Initialiser l'autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current || disabled) return;

    console.log('🔄 Initialisation de l\'autocomplete...');

    const initTimeout = setTimeout(() => {
      try {
        if (!window.google?.maps?.places?.Autocomplete) {
          console.error('❌ Google Places Autocomplete non disponible');
          return;
        }

        const autocompleteConfig = {
          componentRestrictions: { country: 'dz' },
          // إزالة قيود الأنواع للحصول على جميع النتائج (عناوين + محلات + مدن)
          // types: [], // بدون قيود أنواع
          fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types', 'business_status', 'address_components']
        };

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current, 
          autocompleteConfig
        );

        // توسيع النطاق ليشمل كامل المنطقة الكبرى للجزائر
        const bounds = new window.google.maps.LatLngBounds(
          { lat: 35.2, lng: 2.5 },  // توسيع الحدود الجنوبية والغربية
          { lat: 37.3, lng: 4.3 }   // توسيع الحدود الشمالية والشرقية
        );
        autocompleteRef.current.setBounds(bounds);
        // تغيير strictBounds إلى false للسماح بنتائج خارج الحدود قليلاً
        autocompleteRef.current.setOptions({ strictBounds: false });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (!place.geometry) {
            console.warn('⚠️ Aucune géométrie trouvée pour ce lieu');
            return;
          }

          // Déterminer le type de lieu
          const placeTypes = place.types || [];
          const isEstablishment = placeTypes.includes('establishment');
          const isStore = placeTypes.includes('store');
          const isBusinessPlace = isEstablishment || isStore;

          const placeData = {
            name: place.name || '',
            formatted_address: place.formatted_address || '',
            place_id: place.place_id || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            types: placeTypes,
            business_status: place.business_status || null,
            isEstablishment: isBusinessPlace
          };

          setSelectedPlace(placeData);

          // Utiliser le nom pour les établissements, l'adresse pour les lieux géographiques
          const displayValue = isBusinessPlace && place.name
            ? `${place.name} - ${place.formatted_address}`
            : place.formatted_address || place.name || '';

          if (onChange) {
            onChange(displayValue);
          }

          if (onPlaceSelect) {
            onPlaceSelect(placeData);
          }

          const placeType = isBusinessPlace ? 'Établissement' : 'Adresse';
          console.log(`${placeType} sélectionné:`, placeData);
        });

        console.log('✅ Google Places Autocomplete initialisé pour la région d\'Alger étendue');
        console.log('📍 Bounds configurés:', {
          southwest: { lat: 35.2, lng: 2.5 },
          northeast: { lat: 37.3, lng: 4.3 }
        });
        console.log('🔍 Types de recherche: Tous types (sans restriction)');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
      }
    }, 1000);

    return () => clearTimeout(initTimeout);
  }, [isLoaded, disabled]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (selectedPlace && newValue !== selectedPlace.formatted_address) {
      setSelectedPlace(null);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative group">
        <Search
          size={16}
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 z-10 transition-colors duration-200 ${
            selectedPlace ? 'text-blue-500' : 'text-gray-400 group-focus-within:text-blue-500'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={disabled ? placeholder : `${placeholder} (Google Maps)`}
          className={`
            w-full pl-10 pr-12 py-3 text-sm border-2 rounded-xl transition-all duration-300
            focus:outline-none focus:ring-0 bg-gray-50 focus:bg-white
            ${disabled
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
              : selectedPlace
                ? 'border-green-500 bg-green-50 focus:border-green-600'
                : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
            }
            ${className}
          `}
          disabled={disabled}
          style={style}
        />

        {selectedPlace && !disabled && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {selectedPlace.isEstablishment ? (
              <Store
                size={16}
                className="text-yellow-500 animate-pulse"
              />
            ) : (
              <MapPin
                size={16}
                className="text-green-500 animate-pulse"
              />
            )}
          </div>
        )}
      </div>

      {!isLoaded && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          padding: '4px 8px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          fontSize: '12px',
          color: '#0369a1',
          zIndex: 10
        }}>
          Chargement Google Maps...
        </div>
      )}

      {selectedPlace && !disabled && (
        <div style={{
          marginTop: '4px',
          padding: '6px 8px',
          backgroundColor: selectedPlace.isEstablishment ? '#fef3c7' : '#f0fdf4',
          border: `1px solid ${selectedPlace.isEstablishment ? '#fbbf24' : '#bbf7d0'}`,
          borderRadius: '4px',
          fontSize: '12px',
          color: selectedPlace.isEstablishment ? '#92400e' : '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {selectedPlace.isEstablishment ? (
            <Store size={12} style={{ color: '#92400e' }} />
          ) : (
            <MapPin size={12} style={{ color: '#166534' }} />
          )}
          <span>
            {selectedPlace.isEstablishment
              ? `Établissement sélectionné: ${selectedPlace.name}`
              : 'Adresse sélectionnée'
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default GooglePlacesInput;
