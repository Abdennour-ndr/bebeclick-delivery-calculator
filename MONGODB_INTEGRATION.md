# 🗄️ Intégration MongoDB - BebeClick Delivery Calculator

## 📋 Vue d'ensemble

Ce document décrit l'intégration complète de MongoDB dans le système BebeClick Delivery Calculator. MongoDB est maintenant utilisé comme source principale de données avec Google Sheets comme système de fallback.

## 🏗️ Architecture

### Structure des données

```
MongoDB Database: bebeclick-delivery
├── delivery_pricing    # Prix de livraison par service/location
├── locations          # Wilayas et communes d'Algérie  
├── products           # Catalogue des produits
├── settings           # Configuration système
└── logs              # Journaux d'activité
```

### Services hybrides

Le système utilise une approche hybride :
1. **MongoDB** - Source principale (performance, fiabilité)
2. **Google Sheets** - Fallback automatique (compatibilité)
3. **Cache intelligent** - Optimisation des performances

## 🚀 Démarrage rapide

### 1. Configuration MongoDB

```bash
# Installer MongoDB localement ou utiliser MongoDB Atlas
# Configurer les variables d'environnement dans .env

MONGODB_URI=mongodb://localhost:27017/bebeclick-delivery
NODE_ENV=development
```

### 2. Démarrer les services

```bash
# Démarrer le client (port 5173)
npm run dev

# Démarrer l'API MongoDB (port 3001)
npm run server

# Ou les deux en parallèle
npm run dev & npm run server
```

### 3. Accès à l'administration

- **Interface utilisateur** : http://localhost:5173
- **Administration** : Ctrl+Shift+A dans l'interface
- **API MongoDB** : http://localhost:3001
- **Diagnostic** : Ctrl+Shift+D dans l'interface

## 📊 Modèles de données

### DeliveryPricing
```javascript
{
  service: 'yalidine' | 'zaki' | 'jamal-delivery',
  wilaya: { code: Number, name: String },
  commune: String,
  pricing: {
    home: Number,
    office: Number,
    supplements: {
      codFeePercentage: Number,
      overweightFee: Number,
      overweightThreshold: Number
    }
  },
  zone: Number,
  status: 'active' | 'inactive'
}
```

### Product
```javascript
{
  sku: String,
  name: String,
  brand: String,
  category: String,
  dimensions: {
    length: Number,
    width: Number, 
    height: Number,
    weight: Number,
    volumetricWeight: Number
  },
  pricing: {
    salePrice: Number,
    costPrice: Number
  },
  inventory: {
    quantity: Number,
    available: Boolean
  }
}
```

### Location
```javascript
{
  type: 'wilaya' | 'commune',
  code: Number,
  name: String,
  nameAr: String,
  hierarchy: {
    wilayaCode: Number,
    wilayaName: String
  },
  deliveryConfig: {
    pricingZone: Number,
    availableServices: Array,
    averageDeliveryTime: Number
  }
}
```

## 🔧 API Endpoints

### Prix de livraison
```
GET    /api/delivery-pricing              # Tous les prix
GET    /api/delivery-pricing/service/:service  # Prix par service
GET    /api/delivery-pricing/calculate    # Calculer prix
POST   /api/delivery-pricing              # Créer/modifier prix
POST   /api/delivery-pricing/bulk         # Import en lot
DELETE /api/delivery-pricing/:service/:wilaya/:commune
```

### Produits
```
GET    /api/products                      # Tous les produits
GET    /api/products/search?q=term        # Recherche
GET    /api/products/:sku                 # Produit par SKU
POST   /api/products                      # Créer produit
POST   /api/products/bulk                 # Import en lot
PUT    /api/products/:sku                 # Modifier produit
DELETE /api/products/:sku                 # Supprimer produit
```

### Locations
```
GET    /api/locations/wilayas             # Toutes les wilayas
GET    /api/locations/communes/:wilayaCode # Communes par wilaya
GET    /api/locations/search?q=term       # Recherche location
POST   /api/locations/commune             # Ajouter commune
POST   /api/locations/initialize-algeria  # Initialiser wilayas
```

