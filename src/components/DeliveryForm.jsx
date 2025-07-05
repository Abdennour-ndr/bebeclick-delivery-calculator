import React, { useState } from 'react';
import ResultDisplay from './ResultDisplay';
import AddressInput from './AddressInput';
import YalidineWilayaCommuneSelector from './YalidineWilayaCommuneSelector';
import GooglePlacesInput from './GooglePlacesInput';
import ProductInput from './ProductInput';
import { MapPin, Truck, Package, Calculator, Info, Home, Building2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import ProductImporter from './ProductImporter';
import { calculateZakiCost, calculateJamalDeliveryCost } from '../lib/pricing';
import googleMapsService from '../lib/googleMapsService';
import firebaseService from '../services/firebaseService';


import { testMathUtils } from '../lib/mathUtils';
import { useResponsive, useDeviceType, useOrientation } from '../hooks/use-mobile';
import AutoFillPreview, { ProductDetails, DeliveryRecommendations } from './AutoFillPreview';

function DeliveryForm() {
  // Hooks pour la responsivité
  const responsive = useResponsive();
  const deviceType = useDeviceType();
  const orientation = useOrientation();

  const [origin, setOrigin] = useState('Bebe Click Magasin');

  // تشغيل اختبارات الأدوات الرياضية عند التحميل
  React.useEffect(() => {
    testMathUtils();
  }, []);

  const [destination, setDestination] = useState('');
  const [service, setService] = useState('Yalidine'); // Yalidine par défaut pour mobile
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [weight, setWeight] = useState('');
  const [product, setProduct] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState(null);

  // État pour Google Places (service Zaki)
  const [googlePlaceData, setGooglePlaceData] = useState(null);

  // Nouveaux champs pour les commandes
  const [yalidineFeeEnabled] = useState(true);

  // Nouveaux états pour Yalidine
  const [declaredValue, setDeclaredValue] = useState('');
  const [reimbursementType, setReimbursementType] = useState('');
  const [reimbursementAmount] = useState('');
  const [deliveryType, setDeliveryType] = useState('home'); // 'home' ou 'office'

  // États pour la sauvegarde de produit
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null

  // États pour le remplissage automatique
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [showAutoFillPreview, setShowAutoFillPreview] = useState(false);

  // Effects après définition de tous les états

  // Debug: afficher les valeurs des champs pour le bouton de sauvegarde
  React.useEffect(() => {
    const shouldShowButton = product && product.trim() !== '' &&
                            dimensions.length && dimensions.length.toString().trim() !== '' && parseFloat(dimensions.length) > 0 &&
                            dimensions.width && dimensions.width.toString().trim() !== '' && parseFloat(dimensions.width) > 0 &&
                            dimensions.height && dimensions.height.toString().trim() !== '' && parseFloat(dimensions.height) > 0 &&
                            weight && weight.toString().trim() !== '' && parseFloat(weight) > 0;

    console.log('🔍 Debug bouton sauvegarde:');
    console.log('- product:', product, '(valid:', product && product.trim() !== '', ')');
    console.log('- dimensions.length:', dimensions.length, '(valid:', dimensions.length && parseFloat(dimensions.length) > 0, ')');
    console.log('- dimensions.width:', dimensions.width, '(valid:', dimensions.width && parseFloat(dimensions.width) > 0, ')');
    console.log('- dimensions.height:', dimensions.height, '(valid:', dimensions.height && parseFloat(dimensions.height) > 0, ')');
    console.log('- weight:', weight, '(valid:', weight && parseFloat(weight) > 0, ')');
    console.log('- shouldShowButton:', shouldShowButton);
  }, [product, dimensions, weight]);

  const handleDestinationSelect = (placeDetails) => {
    setDestinationCoords(placeDetails);
  };

  // دالة للتعامل مع اختيار Google Places (خدمة Zaki)
  const handleGooglePlaceSelect = (placeData) => {
    console.log('📍 Google Place sélectionné pour Zaki:', placeData);

    // تحديث بيانات المكان
    setGooglePlaceData(placeData);

    // تحديث الإحداثيات
    setDestinationCoords({
      lat: placeData.lat,
      lng: placeData.lng,
      address: placeData.formatted_address,
      name: placeData.name
    });

    // تحديث حقل الوجهة
    setDestination(placeData.formatted_address || placeData.name);
  };

  // دالة لاستخراج الإحداثيات من رابط Google Maps
  const extractCoordsFromMapsLink = async (url) => {
    try {
      console.log('🔗 معالجة رابط Google Maps:', url);

      // التحقق من أنواع روابط Google Maps المختلفة
      const patterns = [
        // https://www.google.com/maps/place/.../@lat,lng,zoom
        /@(-?\d+\.\d+),(-?\d+\.\d+),(\d+)/,
        // https://maps.google.com/?q=lat,lng
        /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
        // https://www.google.com/maps/dir//lat,lng/
        /\/(-?\d+\.\d+),(-?\d+\.\d+)\//,
        // https://maps.google.com/maps?ll=lat,lng
        /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/
      ];

      // إذا كان رابط مختصر، نحاول توسيعه باستخدام طريقة أفضل
      if (url.includes('maps.app.goo.gl') || url.includes('goo.gl')) {
        console.log('🔗 رابط مختصر تم اكتشافه، محاولة التوسيع...');

        try {
          // استخدام iframe مخفي لتوسيع الرابط
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = url;
          document.body.appendChild(iframe);

          // انتظار تحميل الصفحة
          await new Promise((resolve) => {
            iframe.onload = () => {
              try {
                const expandedUrl = iframe.contentWindow.location.href;
                console.log('🔗 الرابط الموسع:', expandedUrl);

                // البحث عن الإحداثيات في الرابط الموسع
                for (const pattern of patterns) {
                  const match = expandedUrl.match(pattern);
                  if (match && match[1] && match[2]) {
                    const lat = parseFloat(match[1]);
                    const lng = parseFloat(match[2]);
                    console.log('📍 تم استخراج الإحداثيات من الرابط الموسع:', { lat, lng });
                    document.body.removeChild(iframe);
                    resolve({ lat, lng });
                    return;
                  }
                }
              } catch (e) {
                console.log('⚠️ لا يمكن الوصول لمحتوى iframe بسبب CORS');
              }
              document.body.removeChild(iframe);
              resolve(null);
            };

            iframe.onerror = () => {
              document.body.removeChild(iframe);
              resolve(null);
            };

            // timeout بعد 5 ثواني
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              resolve(null);
            }, 5000);
          });

        } catch (error) {
          console.log('⚠️ فشل في توسيع الرابط باستخدام iframe');
        }

        // طريقة بديلة: استخدام Google Maps Geocoding API
        try {
          console.log('🔄 محاولة استخدام Geocoding API...');

          // استخراج معرف الرابط المختصر
          const shortId = url.match(/maps\.app\.goo\.gl\/([a-zA-Z0-9]+)/)?.[1];
          if (shortId) {
            // يمكن استخدام خدمة خارجية لتوسيع الرابط
            const response = await fetch(`https://unshorten.me/json/${encodeURIComponent(url)}`);
            const data = await response.json();

            if (data.resolved_url) {
              console.log('🔗 تم توسيع الرابط:', data.resolved_url);

              // البحث عن الإحداثيات في الرابط الموسع
              for (const pattern of patterns) {
                const match = data.resolved_url.match(pattern);
                if (match && match[1] && match[2]) {
                  const lat = parseFloat(match[1]);
                  const lng = parseFloat(match[2]);
                  console.log('📍 تم استخراج الإحداثيات من الخدمة الخارجية:', { lat, lng });
                  return { lat, lng };
                }
              }
            }
          }
        } catch (error) {
          console.log('⚠️ فشل في استخدام خدمة توسيع الروابط الخارجية');
        }
      }

      // البحث المباشر في الرابط الأصلي
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1] && match[2]) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          console.log('📍 تم استخراج الإحداثيات مباشرة:', { lat, lng });
          return { lat, lng };
        }
      }

      console.log('❌ لم يتم العثور على إحداثيات في الرابط');
      return null;
    } catch (error) {
      console.error('❌ خطأ في استخراج الإحداثيات:', error);
      return null;
    }
  };

  // دالة للتحقق من وجود رابط Google Maps في النص
  const handleDestinationChange = async (value) => {
    setDestination(value);

    // التحقق من وجود رابط Google Maps
    const mapsLinkPattern = /(https?:\/\/)?(www\.)?(maps\.app\.goo\.gl|maps\.google|google\.com\/maps)/i;

    if (mapsLinkPattern.test(value)) {
      console.log('🗺️ تم اكتشاف رابط Google Maps:', value);

      // إظهار رسالة تحميل للمستخدم
      if (value.includes('maps.app.goo.gl')) {
        console.log('⏳ معالجة رابط مختصر، قد يستغرق بضع ثوان...');
      }

      const coords = await extractCoordsFromMapsLink(value);
      if (coords) {
        console.log('✅ تم استخراج الإحداثيات بنجاح:', coords);
        setDestinationCoords({
          lat: coords.lat,
          lng: coords.lng,
          address: `Coordonnées: ${coords.lat}, ${coords.lng}`
        });
      } else {
        console.log('⚠️ لم يتم العثور على إحداثيات في الرابط');
        console.log('💡 نصيحة: تأكد من أن الرابط يحتوي على موقع محدد');
      }
    }
  };

  const handleProductSelect = (selectedProduct) => {
    console.log('🎯 Produit sélectionné:', selectedProduct);

    const filledFields = [];

    // Remplir le nom du produit
    setProduct(selectedProduct.name);
    setSelectedProductData(selectedProduct);

    // Remplir les dimensions automatiquement
    console.log('🔍 Vérification dimensions produit:', {
      // Format ancien (direct)
      length: selectedProduct.length,
      width: selectedProduct.width,
      height: selectedProduct.height,
      // Format nouveau (dans dimensions object)
      dimensionsObject: selectedProduct.dimensions,
      dimensionsLength: selectedProduct.dimensions?.length,
      dimensionsWidth: selectedProduct.dimensions?.width,
      dimensionsHeight: selectedProduct.dimensions?.height
    });

    // Vérifier les deux formats possibles
    const length = selectedProduct.dimensions?.length || selectedProduct.length;
    const width = selectedProduct.dimensions?.width || selectedProduct.width;
    const height = selectedProduct.dimensions?.height || selectedProduct.height;

    if (length && width && height) {
      const newDimensions = {
        length: length.toString(),
        width: width.toString(),
        height: height.toString()
      };
      setDimensions(newDimensions);
      filledFields.push('dimensions');
      console.log('📏 Dimensions remplies automatiquement:', newDimensions);
    } else {
      console.log('⚠️ Dimensions manquantes dans le produit');
      console.log('📊 Données disponibles:', {
        length,
        width,
        height,
        fullProduct: selectedProduct
      });
    }

    // Remplir le poids automatiquement
    if (selectedProduct.weight) {
      setWeight(selectedProduct.weight.toString());
      filledFields.push('weight');
      console.log('⚖️ Poids rempli automatiquement:', selectedProduct.weight);
    }

    // Remplir la valeur déclarée si disponible (prix du produit)
    if (selectedProduct.price && selectedProduct.price > 0) {
      setDeclaredValue(selectedProduct.price.toString());
      filledFields.push('declaredValue');
      console.log('💰 Valeur déclarée remplie automatiquement:', selectedProduct.price);
    }

    // Définir le type de livraison recommandé selon le produit
    if (selectedProduct.category || selectedProduct.type) {
      const category = (selectedProduct.category || selectedProduct.type || '').toLowerCase();

      // Produits fragiles ou de valeur -> livraison à domicile
      if (category.includes('fragile') ||
          category.includes('électronique') ||
          category.includes('verre') ||
          category.includes('précieux') ||
          (selectedProduct.price && selectedProduct.price > 10000)) {
        setDeliveryType('home');
        filledFields.push('deliveryType');
        console.log('🏠 Type de livraison défini sur "domicile" (produit fragile/précieux)');
      }
      // Produits légers et peu fragiles -> livraison au bureau (moins cher)
      else if (category.includes('vêtement') ||
               category.includes('textile') ||
               category.includes('livre') ||
               category.includes('accessoire') ||
               (selectedProduct.weight && selectedProduct.weight < 1)) {
        setDeliveryType('office');
        filledFields.push('deliveryType');
        console.log('🏢 Type de livraison défini sur "bureau" (produit léger)');
      }
    }

    // Activer automatiquement l'assurance pour les produits de valeur
    if (selectedProduct.price && selectedProduct.price > 5000) {
      setReimbursementType('1percent');
      filledFields.push('insurance');
      console.log('🛡️ Assurance 1% activée automatiquement (produit de valeur)');
    }

    // Mettre à jour les champs remplis et afficher la prévisualisation
    setAutoFilledFields(filledFields);
    setShowAutoFillPreview(filledFields.length > 0);

    // Masquer la prévisualisation après 5 secondes
    if (filledFields.length > 0) {
      setTimeout(() => {
        setShowAutoFillPreview(false);
      }, 5000);
    }

    console.log(`✅ Configuration Yalidine mise à jour automatiquement (${filledFields.length} champs)`);
  };

  const saveManualProduct = async () => {
    console.log('🔍 Vérification des données avant sauvegarde:');
    console.log('- Produit:', product);
    console.log('- Dimensions:', dimensions);
    console.log('- Poids:', weight);

    // Vérifier chaque champ individuellement pour un meilleur diagnostic
    const missingFields = [];
    if (!product || product.trim() === '') missingFields.push('Nom du produit');
    if (!dimensions.length || dimensions.length === '' || parseFloat(dimensions.length) <= 0) missingFields.push('Longueur (doit être > 0)');
    if (!dimensions.width || dimensions.width === '' || parseFloat(dimensions.width) <= 0) missingFields.push('Largeur (doit être > 0)');
    if (!dimensions.height || dimensions.height === '' || parseFloat(dimensions.height) <= 0) missingFields.push('Hauteur (doit être > 0)');
    if (!weight || weight === '' || parseFloat(weight) <= 0) missingFields.push('Poids (doit être > 0)');

    if (missingFields.length > 0) {
      console.log('❌ Champs manquants:', missingFields);
      alert(`Veuillez remplir les champs suivants:\n${missingFields.join('\n')}`);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    const productData = {
      name: product.trim(),
      category: 'Manuel',
      dimensions: {
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height)
      },
      weight: parseFloat(weight),
      sku: `MAN-${Date.now()}`,
      price: 0,
      createdAt: new Date().toISOString(),
      source: 'manual-entry'
    };

    console.log('📦 Données du produit à sauvegarder:', productData);

    try {
      console.log('💾 Sauvegarde du produit dans Firebase:');
      console.log('📦 Données complètes:', JSON.stringify(productData, null, 2));
      console.log('📏 Dimensions détaillées:');
      console.log('  - Longueur:', productData.dimensions.length, 'cm');
      console.log('  - Largeur:', productData.dimensions.width, 'cm');
      console.log('  - Hauteur:', productData.dimensions.height, 'cm');
      console.log('⚖️ Poids:', productData.weight, 'kg');

      // Sauvegarder dans Firebase
      const savedProduct = await firebaseService.addProduct(productData);

      console.log('✅ Produit sauvegardé avec succès dans Firebase');
      console.log('🆔 ID du produit sauvegardé:', savedProduct.id);
      console.log('📋 Données sauvegardées:', savedProduct);

      setSaveStatus('success');

      // Réinitialiser le statut après 3 secondes
      setTimeout(() => setSaveStatus(null), 3000);

    } catch (error) {
      console.error('❌ Erreur sauvegarde produit dans Firebase:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };





  // Fonction pour mettre à jour la valeur déclarée totale
  const updateTotalDeclaredValue = () => {
    let totalValue = 0;

    // Ajouter le prix du produit principal
    const mainProductPrice = parseFloat(declaredValue) || 0;
    totalValue += mainProductPrice;

    // Ajouter les prix des produits supplémentaires - section supprimée

    // Mettre à jour la valeur déclarée si elle a changé
    if (totalValue > 0 && totalValue !== parseFloat(declaredValue)) {
      setDeclaredValue(totalValue.toString());
      console.log('💰 Valeur déclarée totale mise à jour:', totalValue);
    }
  };

  // Mettre à jour la valeur déclarée quand les produits supplémentaires changent
  React.useEffect(() => {
    // Utiliser setTimeout pour s'assurer que toutes les mises à jour d'état sont terminées
    const timeoutId = setTimeout(() => {
      if (typeof updateTotalDeclaredValue === 'function') {
        updateTotalDeclaredValue();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [declaredValue]);

  // Fonction pour générer des recommandations intelligentes
  const generateRecommendations = (productData) => {
    if (!productData) return [];

    const recommendations = [];
    const category = (productData.category || '').toLowerCase();
    const price = parseFloat(productData.price) || 0;
    const weight = parseFloat(productData.weight) || 0;

    // Recommandations basées sur la catégorie
    if (category.includes('fragile') || category.includes('verre')) {
      recommendations.push({
        type: 'warning',
        message: 'Produit fragile détecté. Livraison à domicile recommandée pour plus de sécurité.'
      });
    }

    if (category.includes('électronique') && price > 5000) {
      recommendations.push({
        type: 'success',
        message: 'Assurance 1% activée automatiquement pour ce produit électronique de valeur.'
      });
    }

    // Recommandations basées sur le poids - supprimée (non nécessaire)

    // Recommandations basées sur le prix
    if (price > 10000) {
      recommendations.push({
        type: 'warning',
        message: 'Produit de haute valeur. Vérifiez les conditions d\'assurance.'
      });
    }

    if (price < 1000 && weight < 1) {
      recommendations.push({
        type: 'success',
        message: 'Produit léger et peu coûteux. Livraison au bureau recommandée (moins cher).'
      });
    }

    return recommendations;
  };









  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let distance = 0;


      if (destinationCoords) {
        // Calculer la distance réelle avec Google Maps
        const distanceData = await googleMapsService.calculateDistance(destinationCoords);
        distance = distanceData.distance;
        

      } else {
        // Fallback: utiliser une distance simulée
        distance = Math.floor(Math.random() * 50) + 5;
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
          // Utiliser les données directement depuis YalidineWilayaCommuneSelector
          try {
            // Vérifier si destination contient les informations de prix
            console.log('🔍 Vérification destination:', typeof destination, destination);
            console.log('🔍 destination.pricing:', destination?.pricing);
            console.log('🔍 destination.pricing?.yalidine:', destination?.pricing?.yalidine);

            if (typeof destination === 'object' && destination.pricing?.yalidine) {
              console.log('💰 Utilisation des prix Firebase depuis YalidineWilayaCommuneSelector');

              const weight_kg = parseFloat(weight) || 0;
              const declaredValueNum = parseFloat(declaredValue) || 0;

              // Calculer le poids volumétrique et le poids facturable
              const length = parseFloat(dimensions.length) || 0;
              const width = parseFloat(dimensions.width) || 0;
              const height = parseFloat(dimensions.height) || 0;

              // Formule Yalidine: (L × l × H) / 5000
              const volumetricWeight = (length && width && height) ?
                Math.floor((length * width * height) / 5000) : 0;

              // Poids facturable = max(poids réel, poids volumétrique) - arrondi vers le bas
              const billableWeight = Math.floor(Math.max(weight_kg, volumetricWeight));

              console.log(`📏 Calcul poids facturable:`);
              console.log(`  - Poids réel: ${weight_kg}kg`);
              console.log(`  - Poids volumétrique: ${volumetricWeight}kg (${length}×${width}×${height}/5000 arrondi vers le bas)`);
              console.log(`  - Poids facturable: ${billableWeight}kg (arrondi vers le bas)`);

              // Calculer le prix de base selon le type de livraison
              let basePrice = deliveryType === 'office'
                ? (destination.pricing.yalidine.office || 0)
                : (destination.pricing.yalidine.home || 0);

              console.log(`💰 Calcul prix Firebase: deliveryType="${deliveryType}", basePrice=${basePrice}DA (office: ${destination.pricing.yalidine.office}DA, home: ${destination.pricing.yalidine.home}DA)`);

              // Ajouter supplément si poids facturable > 5kg (tarifs selon zone)
              let overweightFee = 0;
              if (billableWeight > 5) {
                const extraWeight = billableWeight - 5;
                const zone = destination.zone || 3; // Zone par défaut si non définie

                // Tarifs par zone pour le surpoids
                let ratePerKg = 50; // Zones 0, 1, 2, 3 par défaut
                if (zone === 4 || zone === 5) {
                  ratePerKg = 100; // Zones 4 et 5
                }

                overweightFee = Math.floor(extraWeight) * ratePerKg;
                console.log(`⚖️ Surpoids: ${Math.floor(extraWeight)}kg × ${ratePerKg}DA = ${overweightFee}DA (Zone ${zone})`);
              }

              // Ajouter frais de remboursement (1% de la valeur déclarée)
              let reimbursementFee = 0;
              if (declaredValueNum > 0) {
                reimbursementFee = Math.round(declaredValueNum * 0.01);
              }

              const totalCost = basePrice + overweightFee + reimbursementFee;

              console.log('🔍 DeliveryForm - Calcul final:');
              console.log('  - Prix de base (basePrice):', basePrice);
              console.log('  - Frais surpoids:', overweightFee);
              console.log('  - Frais 1%:', reimbursementFee);
              console.log('  - Total (cost):', totalCost);

              calculationResult = {
                cost: totalCost,
                basePrice: basePrice,
                actualWeight: weight_kg,
                billableWeight: billableWeight,
                volumetricWeight: volumetricWeight,
                dimensions: {
                  length: length,
                  width: width,
                  height: height
                },
                supplements: {
                  overweight: overweightFee,
                  reimbursement: reimbursementFee
                },
                dataSource: 'firebase-direct',
                location: {
                  wilaya: destination.wilayaName,
                  commune: destination.communeName,
                  zone: destination.zone
                },
                service: 'Yalidine'
              };

              console.log(`✅ Prix Yalidine calculé depuis Firebase: ${totalCost}DA`);
              console.log(`  - Base: ${basePrice}DA`);
              console.log(`  - Surpoids: ${overweightFee}DA (${billableWeight}kg facturable)`);
              console.log(`  - Remboursement: ${reimbursementFee}DA`);
            } else {
              // Erreur: Firebase pricing requis
              console.error('❌ ERREUR: Données Firebase manquantes pour Yalidine');
              console.error('❌ Destination type:', typeof destination);
              console.error('❌ Destination pricing:', destination?.pricing);
              console.error('❌ Veuillez sélectionner une destination valide depuis la liste Firebase');

              throw new Error('Données de prix Firebase manquantes. Veuillez sélectionner une destination depuis la liste.');
            }
          } catch (error) {
            console.error('❌ Erreur calcul Yalidine:', error.message);
            calculationResult = {
              error: error.message,
              service: 'Yalidine' // تأكد من تعيين الخدمة حتى في حالة الخطأ
            };
          }
          break;
        default:
          calculationResult = { error: 'Service non reconnu' };
      }
      
      // Ajouter les informations de distance au résultat
      if (service !== 'Yalidine') {
        calculationResult.distance = Math.round(distance * 10) / 10;
      }

      // إضافة بيانات الأبعاد والوزن للنتيجة
      calculationResult.dimensions = dimensions;
      calculationResult.actualWeight = parseFloat(weight) || 1;

      // إضافة معلومات الوجهة والخدمة (تأكد من تعيينها دائماً)
      calculationResult.destination = destination;
      calculationResult.service = service;

      // تأكد مضاعف من تعيين الخدمة
      if (!calculationResult.service) {
        calculationResult.service = service;
      }

      console.log('📦 Résultat final:', calculationResult);
      console.log('🔍 Service dans le résultat:', calculationResult.service);
      console.log('🔍 Service sélectionné:', service);

      setResult(calculationResult);
    } catch (error) {
      console.error('Erreur lors du calcul:', error);
      setResult({ error: 'Erreur lors du calcul. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="animate-fadeInUp">
      <form onSubmit={handleSubmit} className="form-container">
        <h2 style={{textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '1.5rem', fontWeight: '700'}}>Calculateur de Coût de Livraison BebeClick</h2>
        
        <div className="form-group">
          <label htmlFor="origin" className="form-label" style={{ fontSize: '17px' }}>
            <MapPin size={16} />
            <span>Adresse de départ:</span>
          </label>
          <AddressInput
            value={origin}
            onChange={setOrigin}
            placeholder="Bebe Click Magasin"
            disabled={true}
            className="form-control"
          />
        </div>
        
        <div className="form-group service-selection-section">
          <label className="form-label">
            <Truck size={16} />
            <span>Choisissez votre service de livraison</span>
          </label>
          <div className="service-options">
            <label className={`service-option ${service === 'Yalidine' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="Yalidine"
                checked={service === 'Yalidine'}
                onChange={(e) => setService(e.target.value)}
              />
              <img
                src="/logos/yalidine.png"
                alt="Yalidine"
                className="service-logo"
              />
              <span className="service-name">Yalidine (Toutes les wilayas)</span>
            </label>
            <label className={`service-option ${service === 'Zaki' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="Zaki"
                checked={service === 'Zaki'}
                onChange={(e) => setService(e.target.value)}
              />
              <img
                src="/logos/zaki.png"
                alt="Zaki"
                className="service-logo"
              />
              <span className="service-name">Zaki (Alger et banlieue)</span>
            </label>
            <label className={`service-option ${service === 'Jamal Delivery' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="Jamal Delivery"
                checked={service === 'Jamal Delivery'}
                onChange={(e) => setService(e.target.value)}
              />
              <img
                src="/logos/jamal.webp"
                alt="Jamal Delivery"
                className="service-logo"
              />
              <span className="service-name">Jamal Delivery (Alger et banlieue)</span>
            </label>
          </div>
        </div>

        <div className="form-group highlighted">
          <label htmlFor="destination" className="form-label required">
            <MapPin size={16} />
            <span>Adresse de destination:</span>
          </label>
          {service === 'Yalidine' ? (
            <YalidineWilayaCommuneSelector
              value={destination}
              onChange={setDestination}
              placeholder="Sélectionner wilaya puis commune..."
            />
          ) : service === 'Zaki' ? (
            <GooglePlacesInput
              value={destination}
              onChange={setDestination}
              onPlaceSelect={handleGooglePlaceSelect}
              placeholder="Rechercher une adresse à Alger..."
              className="form-control full-width"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          ) : (
            <AddressInput
              value={destination}
              onChange={handleDestinationChange}
              onPlaceSelect={handleDestinationSelect}
              placeholder="Entrez la destination ou collez un lien Google Maps"
              className="form-control full-width"
            />
          )}
          {service === 'Yalidine' && (
            <div className="form-help">
              <Info size={14} />
              <span>Sélectionnez d'abord la wilaya, puis la commune dans cette wilaya</span>
            </div>
          )}
          {service === 'Zaki' && (
            <div className="form-help">
              <Info size={14} />
              <span>Recherche limitée à Alger et ses environs (Blida, Boumerdes, Tipaza)</span>
            </div>
          )}
          {(service === 'Zaki' || service === 'Jamal Delivery') && (
            <div className="form-help">
              <Info size={14} />
              <span>Tapez une adresse ou collez un lien Google Maps (ex: https://maps.app.goo.gl/...)</span>
              <a
                href={destination ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}` : "https://maps.google.com"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: '8px',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #dbeafe',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dbeafe';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#eff6ff';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <MapPin size={12} />
                {destination ? 'Voir sur Maps' : 'Ouvrir Maps'}
              </a>
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="product-header">
            <label htmlFor="product" className="form-label optional" style={{ fontSize: '17px' }}>
              <Package size={16} />
              <span>Produit:</span>
            </label>
          </div>
          <ProductInput
            value={product}
            onChange={setProduct}
            onProductSelect={handleProductSelect}
            placeholder="Rechercher un produit..."
            className="form-control full-width"
            style={{ backgroundColor: 'white', color: 'black' }}
          />
        </div>

          {/* Notification de remplissage automatique - masquée pour une interface plus propre */}



          {/* Prévisualisation du remplissage automatique */}
          <AutoFillPreview
            product={selectedProductData?.name}
            dimensions={dimensions}
            weight={weight}
            declaredValue={declaredValue}
            deliveryType={deliveryType}
            reimbursementOption={reimbursementType}
            show={showAutoFillPreview}
          />

          {/* Détails du produit - masqués pour une interface plus propre */}

          {/* Recommandations intelligentes - intégrées dans Configuration Yalidine */}

        {service === 'Yalidine' && (
          <div className="yalidine-options modern-yalidine">
            <h3>Configuration Yalidine</h3>

            {/* Informations sur le calcul du poids */}
            <div className="weight-calculation-info" style={{
              backgroundColor: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              fontSize: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Calculator size={20} style={{ color: '#3b82f6', marginRight: '8px' }} />
                <h4 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Calcul du poids facturable</h4>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#475569' }}>Formule du poids volumétrique:</strong>
                <span style={{ marginLeft: '8px', fontFamily: 'monospace', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '6px' }}>
                  (L × l × H) ÷ 5000
                </span>
              </div>
              <div style={{ color: '#64748b', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} style={{ color: '#3b82f6' }} />
                Le coût sera calculé sur la base du <strong>poids le plus élevé</strong> entre le poids réel et volumétrique.
              </div>
            </div>

            {/* Dimensions et poids */}
            <div className="yalidine-section">
              <h4>Dimensions et poids du colis</h4>

              <div className="form-row">
                <div className="form-group compact">
                  <label htmlFor="length">Longueur (cm):</label>
                  <input
                    type="number"
                    id="length"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                    className="form-control compact"
                    placeholder="0"
                    style={{ backgroundColor: 'white', color: 'black', textAlign: 'center' }}
                  />
                </div>
                <div className="form-group compact">
                  <label htmlFor="width">Largeur (cm):</label>
                  <input
                    type="number"
                    id="width"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    className="form-control compact"
                    placeholder="0"
                    style={{ backgroundColor: 'white', color: 'black', textAlign: 'center' }}
                  />
                </div>
                <div className="form-group compact">
                  <label htmlFor="height">Hauteur (cm):</label>
                  <input
                    type="number"
                    id="height"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    className="form-control compact"
                    placeholder="0"
                    style={{ backgroundColor: 'white', color: 'black', textAlign: 'center' }}
                  />
                </div>
                <div className="form-group compact">
                  <label htmlFor="weight">Poids réel (kg):</label>
                  <input
                    type="number"
                    id="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="form-control compact"
                    placeholder="0"
                    step="0.1"
                    style={{ backgroundColor: 'white', color: 'black', textAlign: 'center' }}
                  />
                </div>
              </div>

              {/* Recommandations intelligentes intégrées */}
              {selectedProductData && (
                <DeliveryRecommendations
                  product={selectedProductData}
                  recommendations={generateRecommendations(selectedProductData)}
                  show={true}
                />
              )}


            </div>

            {/* Type de livraison */}
            <div className="yalidine-section">
              <h4>Type de livraison</h4>
              <div className="delivery-type-options" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="radio-option" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  border: `2px solid ${deliveryType === 'home' ? '#dc2626' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: deliveryType === 'home' ? '#fef2f2' : '#ffffff',
                  transition: 'all 0.3s ease'
                }}>
                  <input
                    type="radio"
                    name="deliveryType"
                    value="home"
                    checked={deliveryType === 'home'}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    style={{ marginRight: '12px' }}
                  />
                  <Home size={20} style={{ color: '#dc2626', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>Livraison à domicile</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Prix plus élevé</div>
                  </div>
                </label>
                <label className="radio-option" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  border: `2px solid ${deliveryType === 'office' ? '#16a34a' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: deliveryType === 'office' ? '#f0fdf4' : '#ffffff',
                  transition: 'all 0.3s ease'
                }}>
                  <input
                    type="radio"
                    name="deliveryType"
                    value="office"
                    checked={deliveryType === 'office'}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    style={{ marginRight: '12px' }}
                  />
                  <Building2 size={20} style={{ color: '#16a34a', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '16px' }}>Livraison au bureau</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Prix réduit</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Prix du colis */}
            <div className="yalidine-section">
              <h4>Prix du colis (optionnel)</h4>
              <div className="form-group">
                <label htmlFor="declaredValue">Valeur déclarée (DA):</label>
                <input
                  type="number"
                  id="declaredValue"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  className="form-control"
                  placeholder="Prix du colis à livrer"
                  style={{ backgroundColor: 'white', color: 'black', textAlign: 'center' }}
                />
                <small className="form-help">Prix du colis que le client doit payer (optionnel)</small>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions" style={{textAlign: 'center', marginTop: '2rem'}}>
          <button type="submit" className="modern-btn modern-btn-primary" disabled={loading || !destination || (typeof destination === 'object' && !destination.text)} style={{fontSize: '16px', padding: '1rem 2rem', minWidth: '200px'}}>
            {loading ? (
              <>
                <div className="loading-spinner" style={{width: '16px', height: '16px', marginRight: '8px'}}></div>
                Calcul en cours...
              </>
            ) : (
              <>
                <Calculator size={16} />
                Calculer
              </>
            )}
          </button>

          {product && product.trim() !== '' &&
           dimensions.length && dimensions.length.toString().trim() !== '' && parseFloat(dimensions.length) > 0 &&
           dimensions.width && dimensions.width.toString().trim() !== '' && parseFloat(dimensions.width) > 0 &&
           dimensions.height && dimensions.height.toString().trim() !== '' && parseFloat(dimensions.height) > 0 &&
           weight && weight.toString().trim() !== '' && parseFloat(weight) > 0 && (
            <button
              type="button"
              className={`save-product-button-modern ${isSaving ? 'saving' : ''} ${saveStatus ? saveStatus : ''}`}
              onClick={saveManualProduct}
              disabled={isSaving}
              title="Sauvegarder ce produit dans Firebase pour utilisation future"
            >
              <div className="button-content">
                {isSaving ? (
                  <>
                    <div className="spinner"></div>
                    <span>Sauvegarde...</span>
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle size={18} />
                    <span>Sauvegardé!</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle size={18} />
                    <span>Erreur</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Sauvegarder produit</span>
                  </>
                )}
              </div>
            </button>
          )}
        </div>
      </form>

      {result && (
        <>
          <ResultDisplay
            result={result}
            yalidineFeeEnabled={yalidineFeeEnabled}
            declaredValue={declaredValue}
            reimbursementType={reimbursementType}
            reimbursementAmount={reimbursementAmount}
            deliveryType={deliveryType}
          />


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


    </div>
  );
}

export default DeliveryForm;


