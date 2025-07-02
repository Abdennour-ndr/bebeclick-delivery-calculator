/**
 * Composant de gestion des prix de livraison
 * Interface d'administration pour modifier les tarifs
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import mongoApiService from '../../services/mongoApiService';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  MapPin,
  Truck,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const PricingManagement = () => {
  const [pricingData, setPricingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulaire pour nouveau prix
  const [newPricing, setNewPricing] = useState({
    service: 'yalidine',
    wilaya: { code: '', name: '' },
    commune: '',
    pricing: {
      home: '',
      office: '',
      supplements: {
        codFeePercentage: 1,
        codFeeFixed: 0,
        overweightFee: 250,
        overweightThreshold: 5
      }
    },
    zone: 1
  });

  const services = [
    { value: 'yalidine', label: 'Yalidine' },
    { value: 'zaki', label: 'Zaki' },
    { value: 'jamal-delivery', label: 'Jamal Delivery' }
  ];

  const wilayas = [
    { code: 16, name: 'Alger' },
    { code: 31, name: 'Oran' },
    { code: 25, name: 'Constantine' },
    { code: 9, name: 'Blida' },
    { code: 6, name: 'Béjaïa' },
    // Ajouter plus de wilayas selon les besoins
  ];

  // Charger les données de prix
  const loadPricingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await mongoApiService.getServicePricing('yalidine');
      setPricingData(data);
      setFilteredData(data);
    } catch (err) {
      setError('Erreur de connexion à l\'API MongoDB');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les données
  useEffect(() => {
    let filtered = pricingData;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.wilaya.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedService !== 'all') {
      filtered = filtered.filter(item => item.service === selectedService);
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedService, pricingData]);

  // Sauvegarder un nouveau prix
  const handleSaveNewPricing = async () => {
    if (!newPricing.wilaya.code || !newPricing.commune || !newPricing.pricing.home || !newPricing.pricing.office) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await mongoApiService.savePricing(newPricing);
      setSuccess('Prix ajouté avec succès');
      setShowAddForm(false);
      setNewPricing({
        service: 'yalidine',
        wilaya: { code: '', name: '' },
        commune: '',
        pricing: {
          home: '',
          office: '',
          supplements: {
            codFeePercentage: 1,
            codFeeFixed: 0,
            overweightFee: 250,
            overweightThreshold: 5
          }
        },
        zone: 1
      });
      loadPricingData();
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un prix
  const handleDeletePricing = async (item) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le prix pour ${item.commune}, ${item.wilaya.name} ?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/delivery-pricing/${item.service}/${item.wilaya.code}/${item.commune}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Prix supprimé avec succès');
        loadPricingData();
      } else {
        setError(data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadPricingData();
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Prix de Livraison</h2>
          <p className="text-gray-600">Gérer les tarifs pour tous les services de livraison</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un Prix
        </Button>
      </div>

      {/* Messages d'état */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par commune ou wilaya..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadPricingData} disabled={loading}>
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Ajouter un Nouveau Prix</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="service">Service</Label>
                <Select value={newPricing.service} onValueChange={(value) => 
                  setNewPricing(prev => ({ ...prev, service: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="wilaya">Wilaya</Label>
                <Select 
                  value={newPricing.wilaya.code.toString()} 
                  onValueChange={(value) => {
                    const wilaya = wilayas.find(w => w.code.toString() === value);
                    setNewPricing(prev => ({ 
                      ...prev, 
                      wilaya: { code: parseInt(value), name: wilaya?.name || '' }
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner wilaya" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayas.map(wilaya => (
                      <SelectItem key={wilaya.code} value={wilaya.code.toString()}>
                        {wilaya.name} ({wilaya.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="commune">Commune</Label>
                <Input
                  value={newPricing.commune}
                  onChange={(e) => setNewPricing(prev => ({ ...prev, commune: e.target.value }))}
                  placeholder="Nom de la commune"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="homePrice">Prix Domicile (DA)</Label>
                <Input
                  type="number"
                  value={newPricing.pricing.home}
                  onChange={(e) => setNewPricing(prev => ({ 
                    ...prev, 
                    pricing: { ...prev.pricing, home: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="400"
                />
              </div>

              <div>
                <Label htmlFor="officePrice">Prix Bureau (DA)</Label>
                <Input
                  type="number"
                  value={newPricing.pricing.office}
                  onChange={(e) => setNewPricing(prev => ({ 
                    ...prev, 
                    pricing: { ...prev.pricing, office: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="350"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveNewPricing} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des prix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Prix de Livraison ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun prix trouvé
            </div>
          ) : (
            <div className="space-y-2">
              {filteredData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{item.commune}</span>
                      <span className="text-gray-500">({item.wilaya.name})</span>
                    </div>
                    <Badge variant="outline">{item.service}</Badge>
                    <Badge variant="secondary">Zone {item.zone}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-gray-500">Domicile:</span>
                      <span className="font-medium ml-1">{item.pricing.home} DA</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Bureau:</span>
                      <span className="font-medium ml-1">{item.pricing.office} DA</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePricing(item)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingManagement;
