import React from 'react';
import { CheckCircle, Info, Package, Weight, Ruler, DollarSign, Home, Building } from 'lucide-react';

/**
 * مكون لعرض معاينة البيانات المملوءة تلقائياً
 */
function AutoFillPreview({ 
  product, 
  dimensions, 
  weight, 
  declaredValue, 
  deliveryType, 
  reimbursementOption,
  show = false 
}) {
  if (!show || !product) {
    return null;
  }

  const hasAutoFill = dimensions.length || dimensions.width || dimensions.height || weight || declaredValue;

  if (!hasAutoFill) {
    return null;
  }

  return (
    <div className="auto-fill-preview">
      <div className="preview-header">
        <CheckCircle size={16} className="success-icon" />
        <span className="preview-title">Configuration automatique</span>
        <Info size={14} className="info-icon" />
      </div>
      
      <div className="preview-content">
        <div className="auto-filled-items">
          {/* Dimensions */}
          {(dimensions.length || dimensions.width || dimensions.height) && (
            <div className="auto-fill-item">
              <Ruler size={14} className="item-icon" />
              <span className="item-label">Dimensions:</span>
              <span className="item-value">
                {dimensions.length || '?'} × {dimensions.width || '?'} × {dimensions.height || '?'} cm
              </span>
            </div>
          )}
          
          {/* Poids */}
          {weight && (
            <div className="auto-fill-item">
              <Weight size={14} className="item-icon" />
              <span className="item-label">Poids:</span>
              <span className="item-value">{weight} kg</span>
            </div>
          )}
          
          {/* Valeur déclarée */}
          {declaredValue && (
            <div className="auto-fill-item">
              <DollarSign size={14} className="item-icon" />
              <span className="item-label">Valeur déclarée:</span>
              <span className="item-value">{declaredValue} DA</span>
            </div>
          )}
          
          {/* Type de livraison */}
          {deliveryType && (
            <div className="auto-fill-item">
              {deliveryType === 'home' ? (
                <Home size={14} className="item-icon" />
              ) : (
                <Building size={14} className="item-icon" />
              )}
              <span className="item-label">Livraison:</span>
              <span className="item-value">
                {deliveryType === 'home' ? 'À domicile' : 'Au bureau'}
              </span>
            </div>
          )}
          
          {/* Assurance */}
          {reimbursementOption === '1percent' && (
            <div className="auto-fill-item">
              <CheckCircle size={14} className="item-icon success" />
              <span className="item-label">Assurance:</span>
              <span className="item-value">1% activée</span>
            </div>
          )}
        </div>
        
        <div className="preview-note">
          <Info size={12} />
          <span>Données remplies automatiquement depuis la base produits</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Mكون مصغر للإشعار بالتعبئة التلقائية
 */
export function AutoFillNotification({ show = false, count = 0 }) {
  if (!show || count === 0) {
    return null;
  }

  return (
    <div className="auto-fill-notification">
      <CheckCircle size={16} className="notification-icon" />
      <span className="notification-text">
        {count} champ{count > 1 ? 's' : ''} rempli{count > 1 ? 's' : ''} automatiquement
      </span>
    </div>
  );
}



/**
 * مكون لعرض تفاصيل المنتج المحدد
 */
export function ProductDetails({ product, show = false }) {
  if (!show || !product) {
    return null;
  }

  return (
    <div className="product-details">
      <div className="details-header">
        <Package size={16} />
        <span className="details-title">Détails du produit</span>
      </div>
      
      <div className="details-content">
        <div className="detail-row">
          <span className="detail-label">Nom:</span>
          <span className="detail-value">{product.name}</span>
        </div>
        
        {product.category && (
          <div className="detail-row">
            <span className="detail-label">Catégorie:</span>
            <span className="detail-value">{product.category}</span>
          </div>
        )}
        
        {product.brand && (
          <div className="detail-row">
            <span className="detail-label">Marque:</span>
            <span className="detail-value">{product.brand}</span>
          </div>
        )}
        
        {product.sku && (
          <div className="detail-row">
            <span className="detail-label">SKU:</span>
            <span className="detail-value">{product.sku}</span>
          </div>
        )}
        
        {product.description && (
          <div className="detail-row">
            <span className="detail-label">Description:</span>
            <span className="detail-value description">{product.description}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * مكون لعرض توصيات التوصيل
 */
export function DeliveryRecommendations({ product, recommendations, show = false }) {
  if (!show || !recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="delivery-recommendations">
      <div className="recommendations-header">
        <Info size={16} />
        <span className="recommendations-title">Recommandations</span>
      </div>
      
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className={`recommendation-item ${rec.type}`}>
            <div className="rec-icon">
              {rec.type === 'success' && <CheckCircle size={14} />}
              {rec.type === 'warning' && <Info size={14} />}
              {rec.type === 'info' && <Package size={14} />}
            </div>
            <span className="rec-text">{rec.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AutoFillPreview;
