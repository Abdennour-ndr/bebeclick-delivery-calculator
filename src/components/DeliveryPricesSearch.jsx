/**
 * مكون البحث عن أسعار التوصيل حسب الولاية
 * يسمح بالبحث في Firebase عن أسعار التوصيل لولاية معينة
 */

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Package, Truck, AlertCircle, Loader2 } from 'lucide-react';
import firebaseService from '../services/firebaseService.js';

const DeliveryPricesSearch = () => {
  const [wilayas, setWilayas] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // خدمات التوصيل المتاحة
  const deliveryServices = [
    { value: '', label: 'جميع الخدمات' },
    { value: 'yalidine', label: 'Yalidine' },
    { value: 'zaki', label: 'Zaki' },
    { value: 'jamal-delivery', label: 'Jamal Delivery' }
  ];

  // تحميل الولايات عند بدء التشغيل
  useEffect(() => {
    loadWilayas();
  }, []);

  const loadWilayas = async () => {
    try {
      const wilayasData = await firebaseService.getWilayas();
      setWilayas(wilayasData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('خطأ في تحميل الولايات:', error);
      setError('فشل في تحميل الولايات');
    }
  };

  const searchPrices = async () => {
    if (!selectedWilaya) {
      setError('يرجى اختيار ولاية');
      return;
    }

    setLoading(true);
    setError('');
    setPrices([]);

    try {
      const pricesData = await firebaseService.getDeliveryPricesByWilaya(
        selectedWilaya,
        selectedService || null
      );
      setPrices(pricesData);
      
      if (pricesData.length === 0) {
        setError('لم يتم العثور على أسعار لهذه الولاية');
      }
    } catch (error) {
      console.error('خطأ في البحث عن الأسعار:', error);
      setError('فشل في البحث عن الأسعار');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getServiceIcon = (service) => {
    switch (service) {
      case 'yalidine':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'zaki':
        return <Package className="w-4 h-4 text-green-600" />;
      case 'jamal-delivery':
        return <MapPin className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getServiceColor = (service) => {
    switch (service) {
      case 'yalidine':
        return 'bg-blue-50 border-blue-200';
      case 'zaki':
        return 'bg-green-50 border-green-200';
      case 'jamal-delivery':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Search className="w-6 h-6 text-blue-600" />
          البحث عن أسعار التوصيل
        </h2>
        <p className="text-gray-600">
          ابحث عن أسعار التوصيل حسب الولاية وخدمة التوصيل
        </p>
      </div>

      {/* نموذج البحث */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* اختيار الولاية */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الولاية
          </label>
          <select
            value={selectedWilaya}
            onChange={(e) => setSelectedWilaya(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">اختر الولاية</option>
            {wilayas.map((wilaya) => (
              <option key={wilaya.code} value={wilaya.code}>
                {wilaya.code} - {wilaya.name}
              </option>
            ))}
          </select>
        </div>

        {/* اختيار الخدمة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            خدمة التوصيل
          </label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {deliveryServices.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        {/* زر البحث */}
        <div className="flex items-end">
          <button
            onClick={searchPrices}
            disabled={loading || !selectedWilaya}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            بحث
          </button>
        </div>
      </div>

      {/* رسائل الخطأ */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* نتائج البحث */}
      {prices.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            نتائج البحث ({prices.length} نتيجة)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prices.map((price) => (
              <div
                key={price.id}
                className={`p-4 rounded-lg border-2 ${getServiceColor(price.service)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(price.service)}
                    <span className="font-semibold text-gray-800 capitalize">
                      {price.service}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    المنطقة {price.zone || 1}
                  </span>
                </div>

                <div className="mb-3">
                  <h4 className="font-medium text-gray-800">{price.commune}</h4>
                  <p className="text-sm text-gray-600">
                    الولاية {price.wilayaCode} - {price.wilayaName}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">التوصيل للمنزل:</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(price.pricing?.home || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">التوصيل للمكتب:</span>
                    <span className="font-semibold text-blue-600">
                      {formatPrice(price.pricing?.office || 0)}
                    </span>
                  </div>
                </div>

                {price.pricing?.supplements && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      رسوم إضافية: {price.pricing.supplements.overweightFee || 0} دج/كغ
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPricesSearch;
