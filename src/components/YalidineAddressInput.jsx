import React, { useState, useEffect, useRef } from 'react';
import yalidineApiService from '../services/yalidineApiService';

function YalidineAddressInput({ value, onChange, placeholder = "Rechercher une commune..." }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCommunes = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await yalidineApiService.searchCommune(searchTerm);
      
      // Formater les résultats pour l'affichage
      const formattedResults = results.map(result => ({
        id: `${result.communeId}`,
        display: `${result.communeName}, ${result.wilayaName}`,
        commune: result.communeName,
        wilaya: result.wilayaName,
        wilayaCode: result.wilayaCode,
        zone: result.zone,
        hasStopDesk: result.hasStopDesk,
        isDeliverable: result.isDeliverable
      }));

      setSuggestions(formattedResults);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erreur recherche communes Yalidine:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Déclencher la recherche après un délai
    clearTimeout(window.yalidineSearchTimeout);
    window.yalidineSearchTimeout = setTimeout(() => {
      searchCommunes(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.display);
    setShowSuggestions(false);
    onChange(suggestion.display);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      } else {
        onChange(inputValue);
      }
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="yalidine-address-input">
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="form-control yalidine-input"
          autoComplete="off"
        />
        
        {loading && (
          <div className="input-loading">
            <div className="loading-spinner-small"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="yalidine-suggestions">
          <div className="suggestions-header">
            <small>Communes Yalidine disponibles:</small>
          </div>
          {suggestions.slice(0, 8).map((suggestion) => (
            <div
              key={suggestion.id}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="suggestion-main">
                <strong>{suggestion.commune}</strong>
                <span className="suggestion-wilaya">{suggestion.wilaya}</span>
              </div>
              <div className="suggestion-details">
                <span className={`zone-badge zone-${suggestion.zone}`}>
                  Zone {suggestion.zone}
                </span>
                {suggestion.hasStopDesk && (
                  <span className="stop-desk-badge">
                    Stop Desk
                  </span>
                )}
                {!suggestion.isDeliverable && (
                  <span className="not-deliverable-badge">
                    Non livrable
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {suggestions.length > 8 && (
            <div className="suggestions-footer">
              <small>+{suggestions.length - 8} autres résultats...</small>
            </div>
          )}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && inputValue.length >= 2 && (
        <div ref={suggestionsRef} className="yalidine-suggestions">
          <div className="no-suggestions">
            <small>Aucune commune trouvée pour "{inputValue}"</small>
          </div>
        </div>
      )}
    </div>
  );
}

export default YalidineAddressInput;
