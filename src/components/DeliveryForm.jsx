import React, { useState } from 'react';
import ResultDisplay from './ResultDisplay';
import PrintableResult from './PrintableResult';
import AddressInput from './AddressInput';
import ProductInput from './ProductInput';
import { calculateZakiCost, calculateJamalDeliveryCost, calculateYalidineCost } from '../lib/pricing';
import googleMapsService from '../lib/googleMapsService';
import productService from '../lib/productService';
import { isInfobipEnabled } from '../config/infobip';
import { testMathUtils } from '../lib/mathUtils';

function DeliveryForm() {
  const [origin, setOrigin] = useState('Bebe Click Magasin');

  // تشغيل اختبارات الأدوات الرياضية عند التحميل
  React.useEffect(() => {
    testMathUtils();
  }, []);
  const [destination, setDestination] = useState('');
  const [service, setService] = useState('Zaki');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [weight, setWeight] = useState('');
  const [product, setProduct] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState(null);

  // Nouveaux champs pour les commandes
  const [orderTotal, setOrderTotal] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [additionalProducts, setAdditionalProducts] = useState([]);
  const [yalidineFeeEnabled, setYalidineFeeEnabled] = useState(true);

  const handleDestinationSelect = (placeDetails) => {
    setDestinationCoords(placeDetails);
  };

  const handleProductSelect = (selectedProduct) => {
    setProduct(selectedProduct.name);
    setDimensions({
      length: selectedProduct.length.toString(),
      width: selectedProduct.width.toString(),
      height: selectedProduct.height.toString()
    });
    setWeight(selectedProduct.weight.toString());
  };

  const saveManualProduct = () => {
    if (!product || !dimensions.length || !dimensions.width || !dimensions.height || !weight) {
      alert('Veuillez remplir tous les champs du produit avant de sauvegarder');
      return;
    }

    const productData = {
      name: product,
      category: 'Manuel',
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
      weight: weight,
      sku: `MAN-${Date.now()}`,
      price: 0
    };

    const result = productService.saveManualProduct(productData);

    if (result.success) {
      alert('Produit sauvegarde avec succes! Il apparaitra dans les suggestions futures.');
    } else {
      alert('Erreur lors de la sauvegarde: ' + result.error);
    }
  };

  const addProduct = () => {
    setAdditionalProducts([...additionalProducts, {
      name: '',
      dimensions: { length: '', width: '', height: '' },
      weight: ''
    }]);
  };

  const removeProduct = (index) => {
    const newProducts = additionalProducts.filter((_, i) => i !== index);
    setAdditionalProducts(newProducts);
  };

  const updateProduct = (index, field, value) => {
    const newProducts = [...additionalProducts];
    newProducts[index][field] = value;
    setAdditionalProducts(newProducts);
  };

  const handleAdditionalProductSelect = (index, selectedProduct) => {
    const newProducts = [...additionalProducts];
    newProducts[index] = {
      ...newProducts[index],
      name: selectedProduct.name,
      dimensions: {
        length: selectedProduct.length || '',
        width: selectedProduct.width || '',
        height: selectedProduct.height || ''
      },
      weight: selectedProduct.weight || ''
    };
    setAdditionalProducts(newProducts);
  };

  // حساب الإجمالي مع رسوم Yalidine
  const calculateTotalWithFees = () => {
    const deliveryCost = getCurrentDeliveryCost();
    const orderTotalNum = parseFloat(orderTotal) || 0;
    const baseTotal = orderTotalNum + deliveryCost;

    // إضافة 1% لخدمة Yalidine إذا كانت مفعلة
    if (service === 'Yalidine' && yalidineFeeEnabled) {
      const yalidineFee = baseTotal * 0.01;
      return Math.round(baseTotal + yalidineFee);
    }

    return Math.round(baseTotal);
  };

  // الحصول على تكلفة التوصيل الحالية
  const getCurrentDeliveryCost = () => {
    if (!result) return 0;

    // التحقق من النوع المختلف للتكلفة
    if (typeof result.totalCost === 'number') {
      return result.totalCost;
    }

    if (typeof result.cost === 'number') {
      return result.cost;
    }

    // إذا كانت التكلفة نص (مثل "Contactez le service")
    if (typeof result.totalCost === 'string' || typeof result.cost === 'string') {
      return 0;
    }

    return 0;
  };

  const sendToWhatsApp = () => {
    if (!result) {
      alert('Veuillez d\'abord calculer le cout de livraison');
      return;
    }

    if (!customerPhone || !orderTotal) {
      alert('Veuillez remplir le numero de telephone et le prix total de la commande');
      return;
    }

    const deliveryCost = getCurrentDeliveryCost();
    if (deliveryCost === 0 && !result.totalCost && !result.cost) {
      alert('Erreur: cout de livraison non disponible. Veuillez recalculer.');
      return;
    }

    // Verifier que le service supporte WhatsApp
    if (!isInfobipEnabled(service)) {
      alert(`L'envoi WhatsApp n'est disponible que pour le service Zaki`);
      return;
    }

    try {
      // Calculer le total avec livraison (sans afficher les frais Yalidine)
      const deliveryCost = getCurrentDeliveryCost();
      const orderTotalNum = parseFloat(orderTotal) || 0;
      const totalWithDelivery = calculateTotalWithFees();

      console.log('=== DEBUG WHATSAPP MESSAGE ===');
      console.log('Result object:', result);
      console.log('Delivery cost:', deliveryCost);
      console.log('Order total:', orderTotalNum);
      console.log('Total with delivery:', totalWithDelivery);

      // Construire le message WhatsApp sans emojis et sans etoiles
      let message = `Nouvelle commande Bebe Click\n\n`;
      message += `Numero de telephone: ${customerPhone}\n`;
      message += `Adresse de livraison: ${destination}\n`;

      // Ajouter les produits
      if (product && product.trim()) {
        message += `Produit: ${product}\n`;
      }

      // Ajouter les produits supplementaires
      additionalProducts.forEach((prod, index) => {
        if (prod.name && prod.name.trim()) {
          message += `Produit ${index + 2}: ${prod.name}\n`;
        }
      });

      message += `Prix de livraison: ${deliveryCost} DZD\n`;
      message += `Prix total commande: ${orderTotalNum} DZD\n`;
      message += `Prix total avec livraison: ${totalWithDelivery} DZD\n`;

      if (notes && notes.trim()) {
        message += `Note: ${notes}`;
      }

      // Encoder le message pour URL
      const encodedMessage = encodeURIComponent(message);

      // Ouvrir WhatsApp sans numero specifique (l'utilisateur choisira)
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

      console.log('Ouverture WhatsApp avec message:', message);
      console.log('URL WhatsApp:', whatsappUrl);

      // Ouvrir WhatsApp
      window.open(whatsappUrl, '_blank');

      // Effacer les champs apres ouverture
      setCustomerPhone('');
      setOrderTotal('');
      setNotes('');
      setAdditionalProducts([]);

    } catch (error) {
      console.error('Erreur lors de l\'ouverture WhatsApp:', error);
      alert('Erreur lors de l\'ouverture WhatsApp: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let distance = 0;
      let wilaya = '';

      if (destinationCoords) {
        // Calculer la distance réelle avec Google Maps
        const distanceData = await googleMapsService.calculateDistance(destinationCoords);
        distance = distanceData.distance;
        
        // Extraire la wilaya pour Yalidine
        wilaya = googleMapsService.extractWilaya(destinationCoords.address);
      } else {
        // Fallback: utiliser une distance simulée
        distance = Math.floor(Math.random() * 50) + 5;
        wilaya = destination.split(',')[0] || destination;
      }
      
      let calculationResult;
      
      switch (service) {
        case 'Zaki':
          calculationResult = calculateZakiCost(distance);
          break;
        case 'Jamal Delivery':
          calculationResult = calculateJamalDeliveryCost(distance);
          break;
        case 'Yalidine':
          calculationResult = calculateYalidineCost(
            wilaya, 
            parseFloat(weight) || 0, 
            {
              length: parseFloat(dimensions.length) || 0,
              width: parseFloat(dimensions.width) || 0,
              height: parseFloat(dimensions.height) || 0
            }
          );
          break;
        default:
          calculationResult = { error: 'Service non reconnu' };
      }
      
      // Ajouter les informations de distance au résultat
      if (service !== 'Yalidine') {
        calculationResult.distance = Math.round(distance * 10) / 10;
      }
      
      setResult(calculationResult);
    } catch (error) {
      console.error('Erreur lors du calcul:', error);
      setResult({ error: 'Erreur lors du calcul. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  // دالة الطباعة
  const handlePrint = () => {
    // إظهار المحتوى القابل للطباعة
    const printContent = document.getElementById('printable-content');
    if (printContent) {
      printContent.style.display = 'block';

      // طباعة
      window.print();

      // إخفاء المحتوى بعد الطباعة
      setTimeout(() => {
        printContent.style.display = 'none';
      }, 100);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="delivery-form">
        <h2>Calculateur de Coût de Livraison BebeClick</h2>
        
        <div className="form-group">
          <label htmlFor="origin">Adresse de départ:</label>
          <AddressInput
            value={origin}
            onChange={setOrigin}
            placeholder="Bebe Click Magasin"
            disabled={true}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="destination">Adresse de destination:</label>
          <AddressInput
            value={destination}
            onChange={setDestination}
            onPlaceSelect={handleDestinationSelect}
            placeholder="Entrez la destination"
          />
        </div>

        <div className="form-group">
          <label htmlFor="product">Produit:</label>
          <ProductInput
            value={product}
            onChange={setProduct}
            onProductSelect={handleProductSelect}
            placeholder="Rechercher un produit..."
          />
        </div>

        <div className="form-group">
          <label>Service de livraison:</label>
          <div className="service-options">
            <label>
              <input
                type="radio"
                value="Zaki"
                checked={service === 'Zaki'}
                onChange={(e) => setService(e.target.value)}
              />
              Zaki (Alger et banlieue)
            </label>
            <label>
              <input
                type="radio"
                value="Jamal Delivery"
                checked={service === 'Jamal Delivery'}
                onChange={(e) => setService(e.target.value)}
              />
              Jamal Delivery (Alger et banlieue)
            </label>
            <label>
              <input
                type="radio"
                value="Yalidine"
                checked={service === 'Yalidine'}
                onChange={(e) => setService(e.target.value)}
              />
              Yalidine (Toutes les wilayas)
            </label>
          </div>
        </div>

        {service === 'Yalidine' && (
          <div className="yalidine-options">
            <h3>Informations Yalidine (pour calcul du poids volumétrique)</h3>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={yalidineFeeEnabled}
                  onChange={(e) => setYalidineFeeEnabled(e.target.checked)}
                />
                Ajouter frais Yalidine (1% du total)
              </label>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="length">Longueur (cm):</label>
                <input
                  type="number"
                  id="length"
                  value={dimensions.length}
                  onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                  className="form-control"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="width">Largeur (cm):</label>
                <input
                  type="number"
                  id="width"
                  value={dimensions.width}
                  onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                  className="form-control"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="height">Hauteur (cm):</label>
                <input
                  type="number"
                  id="height"
                  value={dimensions.height}
                  onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                  className="form-control"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="weight">Poids réel (kg):</label>
              <input
                type="number"
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="form-control"
                placeholder="0"
                step="0.1"
              />
            </div>
            <div className="info-box">
              <p><strong>Formule du poids volumétrique:</strong> (Longueur × Largeur × Hauteur) en cm × 0.0002</p>
              <p>Le coût sera calculé sur la base du poids le plus élevé entre le poids réel et le poids volumétrique.</p>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading || !destination}>
            {loading ? 'Calcul en cours...' : 'Calculer'}
          </button>

          {product && dimensions.length && dimensions.width && dimensions.height && weight && (
            <button
              type="button"
              className="save-product-button"
              onClick={saveManualProduct}
              title="Sauvegarder ce produit pour utilisation future"
            >
              Sauvegarder produit
            </button>
          )}
        </div>
      </form>

      {result && (
        <>
          <ResultDisplay result={result} />

          {/* Section commune pour toutes les commandes */}
          <div className="order-section">
            <h3>Informations de la commande</h3>
            <p className="order-instructions">
              Remplissez les informations ci-dessous pour compléter le calcul et imprimer le résultat.
            </p>
            <div className="order-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customerPhone">Numero de telephone client:</label>
                  <input
                    type="tel"
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="form-control"
                    placeholder="Ex: 0555123456"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="orderTotal">Prix total commande (DZD):</label>
                  <input
                    type="number"
                    id="orderTotal"
                    value={orderTotal}
                    onChange={(e) => setOrderTotal(e.target.value)}
                    className="form-control"
                    placeholder="Ex: 25000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Note (optionnel):</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-control"
                  placeholder="Informations supplementaires..."
                  rows="3"
                />
              </div>

              {/* Section produits supplementaires */}
              <div className="additional-products-section">
                <div className="section-header">
                  <h4>Produits supplementaires</h4>
                  <button
                    type="button"
                    className="add-product-button"
                    onClick={addProduct}
                  >
                    + Ajouter produit
                  </button>
                </div>

                {additionalProducts.map((prod, index) => (
                  <div key={index} className="additional-product">
                    <div className="product-inputs">
                      <div className="product-search">
                        <ProductInput
                          value={prod.name}
                          onChange={(value) => updateProduct(index, 'name', value)}
                          onProductSelect={(selectedProduct) => handleAdditionalProductSelect(index, selectedProduct)}
                          placeholder="Rechercher un produit..."
                        />
                      </div>
                      <button
                        type="button"
                        className="remove-product-button"
                        onClick={() => removeProduct(index)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-summary">
                <p><strong>Prix livraison:</strong> {getCurrentDeliveryCost()} DZD</p>
                {orderTotal && (
                  <>
                    <p><strong>Sous-total avec livraison:</strong> {(parseFloat(orderTotal) || 0) + getCurrentDeliveryCost()} DZD</p>
                    {service === 'Yalidine' && yalidineFeeEnabled && (
                      <p><strong>Frais Yalidine (1%):</strong> {Math.round(((parseFloat(orderTotal) || 0) + getCurrentDeliveryCost()) * 0.01)} DZD</p>
                    )}
                    <p className="total-final"><strong>Total final:</strong> {calculateTotalWithFees()} DZD</p>
                  </>
                )}
              </div>

              <div className="action-buttons">
                {/* Bouton WhatsApp seulement pour les services supportés */}
                {isInfobipEnabled(service) && (
                  <button
                    type="button"
                    className="whatsapp-button"
                    onClick={sendToWhatsApp}
                    disabled={!customerPhone || !orderTotal}
                  >
                    Ouvrir WhatsApp avec message
                  </button>
                )}

                {/* Bouton d'impression pour tous les services */}
                <button
                  type="button"
                  className="print-button"
                  onClick={handlePrint}
                  title="Imprimer le résultat du calcul"
                >
                  Imprimer résultat
                </button>
              </div>

              {/* Instructions WhatsApp seulement si le service est supporté */}
              {isInfobipEnabled(service) && (
                <p className="whatsapp-instructions">
                  Remplissez les informations ci-dessus, puis cliquez pour ouvrir WhatsApp avec le message pret.
                  Vous pourrez ensuite choisir le contact de {service} pour envoyer.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer professionnel */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>BebeClick</h3>
            <p>Solutions de livraison intelligentes</p>
          </div>
          <div className="footer-info">
            <p>Développé par <strong>BebeClick Development Team</strong></p>
            <p className="footer-version">Version 1.0 - Système de calcul de coût de livraison</p>
          </div>
          <div className="footer-year">
            <p>&copy; {new Date().getFullYear()} BebeClick. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Contenu imprimable */}
      {result && (
        <PrintableResult
          result={result}
          orderData={{
            orderTotal,
            customerPhone,
            notes
          }}
          service={service}
          destination={destination}
          product={product}
          additionalProducts={additionalProducts}
          yalidineFeeEnabled={yalidineFeeEnabled}
          getCurrentDeliveryCost={getCurrentDeliveryCost}
          calculateTotalWithFees={calculateTotalWithFees}
        />
      )}
    </div>
  );
}

export default DeliveryForm;