### Paramètres
```
GET    /api/settings                      # Tous les paramètres
GET    /api/settings/category/:category   # Par catégorie
GET    /api/settings/:key                 # Paramètre spécifique
PUT    /api/settings/:key                 # Modifier paramètre
POST   /api/settings/bulk                 # Modification en lot
```

## 🔄 Service hybride

Le `HybridDeliveryService` gère automatiquement :

1. **Tentative MongoDB** - Source principale
2. **Fallback Google Sheets** - Si MongoDB indisponible
3. **Synchronisation** - Sauvegarde croisée des données
4. **Cache intelligent** - Performance optimisée

```javascript
// Utilisation automatique
const price = await hybridDeliveryService.getDeliveryPrice(
  'Alger Centre, Alger',
  'home',
  2.5, // poids
  { length: 30, width: 20, height: 10 },
  25000 // valeur déclarée
);
```

## 🎛️ Interface d'administration

### Accès
- **Raccourci** : `Ctrl+Shift+A` dans l'interface principale
- **Onglets disponibles** :
  - Vue d'ensemble (statistiques)
  - Gestion des prix
  - Gestion des produits  
  - Gestion des locations

### Fonctionnalités
- ✅ Ajout/modification/suppression des prix
- ✅ Gestion du catalogue produits
- ✅ Ajout de nouvelles communes
- ✅ Initialisation des wilayas d'Algérie
- ✅ Statistiques en temps réel
- ✅ Monitoring de santé du système

## 📈 Monitoring et santé

### Vérification de santé
```bash
curl http://localhost:3001/health
```

### Statistiques
```bash
curl http://localhost:3001/api/delivery-pricing/stats
curl http://localhost:3001/api/products/stats
curl http://localhost:3001/api/locations/stats
```

### Logs
- **Console** : Logs détaillés avec emojis
- **Niveaux** : Info, Warn, Error
- **Sources** : MongoDB, Google Sheets, Cache

## 🔧 Configuration avancée

### Variables d'environnement
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/bebeclick-delivery
MONGODB_MAX_POOL_SIZE=10
MONGODB_DEBUG=true

# APIs existantes
GOOGLE_SHEETS_API_KEY=your-key
YALIDINE_API_ID=your-id
YALIDINE_API_TOKEN=your-token

# Serveur
PORT=3001
NODE_ENV=development
```

### Optimisation
- **Cache** : 5 minutes pour les prix, 10 minutes pour les produits
- **Pool de connexions** : 10 connexions MongoDB max
- **Rate limiting** : 100 req/min par défaut
- **Compression** : Gzip activé

## 🚨 Dépannage

### Problèmes courants

1. **MongoDB non connecté**
   ```bash
   # Vérifier le service MongoDB
   mongosh --eval "db.adminCommand('ping')"
   ```

2. **Port 3001 occupé**
   ```bash
   # Changer le port dans .env
   PORT=3002
   ```

3. **Erreurs de permissions**
   ```bash
   # Vérifier les droits MongoDB
   # Créer un utilisateur avec les bonnes permissions
   ```

### Logs de débogage
```javascript
// Activer les logs détaillés
MONGODB_DEBUG=true
ENABLE_DETAILED_LOGS=true
LOG_LEVEL=debug
```

## 🔄 Migration et synchronisation

### Migration depuis Google Sheets
```javascript
// Via l'interface admin ou API
POST /api/migrate/from-google-sheets
```

### Synchronisation bidirectionnelle
```javascript
// Sync Google Sheets → MongoDB
POST /api/sync/to-mongodb

// Sync MongoDB → Google Sheets  
POST /api/sync/to-sheets
```

## 📝 Notes importantes

1. **Compatibilité** : L'ancien système Google Sheets reste fonctionnel
2. **Performance** : MongoDB améliore significativement les temps de réponse
3. **Fiabilité** : Système de fallback automatique
4. **Évolutivité** : Architecture prête pour la montée en charge
5. **Maintenance** : Interface d'administration complète

## 🎯 Prochaines étapes

- [ ] Synchronisation automatique programmée
- [ ] Interface de migration complète
- [ ] Système de backup automatique
- [ ] Monitoring avancé avec alertes
- [ ] API de reporting et analytics

---

**Développé par l'équipe BebeClick Development Team**  
*Version 1.0 - Système de calcul de coût de livraison avec MongoDB*
