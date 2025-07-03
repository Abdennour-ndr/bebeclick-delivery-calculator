#  BebeClick Delivery Cost Calculator

Application web professionnelle et moderne pour calculer les coûts de livraison pour BebeClick. L'application prend en charge plusieurs services de livraison en Algérie avec intégration Google Maps, gestion Firebase, et interface responsive optimisée.

##  URLs de production

###  **Déploiements actifs:**
- **Principal**: https://calc-bebeclick.fly.dev (Fly.io - Europe CDG)

##  Aperçu des fonctionnalités

###  Services de livraison supportés
- **Zaki Delivery** avec Google Places Autocomplete
- **Yalidine** avec sélection wilaya/commune Firebase
- **Jamal Delivery** (en développement)

###  Intégration Google Maps avancée
- **Places Autocomplete** pour Zaki (région d'Alger étendue)
- **Recherche d'établissements** (BebeClick, magasins, entreprises)
- **Géolocalisation précise** avec bounds géographiques
- **Support multilingue** (français/arabe)

##  Fonctionnalités principales

###  Calcul de coûts de livraison avancé
- **Zaki Delivery**:
  - Google Places Autocomplete pour adresses précises
  - Calcul basé sur la distance via Google Maps Distance Matrix
  - Support des établissements (ex: "BebeClick في ولاد فايت")
  - Génération automatique de liens Google Maps
- **Yalidine**:
  - Sélection wilaya/commune depuis Firebase
  - Calcul avec poids volumétrique et zones (1-5)
  - Frais supplémentaires automatiques (50-100 DA/kg)
  - Arrondi intelligent avec Math.floor
- **Jamal Delivery**: Interface prête (tarifs à définir)

###  Gestion des produits Firebase
- **Base de données Firebase Firestore** en temps réel
- **CRUD complet**: Créer, lire, modifier, supprimer
- **Recherche intelligente** par nom, SKU, catégorie
- **Auto-création** de catégories et marques
- **Calcul automatique** des dimensions et poids
- **Interface d'administration** intégrée

###  Interface utilisateur moderne
- **Design responsive** optimisé mobile-first
- **Thème professionnel** BebeClick
- **Icônes Lucide React** (pas d'emojis)
- **Tabs cachés** quand une seule page
- **Centrage mobile** pour tous les formulaires
- **Messages d'erreur** informatifs

###  Intégrations externes
- **WhatsApp**: Génération automatique de messages formatés
- **Impression**: Devis professionnels avec branding
- **Google Maps**: Liens directs pour navigation
- **Firebase**: Synchronisation temps réel

##  Services de livraison détaillés

###  Zaki Delivery (Région d'Alger étendue)
**Zone de couverture**: Alger, Blida, Boumerdes, Tipaza
- **0-10 km**: 1000 DA
- **11-20 km**: 1500 DA
- **21-30 km**: 2000 DA
- **31-40 km**: 2500 DA
- **41-60 km**: 3500 DA
- **+60 km**: Contact service

**Fonctionnalités avancées**:
-  **Google Places Autocomplete** avec recherche d'établissements
-  **Géolocalisation précise** (bounds: 35.2,2.5 → 37.3,4.3)
-  **Support des commerces** (ex: "BebeClick Ouled Fayet")
-  **Liens Google Maps** automatiques pour navigation

###  Yalidine (National - 58 wilayas)
**Système de zones**: 5 zones tarifaires (Zone 1-5)
- **Tarifs de base**: Selon zone de destination
- **Poids volumétrique**: (L × l × h) cm × 0.0002
- **Surpoids**:
  - Zones 0-3: +50 DA/kg supplémentaire
  - Zones 4-5: +100 DA/kg supplémentaire
- **Calcul intelligent**: Math.floor pour arrondi

**Base de données Firebase**:
- ✅ 58 wilayas avec communes complètes
- ✅ Zones automatiquement assignées
- ✅ Sélection wilaya → commune dynamique

###  Jamal Delivery (Alger et banlieue)
-  **Interface prête** - Tarifs en cours de définition
-  **Zone**: Alger et banlieue proche
-  **Statut**: En développement

##  Installation et configuration

###  Prérequis
- **Node.js** (version 18 ou supérieure)
- **npm** ou **pnpm**
- **Compte Google Cloud** (pour Maps APIs)
- **Projet Firebase** (pour base de données)

###  Installation rapide

1. **Cloner le repository**
   ```bash
   git clone https://github.com/Abdennour-ndr/bebeclick-delivery-calculator.git
   cd bebeclick-delivery-calculator
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   pnpm install
   ```

3. **Configuration des variables d'environnement**

   Créer un fichier `.env` à la racine :
   ```env
   # Google Maps API
   VITE_GOOGLE_MAPS_API_KEY=votre_cle_google_maps

   # Firebase Configuration
   VITE_FIREBASE_API_KEY=votre_cle_firebase
   VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=votre-projet-id
   VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

   # Yalidine API (optionnel)
   YALIDINE_API_ID=votre_api_id
   YALIDINE_API_TOKEN=votre_token
   ```

###  Configuration Google Cloud

**APIs à activer** dans Google Cloud Console :
- ✅ **Maps JavaScript API**
- ✅ **Places API**
- ✅ **Distance Matrix API**
- ✅ **Geocoding API**

**Restrictions recommandées** :
- **Domaines autorisés** : `localhost:5173/*`, `*.fly.dev/*`
- **APIs restreintes** : Seulement les APIs listées ci-dessus

###  Configuration Firebase

1. **Créer un projet Firebase**
2. **Activer Firestore Database**
3. **Configurer les règles de sécurité** :
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // À sécuriser en production
       }
     }
   }
   ```
4. **Importer les données** (wilayas, communes, zones)

##  Développement

###  Démarrer le serveur de développement
```bash
npm run dev
# ou
pnpm run dev
```

**Accès local** : `http://localhost:5173`

