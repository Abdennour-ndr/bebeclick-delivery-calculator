import React, { useState, useEffect, useMemo, useCallback } from 'react';
import firebaseService from '../services/firebaseService';
import { useResponsive } from '../hooks/use-mobile';

// Shadcn/ui Components
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

// Lucide Icons
import {
  Package, Search, RefreshCw, Edit, Trash2, Plus, Eye,
  MoreVertical, AlertCircle, X, Loader2, Database, Zap
} from 'lucide-react';

const ProductManager = () => {
  // États principaux
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // États de recherche et filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // États des formulaires
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    brand: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    price: ''
  });

  const { isMobile } = useResponsive();

  // Chargement initial des produits depuis Firebase
  useEffect(() => {
    loadAllProducts();
  }, []);

  // Auto-clear des messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Surveillance de la connexion réseau
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh toutes les 2 minutes pour real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && !loading) {
        loadAllProducts();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isOnline, loading]);

  // Chargement des produits depuis Firebase
  const loadAllProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔥 Chargement des produits depuis Firebase...');
      const data = await firebaseService.getProducts();
      setProducts(Array.isArray(data) ? data : []);
      console.log(`✅ ${data.length} produits chargés depuis Firebase`);
      if (data.length > 0) {
        setSuccess(`${data.length} produits chargés depuis Firebase`);
      }
    } catch (err) {
      console.error('❌ Erreur Firebase:', err);
      setError('Erreur lors du chargement depuis Firebase');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ajout d'un produit dans Firebase
  const handleAddProduct = useCallback(async () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.length || 
        !newProduct.width || !newProduct.height || !newProduct.weight || !newProduct.price) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: newProduct.name,
        sku: newProduct.sku.toUpperCase(),
        category: newProduct.category || 'Non catégorisé',
        brand: newProduct.brand || 'Sans marque',
        dimensions: {
          length: parseFloat(newProduct.length),
          width: parseFloat(newProduct.width),
          height: parseFloat(newProduct.height),
          weight: parseFloat(newProduct.weight)
        },
        pricing: {
          salePrice: parseFloat(newProduct.price)
        }
      };

      console.log('🔥 Ajout produit dans Firebase:', productData);
      await firebaseService.addProduct(productData);
      setSuccess('Produit ajouté avec succès dans Firebase');
      setNewProduct({
        name: '', sku: '', category: '', brand: '',
        length: '', width: '', height: '', weight: '', price: ''
      });
      setShowAddForm(false);
      await loadAllProducts();
    } catch (err) {
      console.error('❌ Erreur ajout Firebase:', err);
      setError('Erreur lors de l\'ajout dans Firebase');
    } finally {
      setLoading(false);
    }
  }, [newProduct, loadAllProducts]);

  // Suppression d'un produit de Firebase
  const handleDeleteProduct = useCallback(async (productId, productName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" de Firebase ?`)) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔥 Suppression produit Firebase ID:', productId);
      await firebaseService.deleteProduct(productId);
      setSuccess('Produit supprimé de Firebase avec succès');
      await loadAllProducts();
    } catch (err) {
      console.error('❌ Erreur suppression Firebase:', err);
      setError('Erreur lors de la suppression de Firebase');
    } finally {
      setLoading(false);
    }
  }, [loadAllProducts]);

  // Gestion de la vue des détails
  const handleViewProduct = useCallback((product) => {
    setEditingProduct(product);
  }, []);

  // Filtrage et tri des produits
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      return aName.localeCompare(bName);
    });
  }, [products, searchTerm, filterCategory]);

  // Catégories uniques
  const categories = useMemo(() => {
    const cats = {};
    products.forEach(product => {
      if (product.category) {
        cats[product.category] = true;
      }
    });
    return cats;
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-white min-h-screen">
      {/* Messages d'état */}
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between text-red-800">
            <span>🔥 Firebase: {error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Database className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between text-green-800">
            <span>🔥 {success}</span>
            <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isOnline && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            ⚠️ Hors ligne - Firebase non disponible
          </AlertDescription>
        </Alert>
      )}

      {/* Header Firebase moderne */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Database className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">إدارة المنتجات</h1>
              <p className="text-green-100 mt-1 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                مدعوم بـ Firebase - تحديث فوري
              </p>
            </div>
          </div>
          
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <button 
                disabled={loading}
                className="bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                <span>منتج جديد</span>
              </button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>🔥 إضافة منتج جديد إلى Firebase</DialogTitle>
                <DialogDescription>
                  سيتم حفظ المنتج مباشرة في قاعدة بيانات Firebase
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">اسم المنتج *</Label>
                    <Input
                      id="product-name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="مثال: iPhone 15 Pro Max"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-sku">رمز المنتج *</Label>
                    <Input
                      id="product-sku"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value.toUpperCase()})}
                      placeholder="مثال: IPH15PM-256"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-category">الفئة</Label>
                    <Input
                      id="product-category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      placeholder="مثال: هواتف ذكية"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-brand">العلامة التجارية</Label>
                    <Input
                      id="product-brand"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                      placeholder="مثال: Apple"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddProduct} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                  حفظ في Firebase
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* عرض بسيط للمنتجات */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold">منتجات Firebase</h2>
          </div>
          <Button onClick={loadAllProducts} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Database className="h-8 w-8 animate-pulse mx-auto mb-4 text-green-600" />
            <p>جاري التحميل من Firebase...</p>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-8">
            <Database className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة منتجك الأول إلى Firebase</p>
            <Button onClick={() => setShowAddForm(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              إضافة منتج
            </Button>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-600">🔥 {product.sku}</p>
                    <p className="text-green-600 font-semibold">
                      {(product.pricing?.salePrice || 0).toLocaleString()} دج
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;
