import React from 'react';
import { cleanCost, formatNumber } from '../lib/mathUtils';
import { BarChart3, Scale, DollarSign, TrendingUp, Package, Truck, MapPin, AlertTriangle, CreditCard, Target } from 'lucide-react';

function ResultDisplay({ result, yalidineFeeEnabled, declaredValue, reimbursementType, reimbursementAmount, deliveryType }) {


  if (!result) {
    return null;
  }

  const formatPrice = (price) => {
    // حماية ضد NaN و undefined
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      console.warn('⚠️ formatPrice: قيمة غير صحيحة:', price);
      return '0 DA';
    }
    return `${Math.round(numPrice).toLocaleString()} DA`;
  };





  // Calculs Yalidine détaillés
  const calculateYalidineDetails = () => {
    // Utiliser les données calculées depuis DeliveryForm si disponibles
    const actualWeight = result.actualWeight || 1;
    const volumetricWeight = result.volumetricWeight || 0;
    const chargedWeight = result.billableWeight || Math.max(actualWeight, volumetricWeight);

    console.log('🔍 ResultDisplay - Données de poids:');
    console.log('  - Poids réel:', actualWeight, 'kg');
    console.log('  - Poids volumétrique:', volumetricWeight, 'kg');
    console.log('  - Poids facturable:', chargedWeight, 'kg');

    // Coûts de base depuis API Yalidine
    let baseDelivery = 700; // Valeur par défaut
    let communeSupplement = 0; // Inclus dans le prix de base depuis API

    // Utiliser UNIQUEMENT le prix de base (sans suppléments) depuis Firebase
    const resultBasePrice = parseFloat(result.basePrice);

    // Utiliser basePrice ou valeur par défaut - NE PAS utiliser result.cost
    if (!isNaN(resultBasePrice) && resultBasePrice > 0) {
      baseDelivery = resultBasePrice;
    }
    // Sinon garder la valeur par défaut de 700

    console.log('🔍 ResultDisplay - Détail des calculs:');
    console.log('  - result.basePrice (prix de base):', result.basePrice);
    console.log('  - result.cost (total avec suppléments):', result.cost);
    console.log('  - baseDelivery (Frais de livraison - SANS suppléments):', baseDelivery);

    // Calcul du surpoids (+5KG) - utiliser les données calculées
    let overweightFee = 0;

    // Priorité: utiliser les supplements calculés depuis DeliveryForm
    if (result.supplements && result.supplements.overweight !== undefined) {
      overweightFee = result.supplements.overweight;
      console.log('🔍 ResultDisplay - overweightFee depuis supplements:', overweightFee);
    } else if (chargedWeight > 5) {
      // Fallback: recalculer si pas de données supplements
      const extraWeight = Math.ceil(chargedWeight - 5);
      const zone = result.location?.zone || 3;
      const ratePerKg = (zone === 4 || zone === 5) ? 100 : 50;
      overweightFee = extraWeight * ratePerKg;
      console.log('🔍 ResultDisplay - overweightFee recalculé:', overweightFee);
    }

    // Prix colis = Valeur déclarée
    const packagePrice = parseFloat(declaredValue) || 0;

    // Frais 1% de la valeur déclarée - utiliser les données calculées
    let onePercentFee = 0;
    if (result.supplements && result.supplements.reimbursement !== undefined) {
      onePercentFee = result.supplements.reimbursement;
      console.log('🔍 ResultDisplay - onePercentFee depuis supplements:', onePercentFee);
    } else if (packagePrice > 0) {
      onePercentFee = Math.round(packagePrice * 0.01);
      console.log('🔍 ResultDisplay - onePercentFee recalculé:', onePercentFee);
    }

    const totalFees = baseDelivery + communeSupplement + overweightFee + onePercentFee;
    const totalToCollect = totalFees + packagePrice;

    // Vérification: le total calculé doit correspondre au result.cost
    const expectedTotal = baseDelivery + overweightFee + onePercentFee;
    const actualTotal = parseFloat(result.cost) || 0;

    console.log('🔍 ResultDisplay - Vérification anti-duplication:');
    console.log('  - Frais de livraison (base uniquement):', baseDelivery);
    console.log('  - Surpoids (+5KG):', overweightFee);
    console.log('  - Frais 1%:', onePercentFee);
    console.log('  - Total calculé (base + suppléments):', expectedTotal);
    console.log('  - Total depuis DeliveryForm:', actualTotal);
    console.log('  - Différence (doit être 0):', Math.abs(expectedTotal - actualTotal));

    if (Math.abs(expectedTotal - actualTotal) > 1) {
      console.warn('⚠️ ATTENTION: Différence détectée dans les calculs!');
    }

    return {
      actualWeight,
      volumetricWeight,
      chargedWeight,
      packagePrice,
      baseDelivery,
      communeSupplement,
      overweightFee,
      onePercentFee,
      totalFees,
      totalToCollect
    };
  };

  const yalidineDetails = result.service === 'Yalidine' ? calculateYalidineDetails() : null;

  return (
    <div className="modern-result-display" style={{
      backgroundColor: '#ffffff',
      border: '2px solid #e2e8f0',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div className="result-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #f1f5f9'
      }}>
        <h3 style={{
          margin: 0,
          color: '#1e293b',
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <BarChart3 size={24} style={{ color: '#3b82f6' }} />
          Résultat du calcul de livraison
        </h3>
        <div className="header-badges" style={{ display: 'flex', gap: '12px' }}>
          <div className="service-badge" style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>{result.service}</div>

        </div>
      </div>

      {result.service === 'Yalidine' && (
        <div className="yalidine-calculation">
          {/* Section Poids */}
          <div className="calculation-section" style={{
            backgroundColor: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{
              margin: '0 0 16px 0',
              color: '#475569',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Scale size={20} style={{ color: '#6366f1' }} />
              Analyse du poids
            </h4>
            <div className="weight-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px'
            }}>
              <div className="weight-item" style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <span className="weight-label" style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '8px'
                }}>Poids réel</span>
                <span className="weight-value" style={{
                  display: 'block',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{yalidineDetails.actualWeight} KG</span>
              </div>
              <div className="weight-item" style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <span className="weight-label" style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '8px'
                }}>Poids volumétrique</span>
                <span className="weight-value" style={{
                  display: 'block',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{yalidineDetails.volumetricWeight} KG</span>
              </div>
              <div className="weight-item highlighted" style={{
                backgroundColor: '#fef3c7',
                padding: '16px',
                borderRadius: '8px',
                border: '2px solid #f59e0b',
                textAlign: 'center'
              }}>
                <span className="weight-label" style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#92400e',
                  marginBottom: '8px',
                  fontWeight: 'bold'
                }}>Poids facturé</span>
                <span className="weight-value" style={{
                  display: 'block',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#92400e'
                }}>{yalidineDetails.chargedWeight} KG</span>
              </div>
            </div>
          </div>

          {/* Section Coûts détaillés */}
          <div className="calculation-section" style={{
            backgroundColor: '#f0f9ff',
            border: '2px solid #0ea5e9',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{
              margin: '0 0 16px 0',
              color: '#0c4a6e',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <DollarSign size={20} style={{ color: '#0ea5e9' }} />
              Détail des frais
            </h4>

            <div className="cost-breakdown" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="cost-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <span className="cost-label" style={{
                  fontSize: '16px',
                  color: '#475569',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Package size={16} style={{ color: '#8b5cf6' }} />
                  Prix colis
                </span>
                <span className="cost-value" style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatPrice(yalidineDetails.packagePrice)}</span>
              </div>
              <div className="cost-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <span className="cost-label" style={{
                  fontSize: '16px',
                  color: '#475569',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Truck size={16} style={{ color: '#10b981' }} />
                  Frais de livraison
                </span>
                <span className="cost-value" style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {formatPrice(yalidineDetails.baseDelivery)}
                </span>
              </div>
              <div className="cost-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <span className="cost-label" style={{
                  fontSize: '16px',
                  color: '#475569',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <MapPin size={16} style={{ color: '#f59e0b' }} />
                  Supplément commune
                </span>
                <span className="cost-value" style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatPrice(yalidineDetails.communeSupplement)}</span>
              </div>
              {yalidineDetails.overweightFee > 0 && (
                <div className="cost-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fca5a5'
                }}>
                  <span className="cost-label" style={{
                    fontSize: '16px',
                    color: '#dc2626',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={16} style={{ color: '#dc2626' }} />
                    Surpoids (+5KG)
                  </span>
                  <span className="cost-value" style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#dc2626'
                  }}>{formatPrice(yalidineDetails.overweightFee)}</span>
                </div>
              )}
              {yalidineDetails.onePercentFee > 0 && (
                <div className="cost-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: '#fffbeb',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24'
                }}>
                  <span className="cost-label" style={{
                    fontSize: '16px',
                    color: '#d97706',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CreditCard size={16} style={{ color: '#d97706' }} />
                    Frais remboursement (1%)
                  </span>
                  <span className="cost-value" style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#d97706'
                  }}>{formatPrice(yalidineDetails.onePercentFee)}</span>
                </div>
              )}
            </div>
          </div>



          {/* Section Totaux */}
          <div className="calculation-section totals-section" style={{
            backgroundColor: '#f0fdf4',
            border: '2px solid #16a34a',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h4 style={{
              margin: '0 0 16px 0',
              color: '#15803d',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrendingUp size={20} style={{ color: '#16a34a' }} />
              Résumé financier
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="total-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #d1fae5'
              }}>
                <span className="total-label" style={{
                  fontSize: '16px',
                  color: '#15803d',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <DollarSign size={16} style={{ color: '#15803d' }} />
                  Total frais
                </span>
                <span className="total-value" style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#15803d'
                }}>{formatPrice(yalidineDetails.totalFees)}</span>
              </div>
              <div className="total-item final-total" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                backgroundColor: '#16a34a',
                borderRadius: '12px',
                border: '2px solid #15803d'
              }}>
                <span className="total-label" style={{
                  fontSize: '18px',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Target size={18} style={{ color: '#ffffff' }} />
                  Total à ramasser
                </span>
                <span className="total-value" style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#ffffff'
                }}>{formatPrice(yalidineDetails.totalToCollect)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pour autres services */}
      {result.service !== 'Yalidine' && (
        <div className="simple-result">
          <div className="result-item main-result">
            <span className="label">Coût de livraison:</span>
            <span className="value">{formatPrice(result.totalCost)}</span>
          </div>
          <div className="result-item">
            <span className="label">Distance:</span>
            <span className="value">{result.distance}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultDisplay;

