import React, { useState } from 'react';
import DeliveryForm from './DeliveryForm';
import ProductManagement from './ProductManagement';
import { Calculator, Package } from 'lucide-react';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'calculator'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calculator size={18} />
              Calculateur de livraison
            </button>
            
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package size={18} />
              Gestion des Produits
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6">
        {activeTab === 'calculator' && <DeliveryForm />}
        {activeTab === 'products' && <ProductManagement />}
      </div>
    </div>
  );
};

export default MainApp;
