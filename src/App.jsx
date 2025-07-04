import React, { useState, useEffect } from 'react';
import './App.css';
import './modern-styles.css';
import './mobile-enhancements.css';
import './modern-components.css';
import './professional-ui.css';
import { Calculator, Package, DollarSign, Building2, Settings, Database, Smartphone, Monitor, Search } from 'lucide-react';
import DeliveryForm from './components/DeliveryForm';
// import ProductManager from './components/ProductManagerFirebase';
// import YalidinePricing from './components/YalidinePricing';
// import YalidineOffices from './components/YalidineOffices';
import YalidineDiagnostic from './components/YalidineDiagnostic';
import AdminDashboard from './components/admin/AdminDashboard';
import DeliveryPricesSearch from './components/DeliveryPricesSearch';
import ResponsiveContainer, { ShowOn, HideOn, ResponsiveText, ResponsiveIcon } from './components/ResponsiveContainer';
import DeviceInfo, { PerformanceInfo, NetworkInfo } from './components/DeviceInfo';
import MobileOptimizations from './components/MobileOptimizations';
import { useResponsive, useDeviceType } from './hooks/use-mobile';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Hooks pour la responsivité
  const responsive = useResponsive();
  const deviceType = useDeviceType();

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Shift+D pour le diagnostic
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        setShowDiagnostic(!showDiagnostic);
        console.log('🔧 Mode diagnostic:', !showDiagnostic ? 'ACTIVÉ' : 'DÉSACTIVÉ');
      }
      // Ctrl+Shift+A pour l'administration
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        setShowAdmin(!showAdmin);
        console.log('👨‍💼 Mode administration:', !showAdmin ? 'ACTIVÉ' : 'DÉSACTIVÉ');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDiagnostic, showAdmin]);

  return (
    <MobileOptimizations>
      <ResponsiveContainer className="App">
        <main className="App-main">
        {/* Navigation tabs responsive - Always show calculator and prices */}
        <div className="tabs-container">
          <div className="tabs-header">
            <button
              className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculator')}
            >
              <ResponsiveIcon
                icon={Calculator}
                desktopSize={18}
                mobileSize={16}
                smallMobileSize={14}
              />
              <ResponsiveText
                desktop="Calculateur de livraison"
                tablet="Calculateur"
                mobile="Calc"
              />
            </button>

            <button
              className={`tab-button ${activeTab === 'prices' ? 'active' : ''}`}
              onClick={() => setActiveTab('prices')}
            >
              <ResponsiveIcon
                icon={Search}
                desktopSize={18}
                mobileSize={16}
                smallMobileSize={14}
              />
              <ResponsiveText
                desktop="البحث عن الأسعار"
                tablet="الأسعار"
                mobile="سعر"
              />
            </button>



            {/* Administration cachée mais accessible via Ctrl+Shift+A */}
            {showAdmin && (
              <button
                className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <ResponsiveIcon
                  icon={Database}
                  desktopSize={18}
                  mobileSize={16}
                  smallMobileSize={14}
                />
                <HideOn smallMobile verySmallMobile>
                  <ResponsiveText
                    desktop="Administration"
                    tablet="Admin"
                    mobile="Adm"
                  />
                </HideOn>
              </button>
            )}
            {/* Diagnostic caché mais accessible via Ctrl+Shift+D */}
            {showDiagnostic && (
              <button
                className={`tab-button ${activeTab === 'diagnostic' ? 'active' : ''}`}
                onClick={() => setActiveTab('diagnostic')}
              >
                <ResponsiveIcon
                  icon={Settings}
                  desktopSize={18}
                  mobileSize={16}
                  smallMobileSize={14}
                />
                <HideOn smallMobile verySmallMobile>
                  <ResponsiveText
                    desktop="Diagnostic"
                    tablet="Diag"
                    mobile="Tst"
                  />
                </HideOn>
              </button>
            )}
            </div>
          </div>

        {/* Contenu des tabs responsive */}
        <div className="tab-content">
          {activeTab === 'calculator' && <DeliveryForm />}
          {activeTab === 'prices' && <DeliveryPricesSearch />}
          {activeTab === 'admin' && <AdminDashboard />}
          {activeTab === 'diagnostic' && <YalidineDiagnostic />}
        </div>

        {/* Informations de développement - masquées pour les utilisateurs */}
        </main>
      </ResponsiveContainer>
    </MobileOptimizations>
  );
}

export default App;