###  Build pour la production
```bash
npm run build
# ou
pnpm run build
```

**Sortie** : Dossier `dist/` prêt pour déploiement

###  Déploiement

#### **Stratégie multi-plateforme**

** Fly.io** (Principal - Europe CDG) :
```bash
fly deploy --build-arg VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY -a calc-bebeclick
```

###  Tests et debugging

**Test Google Places** :
- Ouvrir `http://localhost:5173/test-google-places.html`
- Tester l'autocomplete et les APIs

**Console logs** :
- ✅ `Google Maps API chargée via callback`
- ✅ `Google Places Autocomplete initialisé`
-  `Lieu sélectionné: [données]`

##  Structure du projet

```
delivery-cost-calculator/
├── 📂 src/
│   ├── 📂 components/
│   │   ├──  GooglePlacesInput.jsx        # Google Places Autocomplete
│   │   ├──  AddressInput.jsx             # Sélection adresses Zaki
│   │   ├──  YalidineWilayaCommuneSelector.jsx # Sélecteur Firebase
│   │   ├──  DeliveryForm.jsx             # Formulaire principal
│   │   ├──  ResultDisplay.jsx            # Affichage résultats
│   │   ├──  ProductManagerFirebase.jsx   # Gestion produits
│   │   ├──  MobileOptimizations.jsx      # Optimisations mobile
│   │   └── 📂 admin/                       # Interface admin
│   ├── 📂 lib/
│   │   ├──  googleMapsService.js         # Service Google Maps
│   │   ├──  firebase.js                  # Configuration Firebase
│   │   ├──  pricing.js                   # Calculs tarifaires
│   │   └──  yalidineService.js           # Service Yalidine
│   ├── 📂 hooks/                           # React hooks personnalisés
│   ├──  App.jsx                          # Composant principal
│   ├──  App.css                          # Styles principaux
│   └──  main.jsx                         # Point d'entrée
├── 📂 public/                              # Assets statiques
├──  test-google-places.html              # Page de test
├──  package.json                         # Dépendances
├──  fly.toml                             # Config Fly.io
├── vite.config.js                       # Config Vite
└── README.md                            # Documentation
```

## Personnalisation

### Modifier les tarifs
**Zaki Delivery** : `/src/lib/pricing.js` → `ZAKI_RATES`
```javascript
const ZAKI_RATES = [
  { min: 0, max: 10, price: 1000 },
  { min: 11, max: 20, price: 1500 },
  // ...
];
```

**Yalidine** : Firebase Firestore → Collection `yalidine_pricing`
**Jamal** : `/src/lib/pricing.js` → `JAMAL_DELIVERY_RATES` (à définir)

### Personnaliser le design
**Couleurs principales** : `/src/App.css`
```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #10b981;
  --accent-color: #f59e0b;
}
```

**Responsive** : Breakpoints dans `/src/components/MobileOptimizations.jsx`

### Zones géographiques
**Bounds Zaki** : `/src/components/GooglePlacesInput.jsx`
```javascript
const bounds = new window.google.maps.LatLngBounds(
  { lat: 35.2, lng: 2.5 },  // Sud-Ouest
  { lat: 37.3, lng: 4.3 }   // Nord-Est
);
```

## APIs et services utilisés

### Google Cloud Platform
- **Maps JavaScript API** : Interface cartographique
- **Places API** : Autocomplete et recherche d'établissements
- **Distance Matrix API** : Calcul de distances précises
- **Geocoding API** : Conversion adresses ↔ coordonnées

### Firebase
- **Firestore** : Base de données NoSQL temps réel
- **Collections** : `products`, `wilayas`, `communes`, `yalidine_pricing`
- **Sécurité** : Règles Firestore configurables

### Services de livraison
- **Yalidine API** : Intégration optionnelle (tarifs de référence)
- **Zaki** : Calculs internes basés sur Google Maps
- **Jamal** : Interface prête pour intégration future

## Technologies utilisées

- **Frontend** : React 18 + Vite
- **Styling** : CSS3 + Responsive Design
- **Icons** : Lucide React (pas d'emojis)
- **Maps** : Google Maps JavaScript API
- **Database** : Firebase Firestore
- **Deployment** : Fly.io + Surge.sh
- **Build** : Vite (ES modules, HMR)

## Support et maintenance

### Signaler un bug
Créer une issue sur GitHub avec :
- Description détaillée
- Étapes de reproduction
- Screenshots si applicable
- Console logs

### Demandes de fonctionnalités
Contacter l'équipe de développement pour :
- Nouveaux services de livraison
- Modifications tarifaires
- Améliorations UX/UI

### Monitoring
- **Logs** : Console browser + Fly.io logs
- **Performance** : Lighthouse CI
- **Uptime** : Monitoring Fly.io

## Licence

**Projet propriétaire BebeClick** - Tous droits réservés

---

*Développé avec Abdennour Nedjar pour BebeClick*
*Dernière mise à jour : Janvier 2025*

