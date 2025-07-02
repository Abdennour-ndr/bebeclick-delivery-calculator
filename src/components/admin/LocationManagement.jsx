/**
 * Composant de gestion des locations (Wilayas et Communes)
 * Interface d'administration pour gérer la hiérarchie géographique
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
  MapPin,
  Save,
  X,
  Building,
  Map,
  AlertCircle,
  CheckCircle,
  Globe
} from 'lucide-react';

const LocationManagement = () => {
  const [wilayas, setWilayas] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCommuneForm, setShowAddCommuneForm] = useState(false);

  // Formulaire pour nouvelle commune
  const [newCommune, setNewCommune] = useState({
    name: '',
    nameAr: '',
    pricingZone: 1,
    coordinates: {
      latitude: '',
      longitude: ''
    },
    averageDeliveryTime: 3,
    availableServices: [
      { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true },
      { service: 'zaki', available: false, homeDelivery: true, officeDelivery: true },
      { service: 'jamal-delivery', available: false, homeDelivery: true, officeDelivery: true }
    ]
  });

  // Charger les wilayas
  const loadWilayas = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await mongoApiService.getWilayas();
      setWilayas(data);
      if (data.length > 0 && !selectedWilaya) {
        setSelectedWilaya(data[0].code.toString());
      }
    } catch (err) {
      setError('Erreur de connexion à l\'API MongoDB');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les communes d'une wilaya
  const loadCommunes = async (wilayaCode) => {
    if (!wilayaCode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/locations/communes/${wilayaCode}`);
      const data = await response.json();
      
      if (data.success) {
        setCommunes(data.data);
      } else {
        setError('Erreur lors du chargement des communes');
      }
    } catch (err) {
      setError('Erreur de connexion à l\'API');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une nouvelle commune
  const handleAddCommune = async () => {
    if (!newCommune.name || !selectedWilaya) {
      setError('Veuillez remplir le nom de la commune');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/locations/commune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wilayaCode: parseInt(selectedWilaya),
          communeData: {
            ...newCommune,
            coordinates: {
              latitude: parseFloat(newCommune.coordinates.latitude) || null,
              longitude: parseFloat(newCommune.coordinates.longitude) || null
            }
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Commune ajoutée avec succès');
        setShowAddCommuneForm(false);
        resetNewCommune();
        loadCommunes(selectedWilaya);
      } else {
        setError(data.message || 'Erreur lors de l\'ajout de la commune');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const resetNewCommune = () => {
    setNewCommune({
      name: '',
      nameAr: '',
      pricingZone: 1,
      coordinates: {
        latitude: '',
        longitude: ''
      },
      averageDeliveryTime: 3,
      availableServices: [
        { service: 'yalidine', available: true, homeDelivery: true, officeDelivery: true },
        { service: 'zaki', available: false, homeDelivery: true, officeDelivery: true },
        { service: 'jamal-delivery', available: false, homeDelivery: true, officeDelivery: true }
      ]
    });
  };

  // Initialiser les wilayas d'Algérie
  const handleInitializeAlgeria = async () => {
    if (!confirm('Êtes-vous sûr de vouloir initialiser toutes les wilayas d\'Algérie ? Cette opération peut prendre du temps.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/locations/initialize-algeria', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${data.summary.success} wilayas initialisées avec succès`);
        loadWilayas();
      } else {
        setError(data.message || 'Erreur lors de l\'initialisation');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour la zone de tarification
  const handleUpdatePricingZone = async (commune, newZone) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/locations/commune/${commune.code}/zone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zone: newZone }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Zone de tarification mise à jour');
        loadCommunes(selectedWilaya);
      } else {
        setError(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les communes
  const filteredCommunes = communes.filter(commune =>
    commune.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (commune.nameAr && commune.nameAr.includes(searchTerm))
  );

  // Charger les données au montage
  useEffect(() => {
    loadWilayas();
  }, []);

  // Charger les communes quand la wilaya change
  useEffect(() => {
    if (selectedWilaya) {
      loadCommunes(selectedWilaya);
    }
  }, [selectedWilaya]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Locations</h2>
          <p className="text-gray-600">Gérer les wilayas et communes d'Algérie</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleInitializeAlgeria} disabled={loading}>
            <Globe className="h-4 w-4 mr-2" />
            Initialiser Algérie
          </Button>
          <Button onClick={() => setShowAddCommuneForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter Commune
          </Button>
        </div>
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

      <Tabs defaultValue="communes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="communes">Communes</TabsTrigger>
          <TabsTrigger value="wilayas">Wilayas</TabsTrigger>
        </TabsList>

        <TabsContent value="communes" className="space-y-4">
          {/* Sélection de wilaya et filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="w-64">
                  <Label>Wilaya</Label>
                  <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une wilaya" />
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
                
                <div className="flex-1">
                  <Label>Rechercher</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher une commune..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire d'ajout de commune */}
          {showAddCommuneForm && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Ajouter une Nouvelle Commune</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddCommuneForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="communeName">Nom de la commune *</Label>
                    <Input
                      value={newCommune.name}
                      onChange={(e) => setNewCommune(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nom en français"
                    />
                  </div>

                  <div>
                    <Label htmlFor="communeNameAr">Nom en arabe</Label>
                    <Input
                      value={newCommune.nameAr}
                      onChange={(e) => setNewCommune(prev => ({ ...prev, nameAr: e.target.value }))}
                      placeholder="الاسم بالعربية"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pricingZone">Zone de tarification</Label>
                    <Select 
                      value={newCommune.pricingZone.toString()} 
                      onValueChange={(value) => setNewCommune(prev => ({ ...prev, pricingZone: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Zone 1 (Centre)</SelectItem>
                        <SelectItem value="2">Zone 2 (Nord)</SelectItem>
                        <SelectItem value="3">Zone 3 (Est/Ouest)</SelectItem>
                        <SelectItem value="4">Zone 4 (Sud)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="deliveryTime">Délai de livraison (jours)</Label>
                    <Input
                      type="number"
                      value={newCommune.averageDeliveryTime}
                      onChange={(e) => setNewCommune(prev => ({ ...prev, averageDeliveryTime: parseInt(e.target.value) || 3 }))}
                      placeholder="3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude (optionnel)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={newCommune.coordinates.latitude}
                      onChange={(e) => setNewCommune(prev => ({ 
                        ...prev, 
                        coordinates: { ...prev.coordinates, latitude: e.target.value }
                      }))}
                      placeholder="36.7538"
                    />
                  </div>

                  <div>
                    <Label htmlFor="longitude">Longitude (optionnel)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={newCommune.coordinates.longitude}
                      onChange={(e) => setNewCommune(prev => ({ 
                        ...prev, 
                        coordinates: { ...prev.coordinates, longitude: e.target.value }
                      }))}
                      placeholder="3.0588"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddCommuneForm(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddCommune} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des communes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Communes ({filteredCommunes.length})
                {selectedWilaya && wilayas.find(w => w.code.toString() === selectedWilaya) && (
                  <span className="text-sm font-normal text-gray-500">
                    - {wilayas.find(w => w.code.toString() === selectedWilaya).name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredCommunes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {selectedWilaya ? 'Aucune commune trouvée' : 'Sélectionnez une wilaya'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCommunes.map((commune, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{commune.name}</span>
                          {commune.nameAr && (
                            <span className="text-gray-500 text-sm" dir="rtl">({commune.nameAr})</span>
                          )}
                        </div>
                        <Badge variant="outline">Code: {commune.code}</Badge>
                        <Badge variant="secondary">Zone {commune.deliveryConfig?.pricingZone || 1}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-gray-500">Délai:</span>
                          <span className="font-medium ml-1">
                            {commune.deliveryConfig?.averageDeliveryTime || 3} jours
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wilayas" className="space-y-4">
          {/* Liste des wilayas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Wilayas ({wilayas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : wilayas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune wilaya trouvée
                  <div className="mt-4">
                    <Button onClick={handleInitializeAlgeria}>
                      Initialiser les wilayas d'Algérie
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wilayas.map((wilaya, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{wilaya.name}</h3>
                          {wilaya.nameAr && (
                            <p className="text-sm text-gray-500" dir="rtl">{wilaya.nameAr}</p>
                          )}
                        </div>
                        <Badge variant="outline">{wilaya.code}</Badge>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">
                          Zone {wilaya.deliveryConfig?.pricingZone || 1}
                        </Badge>
                        {wilaya.geography?.region && (
                          <Badge variant="outline">{wilaya.geography.region}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LocationManagement;
