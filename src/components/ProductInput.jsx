import React, { useState, useEffect, useRef } from 'react';
import productService from '../lib/productService';

function ProductInput({ value, onChange, onProductSelect, placeholder, disabled = false }) {
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
    console.log('Recherche produit:', inputValue);
    onChange(inputValue);

    if (inputValue.length >= 1) {
      console.log('Demarrage recherche produits...');
      setLoading(true);
      try {
        const results = await productService.searchProducts(inputValue);
        console.log('Resultats recherche produits:', results);
        setSuggestions(results.slice(0, 8)); // Limiter a 8 resultats pour l'affichage
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erreur recherche produits:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
        console.log('Recherche produits terminee');
      }
    } else {
      console.log('Texte vide, effacement suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onProductSelect) {
      try {
        onProductSelect(suggestion);
      } catch (error) {
        console.error('Erreur selection produit:', error);
      }
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="product-input-container">
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
        <div className="product-loading">
          Recherche en cours...
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="product-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              className="product-suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="product-name">
                {suggestion.name}
                {suggestion.sku && <span className="product-sku"> ({suggestion.sku})</span>}
              </div>
              <div className="product-details">
                {suggestion.length}×{suggestion.width}×{suggestion.height} cm | 
                {suggestion.weight} kg |
                {suggestion.category}
                {suggestion.price && <span> | {suggestion.price.toLocaleString()} DZD</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductInput;
