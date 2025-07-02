import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';

/**
 * Google Places Input Component
 * Pour intégration dans DeliveryForm - Service Zaki
 * Limité à la région d'Alger et ses environs
 */
const GooglePlacesInput = ({ 
  value = '',
  onChange,
  onPlaceSelect,
  placeholder = "Rechercher une adresse à Alger...",
  className = "",
  style = {},
  disabled = false
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Bounds pour la région d'Alger (Alger + Blida + Boumerdes + Tipaza)
  const algiersBounds = {
    southwest: { lat: 35.4, lng: 2.8 },  // Sud-Ouest
    northeast: { lat: 37.1, lng: 4.0 }   // Nord-Est
  };

  // Charger Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Vérifier si le script est déjà en cours de chargement
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&language=fr&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
      console.log('✅ Google Maps API chargée pour Places Autocomplete');
    };

    script.onerror = () => {
      console.error('❌ Erreur lors du chargement de Google Maps API');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialiser l'autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current || disabled) return;

    try {
      // Créer session token pour optimiser les coûts
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

      // Créer les bounds
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(algiersBounds.southwest.lat, algiersBounds.southwest.lng),
        new window.google.maps.LatLng(algiersBounds.northeast.lat, algiersBounds.northeast.lng)
      );

      // Configurer l'autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'dz' },
        types: ['geocode'],
        fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
        sessionToken: sessionTokenRef.current
      });

      // Définir les bounds et les rendre strictes
      autocompleteRef.current.setBounds(bounds);
      autocompleteRef.current.setOptions({ strictBounds: true });

      // Écouter les sélections
      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);

      console.log('✅ Google Places Autocomplete initialisé pour Alger (DeliveryForm)');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de l\'autocomplete:', error);
    }
  }, [isLoaded, disabled]);

  // Nettoyer l'autocomplete si désactivé
  useEffect(() => {
    if (disabled && autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
      setSelectedPlace(null);
    }
  }, [disabled]);

  // Gérer la sélection d'un lieu
  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    
    if (!place.geometry) {
      console.warn('⚠️ Aucune géométrie trouvée pour ce lieu');
      return;
    }

    const placeData = {
      name: place.name || '',
      formatted_address: place.formatted_address || '',
      place_id: place.place_id || '',
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address_components: place.address_components || []
    };

    setSelectedPlace(placeData);

    // Mettre à jour la valeur de l'input
    if (onChange) {
      onChange(place.formatted_address || place.name || '');
    }

    // Callback vers le parent avec les données complètes
    if (onPlaceSelect) {
      onPlaceSelect(placeData);
    }

    console.log('📍 Lieu sélectionné (Zaki):', placeData);
  };

  // Gérer les changements manuels dans l'input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
    
    // Réinitialiser la sélection si l'utilisateur tape manuellement
    if (selectedPlace && newValue !== selectedPlace.formatted_address) {
      setSelectedPlace(null);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Input avec icône de recherche */}
      <div style={{ position: 'relative' }}>
        <Search 
          size={16} 
          style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#6b7280',
            zIndex: 1
          }} 
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={disabled ? placeholder : `${placeholder} (Google Maps)`}
          className={className}
          disabled={disabled}
          style={{
            ...style,
            paddingLeft: disabled ? style.paddingLeft || '12px' : '40px',
            backgroundColor: disabled ? '#f9fafb' : '#ffffff',
            borderColor: disabled ? '#e5e7eb' : (selectedPlace ? '#10b981' : '#d1d5db'),
            ...style
          }}
        />
        
        {/* Indicateur de lieu sélectionné */}
        {selectedPlace && !disabled && (
          <MapPin 
            size={16} 
            style={{ 
              position: 'absolute', 
              right: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#10b981'
            }} 
          />
        )}
      </div>

      {/* Message de chargement */}
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

      {/* Informations du lieu sélectionné (optionnel) */}
      {selectedPlace && !disabled && (
        <div style={{
          marginTop: '4px',
          padding: '6px 8px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <MapPin size={12} />
          <span>Adresse Google Maps sélectionnée</span>
        </div>
      )}
    </div>
  );
};

export default GooglePlacesInput;
