import React, { useState, useEffect, useRef } from 'react';
import firebaseService from '../services/firebaseService';
import { Search, Package, Camera } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

function ProductInput({ value, onChange, onProductSelect, placeholder, disabled = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
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
    console.log('🔍 Recherche produit:', inputValue);
    onChange(inputValue);

    if (inputValue.length >= 1) {
      console.log('🔄 Démarrage recherche produits...');
      setLoading(true);
      try {
        let results = [];

        // Recherche dans Firebase uniquement
        console.log('🔥 Recherche dans Firebase...');
        const firebaseResults = await firebaseService.searchProducts(inputValue, 8);
        results = firebaseResults;
        console.log(`✅ ${results.length} produits trouvés dans Firebase`);
        if (results.length > 0) {
          console.log('🔍 Structure du premier produit:', JSON.stringify(results[0], null, 2));
        }

        setSuggestions(results.slice(0, 8)); // Limiter à 8 résultats pour l'affichage
        setShowSuggestions(true);

      } catch (error) {
        console.error('❌ Erreur recherche produits:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
        console.log('✅ Recherche produits terminée');
      }
    } else {
      console.log('🧹 Texte vide, effacement suggestions');
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

  const handleBarcodeClick = () => {
    setShowBarcodeScanner(true);
  };

  const handleBarcodeSuccess = async (scannedCode) => {
    console.log('🔍 Recherche du code-barres:', scannedCode);
    setShowBarcodeScanner(false);

    // Recherche dans la base de données avec le code-barres
    try {
      setLoading(true);
      const results = await firebaseService.searchProducts(scannedCode, 8);

      if (results.length > 0) {
        // إذا وُجد منتج واحد فقط، اختره مباشرة
        if (results.length === 1) {
          const product = results[0];
          onChange(product.name);
          if (onProductSelect) {
            onProductSelect(product);
          }
        } else {
          // إذا وُجدت عدة منتجات، اعرضها في الاقتراحات
          onChange(scannedCode);
          setSuggestions(results);
          setShowSuggestions(true);
        }
      } else {
        // Si aucun produit trouvé, mettre le code-barres dans le champ de recherche
        onChange(scannedCode);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('❌ Erreur de recherche du code-barres:', error);
      onChange(scannedCode);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeError = (error) => {
    console.error('❌ Erreur de lecture du code-barres:', error);
    setShowBarcodeScanner(false);
  };

  return (
    <div className="product-input-container" style={{ fontSize: '18px' }}>
      <div className="product-search-wrapper">
        <div className="product-input-field">
          <Search size={20} className="product-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="form-control product-input"
            autoComplete="off"
            style={{ fontSize: '17px' }}
          />
          <button
            type="button"
            onClick={handleBarcodeClick}
            className="product-barcode-btn"
            title="Scanner un code-barres"
            disabled={disabled}
          >
            <Camera size={20} />
          </button>
          {loading && (
            <div className="product-loading-indicator">
              <Package size={18} className="product-spinner" />
            </div>
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="product-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              className="product-suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="product-info">
                <div className="product-header">
                  <Package size={16} className="product-icon" />
                  <span className="product-title" style={{ fontSize: '17px' }}>{suggestion.name}</span>
                  {suggestion.sku && <span className="product-sku" style={{ fontSize: '15px' }}>({suggestion.sku})</span>}
                </div>
                <div className="product-specs">
                  <span className="spec-item" style={{ fontSize: '15px' }}>
                    {suggestion.dimensions ?
                      `${suggestion.dimensions.length}×${suggestion.dimensions.width}×${suggestion.dimensions.height}` :
                      `${suggestion.length || 'xx'}×${suggestion.width || 'xx'}×${suggestion.height || 'xx'}`
                    } cm
                  </span>
                  <span className="spec-divider">•</span>
                  <span className="spec-item" style={{ fontSize: '15px' }}>{suggestion.weight || 'xx'} kg</span>
                  <span className="spec-divider">•</span>
                  <span className="spec-item" style={{ fontSize: '15px' }}>{suggestion.category}</span>
                  {suggestion.price && (
                    <>
                      <span className="spec-divider">•</span>
                      <span className="spec-price" style={{ fontSize: '16px' }}>{suggestion.price.toLocaleString()} DZD</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanSuccess={handleBarcodeSuccess}
        onError={handleBarcodeError}
      />
    </div>
  );
}

export default ProductInput;
