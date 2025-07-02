/**
 * Tableau de bord d'administration
 * Interface principale pour la gestion des données MongoDB
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import PricingManagement from './PricingManagement';
import ProductManagement from './ProductManagement';
import LocationManagement from './LocationManagement';
import { 
  Database, 
  DollarSign, 
  Package, 
  MapPin, 
  Settings, 
  Activity,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Server
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Charger les statistiques
  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        pricingResponse,
        productsResponse,
        locationsResponse,
        healthResponse
      ] = await Promise.all([
        fetch('/api/delivery-pricing/stats'),
        fetch('/api/products/stats'),
        fetch('/api/locations/stats'),
        fetch('/health')
      ]);

      const [pricingData, productsData, locationsData, healthData] = await Promise.all([
        pricingResponse.json(),
        productsResponse.json(),
        locationsResponse.json(),
        healthResponse.json()
      ]);

      setStats({
        pricing: pricingData.success ? pricingData.data : [],
        products: productsData.success ? productsData.data : { general: [], categories: [] },
        locations: locationsData.success ? locationsData.data : { general: [], regions: [] }
      });

      setHealthStatus(healthData);

    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Vider les caches
  const clearCaches = async () => {
    setLoading(true);
    try {
      // Appel API pour vider les caches (à implémenter)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
      loadStats();
    } catch (err) {
      setError('Erreur lors du vidage des caches');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadStats();
  }, []);

  // Calculer les totaux
  const getTotalPricing = () => {
    if (!stats?.pricing) return 0;
    return stats.pricing.reduce((total, service) => total + service.count, 0);
  };

  const getTotalProducts = () => {
    if (!stats?.products?.general) return 0;
    return stats.products.general.reduce((total, status) => total + status.count, 0);
  };

  const getTotalLocations = () => {
    if (!stats?.locations?.general) return 0;
    return stats.locations.general.reduce((total, type) => total + type.count, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administration MongoDB</h1>
              <p className="text-gray-600">Gestion des données BebeClick Delivery Calculator</p>
            </div>
            <div className="flex items-center gap-4">
              {healthStatus && (
                <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                  <Activity className="h-3 w-3 mr-1" />
                  {healthStatus.status === 'healthy' ? 'Système OK' : 'Problème détecté'}
                </Badge>
              )}
              <Button variant="outline" onClick={clearCaches} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Vider Caches
              </Button>
              <Button onClick={loadStats} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages d'état */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="pricing">Prix de livraison</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prix de livraison</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getTotalPricing()}</div>
                  <p className="text-xs text-muted-foreground">
                    Tarifs configurés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produits</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getTotalProducts()}</div>
                  <p className="text-xs text-muted-foreground">
                    Dans le catalogue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Locations</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getTotalLocations()}</div>
                  <p className="text-xs text-muted-foreground">
                    Wilayas et communes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Base de données</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthStatus?.database?.status === 'connected' ? 'OK' : 'KO'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    État de MongoDB
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* État du système */}
            {healthStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    État du Système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Base de données</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">État:</span>
                          <Badge variant={healthStatus.database.status === 'connected' ? 'default' : 'destructive'}>
                            {healthStatus.database.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Host:</span>
                          <span className="text-sm font-mono">{healthStatus.database.host}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Base:</span>
                          <span className="text-sm font-mono">{healthStatus.database.name}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Services</h4>
                      <div className="space-y-2">
                        {Object.entries(healthStatus.services || {}).map(([service, status]) => (
                          <div key={service} className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{service}:</span>
                            <Badge variant={status ? 'default' : 'destructive'}>
                              {status ? 'OK' : 'KO'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistiques détaillées */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Statistiques des prix */}
                <Card>
                  <CardHeader>
                    <CardTitle>Prix par Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.pricing.map((service, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="capitalize">{service._id}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{service.count} prix</Badge>
                            <span className="text-sm text-gray-500">
                              Moy: {Math.round(service.avgHomePrice || 0)} DA
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Statistiques des produits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Produits par Catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.products.categories.slice(0, 5).map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>{category._id || 'Sans catégorie'}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{category.count} produits</Badge>
                            {category.avgPrice && (
                              <span className="text-sm text-gray-500">
                                Moy: {Math.round(category.avgPrice)} DA
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pricing">
            <PricingManagement />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="locations">
            <LocationManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
