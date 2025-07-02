/**
 * Composant de gestion des produits
 * Interface d'administration pour gérer le catalogue
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import mongoApiService from '../../services/mongoApiService';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  Barcode,
  DollarSign,
  Ruler,
  Weight,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Formulaire pour nouveau produit
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    brand: '',
    category: '',
    description: '',
    pricing: {
      salePrice: '',
      costPrice: '',
      currency: 'DZD'
    },
    dimensions: {
      length: '',
      width: '',
      height: '',
      weight: '',
      unit: 'cm'
    },
    inventory: {
      quantity: 0,
      minStock: 0,
      available: true
    }
  });

  // Charger les produits
  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await mongoApiService.searchProducts('', 100);
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      setError('Erreur de connexion à l\'API MongoDB');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les produits
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  // Sauvegarder un nouveau produit
  const handleSaveNewProduct = async () => {
    if (!newProduct.sku || !newProduct.name || !newProduct.dimensions.length || 
        !newProduct.dimensions.width || !newProduct.dimensions.height || !newProduct.dimensions.weight) {
      setError('Veuillez remplir tous les champs obligatoires (SKU, nom, dimensions)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productData = {
        ...newProduct,
        dimensions: {
          ...newProduct.dimensions,
          length: parseFloat(newProduct.dimensions.length),
          width: parseFloat(newProduct.dimensions.width),
          height: parseFloat(newProduct.dimensions.height),
          weight: parseFloat(newProduct.dimensions.weight)
        },
        pricing: {
          ...newProduct.pricing,
          salePrice: parseFloat(newProduct.pricing.salePrice) || 0,
          costPrice: parseFloat(newProduct.pricing.costPrice) || 0
        }
      };

      await mongoApiService.saveProduct(productData);
      setSuccess('Produit ajouté avec succès dans MongoDB');
      setShowAddForm(false);
      resetNewProduct();
      loadProducts();
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const resetNewProduct = () => {
    setNewProduct({
      sku: '',
      name: '',
      brand: '',
      category: '',
      description: '',
      pricing: {
        salePrice: '',
        costPrice: '',
        currency: 'DZD'
      },
      dimensions: {
        length: '',
        width: '',
        height: '',
        weight: '',
        unit: 'cm'
      },
      inventory: {
        quantity: 0,
        minStock: 0,
        available: true
      }
    });
  };

  // Supprimer un produit
  const handleDeleteProduct = async (sku) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit ${sku} ?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${sku}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Produit supprimé avec succès');
        loadProducts();
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

  // Calculer le poids volumétrique
  const calculateVolumetricWeight = (length, width, height) => {
    if (!length || !width || !height) return 0;
    return Math.round((length * width * height / 5000) * 100) / 100;
  };

  // Charger les données au montage
  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Produits</h2>
          <p className="text-gray-600">Gérer le catalogue des produits</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un Produit
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
                  placeholder="Rechercher par nom, SKU ou marque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={loadProducts} disabled={loading}>
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
              <CardTitle>Ajouter un Nouveau Produit</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                  placeholder="PROD-001"
                />
              </div>

              <div>
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom du produit"
                />
              </div>

              <div>
                <Label htmlFor="brand">Marque</Label>
                <Input
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Marque"
                />
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  value={newProduct.category}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Catégorie"
                />
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <Label>Dimensions *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <Label htmlFor="length" className="text-sm">Longueur (cm)</Label>
                  <Input
                    type="number"
                    value={newProduct.dimensions.length}
                    onChange={(e) => setNewProduct(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, length: e.target.value }
                    }))}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="width" className="text-sm">Largeur (cm)</Label>
                  <Input
                    type="number"
                    value={newProduct.dimensions.width}
                    onChange={(e) => setNewProduct(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, width: e.target.value }
                    }))}
                    placeholder="20"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-sm">Hauteur (cm)</Label>
                  <Input
                    type="number"
                    value={newProduct.dimensions.height}
                    onChange={(e) => setNewProduct(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, height: e.target.value }
                    }))}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="text-sm">Poids (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newProduct.dimensions.weight}
                    onChange={(e) => setNewProduct(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, weight: e.target.value }
                    }))}
                    placeholder="1.5"
                  />
                </div>
              </div>
              {newProduct.dimensions.length && newProduct.dimensions.width && newProduct.dimensions.height && (
                <p className="text-sm text-gray-500 mt-2">
                  Poids volumétrique: {calculateVolumetricWeight(
                    parseFloat(newProduct.dimensions.length),
                    parseFloat(newProduct.dimensions.width),
                    parseFloat(newProduct.dimensions.height)
                  )} kg
                </p>
              )}
            </div>

            {/* Prix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salePrice">Prix de vente (DA)</Label>
                <Input
                  type="number"
                  value={newProduct.pricing.salePrice}
                  onChange={(e) => setNewProduct(prev => ({ 
                    ...prev, 
                    pricing: { ...prev.pricing, salePrice: e.target.value }
                  }))}
                  placeholder="25000"
                />
              </div>

              <div>
                <Label htmlFor="costPrice">Prix d'achat (DA)</Label>
                <Input
                  type="number"
                  value={newProduct.pricing.costPrice}
                  onChange={(e) => setNewProduct(prev => ({ 
                    ...prev, 
                    pricing: { ...prev.pricing, costPrice: e.target.value }
                  }))}
                  placeholder="20000"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveNewProduct} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des produits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produits ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun produit trouvé
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Barcode className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm">{product.sku}</span>
                      </div>
                      <h3 className="font-medium">{product.name}</h3>
                      {product.brand && (
                        <p className="text-sm text-gray-500">{product.brand}</p>
                      )}
                    </div>
                    
                    {product.category && (
                      <Badge variant="outline">{product.category}</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-center">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Ruler className="h-3 w-3" />
                        <span>Dimensions</span>
                      </div>
                      <div className="font-medium">
                        {product.dimensions.length}×{product.dimensions.width}×{product.dimensions.height} cm
                      </div>
                    </div>
                    
                    <div className="text-sm text-center">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Weight className="h-3 w-3" />
                        <span>Poids</span>
                      </div>
                      <div className="font-medium">{product.dimensions.weight} kg</div>
                    </div>
                    
                    {product.pricing?.salePrice && (
                      <div className="text-sm text-center">
                        <div className="flex items-center gap-1 text-gray-500">
                          <DollarSign className="h-3 w-3" />
                          <span>Prix</span>
                        </div>
                        <div className="font-medium">{product.pricing.salePrice} DA</div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteProduct(product.sku)}
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

export default ProductManagement;
