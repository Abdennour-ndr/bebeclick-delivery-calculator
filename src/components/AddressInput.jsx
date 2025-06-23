import React, { useState, useEffect, useRef } from 'react';
import googleMapsService from '../lib/googleMapsService';

function AddressInput({ value, onChange, onPlaceSelect, placeholder, disabled = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = async (e) => {
    const inputValue = e.target.value;
    console.log('🎯 Input changed to:', inputValue);
    onChange(inputValue);

    if (inputValue.length >= 3) {
      console.log('🔄 Starting search...');
      setLoading(true);
      try {
        const results = await googleMapsService.searchPlaces(inputValue);
        console.log('📊 Search results:', results);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('❌ Error searching places:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
        console.log('✅ Search completed');
      }
    } else {
      console.log('⏸️ Input too short, clearing suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onPlaceSelect) {
      try {
        const placeDetails = await googleMapsService.getPlaceDetails(suggestion.placeId);
        onPlaceSelect(placeDetails);
      } catch (error) {
        console.error('Error getting place details:', error);
      }
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="address-input-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
        className="form-control"
        autoComplete="off"
      />
      
      {loading && (
        <div className="address-loading">
          Recherche en cours...
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="address-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placeId}
              className="address-suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="suggestion-main">{suggestion.mainText}</div>
              <div className="suggestion-secondary">{suggestion.secondaryText}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressInput;

