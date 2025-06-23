import React from 'react';
import { cleanCost, formatNumber } from '../lib/mathUtils';

const PrintableResult = ({ result, orderData, service, destination, product, additionalProducts, yalidineFeeEnabled, getCurrentDeliveryCost, calculateTotalWithFees }) => {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const deliveryCost = getCurrentDeliveryCost();
  const orderTotalNum = parseFloat(orderData.orderTotal) || 0;
  const totalWithDelivery = calculateTotalWithFees();

  return (
    <div className="printable-result" id="printable-content">
      {/* Header */}
      <div className="print-header">
        <div className="company-info">
          <h1>BebeClick</h1>
          <p>Solutions de livraison intelligentes</p>
          <p>Calculateur de coût de livraison professionnel</p>
        </div>
        <div className="calculation-date">
          <p><strong>Date du calcul:</strong> {currentDate}</p>
          <p><strong>Référence:</strong> BC-{Date.now().toString().slice(-6)}</p>
        </div>
      </div>

      {/* Informations de livraison */}
      <div className="delivery-info">
        <h2>Informations de livraison</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Service:</strong> {service}
          </div>
          <div className="info-item">
            <strong>Destination:</strong> {destination}
          </div>
          {result.distance && (
            <div className="info-item">
              <strong>Distance:</strong> {result.distance} km
            </div>
          )}
          {result.wilaya && (
            <div className="info-item">
              <strong>Wilaya:</strong> {result.wilaya}
            </div>
          )}
        </div>
      </div>

      {/* Produits */}
      <div className="products-info">
        <h2>Produits</h2>
        <div className="products-list">
          {product && (
            <div className="product-item">
              <strong>Produit principal:</strong> {product}
            </div>
          )}
          {additionalProducts && additionalProducts.length > 0 && (
            <div className="additional-products">
              <strong>Produits supplémentaires:</strong>
              <ul>
                {additionalProducts.map((prod, index) => (
                  prod.name && <li key={index}>{prod.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Détails du calcul */}
      <div className="calculation-details">
        <h2>Détails du calcul</h2>
        <div className="calculation-table">
          <div className="calc-row">
            <span>Coût de base ({service}):</span>
            <span>{result.baseCost} DZD</span>
          </div>
          
          {result.extraCost && (
            <div className="calc-row">
              <span>Coût supplémentaire:</span>
              <span>{formatNumber(cleanCost(result.extraCost))} DZD</span>
            </div>
          )}
          
          {result.volumetricWeight && (
            <div className="calc-row">
              <span>Poids volumétrique:</span>
              <span>{result.volumetricWeight} kg</span>
            </div>
          )}
          
          {result.deliveryType && (
            <div className="calc-row">
              <span>Type de livraison:</span>
              <span>{result.deliveryType}</span>
            </div>
          )}
          
          <div className="calc-row total-row">
            <span><strong>Coût de livraison total:</strong></span>
            <span><strong>{deliveryCost} DZD</strong></span>
          </div>
        </div>
      </div>

      {/* Résumé de la commande */}
      {orderData.orderTotal && (
        <div className="order-summary-print">
          <h2>Résumé de la commande</h2>
          <div className="summary-table">
            <div className="summary-row">
              <span>Prix total des produits:</span>
              <span>{orderTotalNum} DZD</span>
            </div>
            <div className="summary-row">
              <span>Coût de livraison:</span>
              <span>{deliveryCost} DZD</span>
            </div>
            <div className="summary-row">
              <span>Sous-total:</span>
              <span>{orderTotalNum + deliveryCost} DZD</span>
            </div>
            
            {service === 'Yalidine' && yalidineFeeEnabled && (
              <div className="summary-row">
                <span>Frais Yalidine (1%):</span>
                <span>{Math.round((orderTotalNum + deliveryCost) * 0.01)} DZD</span>
              </div>
            )}
            
            <div className="summary-row total-final-row">
              <span><strong>TOTAL FINAL:</strong></span>
              <span><strong>{totalWithDelivery} DZD</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Informations client */}
      {orderData.customerPhone && (
        <div className="customer-info">
          <h2>Informations client</h2>
          <div className="customer-details">
            <div className="customer-item">
              <strong>Téléphone:</strong> {orderData.customerPhone}
            </div>
            {orderData.notes && (
              <div className="customer-item">
                <strong>Notes:</strong> {orderData.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="print-footer">
        <div className="footer-info">
          <p>Ce devis est valable pour une durée limitée et peut être sujet à modifications.</p>
          <p>Pour toute question, veuillez contacter le service client BebeClick.</p>
        </div>
        <div className="footer-contact">
          <p><strong>BebeClick</strong> - Solutions de livraison intelligentes</p>
          <p>Développé par BebeClick Development Team</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableResult;
