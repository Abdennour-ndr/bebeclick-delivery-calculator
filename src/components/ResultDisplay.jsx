import React from 'react';
import { cleanCost, formatNumber } from '../lib/mathUtils';

function ResultDisplay({ result }) {
  if (!result) {
    return null;
  }

  return (
    <div className="result-display">
      <h3>Résultat du calcul</h3>
      <div className="result-content">
        <div className="result-item">
          <span className="result-label">Service:</span>
          <span className="result-value">{result.service}</span>
        </div>
        <div className="result-item">
          <span className="result-label">Distance:</span>
          <span className="result-value">{result.distance} km</span>
        </div>
        <div className="result-item">
          <span className="result-label">Coût de base:</span>
          <span className="result-value">{result.baseCost} DZD</span>
        </div>
        {result.volumetricWeight && (
          <div className="result-item">
            <span className="result-label">Poids volumétrique:</span>
            <span className="result-value">{result.volumetricWeight} kg</span>
          </div>
        )}
        {result.extraCost && (
          <div className="result-item">
            <span className="result-label">Coût supplémentaire:</span>
            <span className="result-value">{formatNumber(cleanCost(result.extraCost))} DZD</span>
          </div>
        )}
        {result.deliveryType && (
          <div className="result-item">
            <span className="result-label">Type de livraison:</span>
            <span className="result-value">{result.deliveryType}</span>
          </div>
        )}
        <div className="result-total">
          <span className="result-label">Coût total:</span>
          <span className="result-value total">{result.totalCost} DZD</span>
        </div>
      </div>
    </div>
  );
}

export default ResultDisplay;

