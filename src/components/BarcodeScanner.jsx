import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ isOpen, onClose, onScanSuccess, onError }) => {
  const html5QrcodeScannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      console.log('🎥 Initialisation du scanner de code-barres...');
      setError(null);

      // Vérifier si la caméra est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Caméra non supportée par ce navigateur');
      }

      // Demander l'autorisation de la caméra
      try {
        console.log('📱 Demande d\'autorisation de la caméra...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Arrêter le stream temporaire
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Autorisation de la caméra accordée');
      } catch (permissionError) {
        console.error('❌ Autorisation de la caméra refusée:', permissionError);
        throw new Error('Autorisation de la caméra requise pour scanner les codes-barres');
      }

      // إعدادات متجاوبة حسب حجم الشاشة
      const isMobile = window.innerWidth <= 768;
      const qrboxSize = isMobile 
        ? { width: Math.min(250, window.innerWidth - 40), height: 150 }
        : { width: 300, height: 180 };

      const config = {
        fps: 10,
        qrbox: qrboxSize,
        aspectRatio: isMobile ? 1.5 : 1.777778,
        disableFlip: false,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [0, 1], // QR Code et Code-barres
        verbose: true, // Pour plus de logs
        formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // Tous les formats
      };

      console.log('🔧 Configuration du scanner:', config);

      // Attendre que l'élément DOM soit prêt
      setTimeout(() => {
        const qrReaderElement = document.getElementById("qr-reader");
        if (!qrReaderElement) {
          console.error('❌ Élément qr-reader non trouvé');
          setError('Élément scanner non trouvé');
          return;
        }

        console.log('📱 Élément qr-reader trouvé, initialisation...');

        // Nettoyer l'élément avant de créer un nouveau scanner
        qrReaderElement.innerHTML = '';

        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          config,
          false
        );

        html5QrcodeScannerRef.current.render(
          (decodedText) => {
            console.log('✅ Code-barres scanné:', decodedText);
            setScanResult(decodedText);

            // Arrêter le scan
            if (html5QrcodeScannerRef.current) {
              html5QrcodeScannerRef.current.clear();
            }

            setTimeout(() => {
              if (onScanSuccess) {
                onScanSuccess(decodedText);
              }
              onClose();
            }, 1000);
          },
          (errorMessage) => {
            // Ignorer les erreurs de QR code non trouvé
            if (!errorMessage.includes('No QR code found') &&
                !errorMessage.includes('NotFoundException')) {
              console.warn('⚠️ Erreur de lecture du code-barres:', errorMessage);
            }
          }
        );

        console.log('✅ Scanner render() appelé avec succès');
        console.log('✅ Scanner initialisé avec succès');
        
        // Vérifier si le video apparaît après un délai
        let checkAttempts = 0;
        const maxAttempts = 10;
        
        const checkVideoElements = () => {
          checkAttempts++;
          const videoElement = document.querySelector('#qr-reader video');
          const canvasElement = document.querySelector('#qr-reader canvas');
          const selectElement = document.querySelector('#qr-reader select');
          const buttonElements = document.querySelectorAll('#qr-reader button');
          
          console.log(`🔍 Tentative ${checkAttempts}/${maxAttempts}:`);
          console.log('🎥 Élément vidéo trouvé:', !!videoElement);
          console.log('🖼️ Élément canvas trouvé:', !!canvasElement);
          console.log('📋 Élément select trouvé:', !!selectElement);
          console.log('🔘 Boutons trouvés:', buttonElements.length);
          
          if (videoElement) {
            console.log('📹 Propriétés vidéo:', {
              width: videoElement.videoWidth,
              height: videoElement.videoHeight,
              readyState: videoElement.readyState
            });
            
            // Forcer l'affichage du vidéo
            videoElement.style.display = 'block';
            videoElement.style.width = '100%';
            videoElement.style.height = 'auto';
            return; // Succès!
          }
          
          // Si on a des boutons mais pas de vidéo, cliquer sur "Start Camera"
          if (buttonElements.length > 0 && !videoElement) {
            const startButton = Array.from(buttonElements).find(btn => 
              btn.textContent.includes('Start') || 
              btn.textContent.includes('Camera') ||
              btn.textContent.includes('Démarrer')
            );
            
            if (startButton) {
              console.log('🔘 Clic automatique sur le bouton de démarrage');
              startButton.click();
              
              // Vérifier à nouveau après le clic
              setTimeout(checkVideoElements, 1000);
              return;
            }
          }
          
          // Continuer à vérifier si on n'a pas atteint le maximum
          if (checkAttempts < maxAttempts) {
            setTimeout(checkVideoElements, 1000);
          } else {
            console.error('❌ Aucun élément vidéo trouvé après toutes les tentatives');
            setError('La caméra ne démarre pas. Essayez de recharger la page ou utilisez un autre navigateur.');
          }
        };
        
        // Commencer la vérification après 2 secondes
        setTimeout(checkVideoElements, 2000);

      }, 200); // Attendre 200ms pour que l'élément soit prêt

    } catch (err) {
      console.error('❌ Erreur d\'initialisation du scanner:', err);
      setError(err.message || 'Échec d\'initialisation de la caméra');
      if (onError) onError(err);
    }
  };

  const stopScanning = () => {
    try {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
        html5QrcodeScannerRef.current = null;
      }
    } catch (err) {
      console.warn('Erreur d\'arrêt du scan:', err);
    }
    setScanResult(null);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="barcode-scanner-overlay">
      <div className="barcode-scanner-container">
        {/* Header */}
        <div className="barcode-scanner-header">
          <h3>
            <Camera size={20} />
             Scanner un code-barres
          </h3>
          <button onClick={handleClose} className="barcode-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <Camera size={16} />
            <span className="text-sm font-medium">
              Autorisez l'accès à la caméra pour scanner les codes-barres
            </span>
          </div>
        </div>

        {/* Scanner Container */}
        <div className="barcode-video-container">
          {error ? (
            <div className="barcode-error">
              <AlertCircle size={48} />
              <p>{error}</p>
              <div className="mt-4 space-y-2">
                <button onClick={initializeScanner} className="barcode-retry-btn">
                  Réessayer
                </button>
                <div className="text-sm text-gray-600 mt-2">
                  <p>💡 Assurez-vous que:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Votre navigateur supporte la caméra</li>
                    <li>Vous avez autorisé l'accès à la caméra</li>
                    <li>Aucune autre application n'utilise la caméra</li>
                    <li>Vous utilisez HTTPS (requis pour la caméra)</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                id="qr-reader"
                style={{
                  width: '100%',
                  minHeight: window.innerWidth <= 768 ? '250px' : '300px',
                  border: '2px solid rgb(229, 231, 235)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              ></div>

              {/* Success Indicator */}
              {scanResult && (
                <div className="barcode-success">
                  <CheckCircle size={48} />
                  <p>Code-barres scanné avec succès!</p>
                  <code>{scanResult}</code>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
