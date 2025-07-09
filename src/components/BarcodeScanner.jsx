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

  const initializeScanner = () => {
    try {
      setError(null);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778,
        disableFlip: false
      };

      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        config,
        false
      );

      html5QrcodeScannerRef.current.render(
        (decodedText, decodedResult) => {
          console.log('✅ Code-barres scanné:', decodedText);
          setScanResult(decodedText);

          // Arrêter le scan
          html5QrcodeScannerRef.current.clear();

          setTimeout(() => {
            if (onScanSuccess) {
              onScanSuccess(decodedText);
            }
            onClose();
          }, 1000);
        },
        (errorMessage) => {
          // Ignorer les erreurs de QR code non trouvé
          if (!errorMessage.includes('No QR code found')) {
            console.warn('Erreur de lecture du code-barres:', errorMessage);
          }
        }
      );

    } catch (err) {
      console.error('Erreur d\'initialisation du scanner:', err);
      setError('Échec d\'initialisation de la caméra');
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

        {/* Scanner Container */}
        <div className="barcode-video-container">
          {error ? (
            <div className="barcode-error">
              <AlertCircle size={48} />
              <p>{error}</p>
              <button onClick={initializeScanner} className="barcode-retry-btn">
                Réessayer
              </button>
            </div>
          ) : (
            <>
              <div id="qr-reader" style={{ width: '100%' }}></div>

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
