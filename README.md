# BebeClick Delivery Cost Calculator

Application web professionnelle pour calculer les coûts de livraison pour BebeClick. L'application prend en charge plusieurs services de livraison en Algérie et offre une interface intuitive pour les employés.

## URL de production
**https://calc-bebeclick.surge.sh**

## Fonctionnalités principales

### Calcul de coûts de livraison
- **Zaki Delivery**: Calcul basé sur la distance via Google Maps
- **Yalidine**: Calcul par wilaya avec poids volumétrique et frais supplémentaires (1%)
- **Jamal Delivery**: Tarification personnalisée

### Gestion des produits
- **Recherche intelligente** dans la base de données Google Sheets
- **Support des produits multiples** avec ajout/suppression
- **Calcul automatique** des dimensions et poids
- **Recherche par nom et SKU**

### Intégration WhatsApp
- **Génération automatique** de messages formatés
- **Ouverture directe** de WhatsApp
- **Format professionnel** pour les commandes

### Impression professionnelle
- **Génération de devis** complets
- **Format optimisé** pour impression
- **Informations détaillées** de livraison
- **Branding BebeClick**

### Interface responsive
- **Optimisé** pour desktop et mobile
- **Design professionnel** BebeClick
- **Navigation intuitive**

## Services de livraison

### Zaki (Alger et banlieue)
- 0-10 km : 1000 DZD
- 11-20 km : 1500 DZD
- 21-30 km : 2000 DZD
- 31-40 km : 2500 DZD
- 41-60 km : 3500 DZD
- +60 km : Contact service

### Jamal Delivery (Alger et banlieue)
- Tarifs à définir (actuellement en mode "À définir")

### Yalidine (Toutes les wilayas)
- Tarifs de base par wilaya
- Calcul du poids volumétrique : (L × l × h) en cm × 0.0002
- Coût supplémentaire si poids > 2 kg
- Livraison automatique au bureau si poids/volume excédentaire

## Installation

### Prérequis
- Node.js (version 18 ou supérieure)
- pnpm (ou npm)

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/Abdennour-ndr/bebeclick-delivery-calculator.git
   cd bebeclick-delivery-calculator
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   # ou
   npm install
   ```

3. **Configuration des APIs Google Maps**
   
   Modifier les clés API dans `/src/lib/googleMapsService.js` :
   ```javascript
   const API_KEYS = {
     places: 'VOTRE_CLE_PLACES_API',
     distanceMatrix: 'VOTRE_CLE_DISTANCE_MATRIX_API',
     geocoding: 'VOTRE_CLE_GEOCODING_API'
   };
   ```

4. **Activer les APIs Google Cloud**
   - Maps JavaScript API
   - Places API
   - Distance Matrix API
   - Geocoding API

## Développement

### Démarrer le serveur de développement
```bash
pnpm run dev
# ou
npm run dev
```

Le site sera accessible sur `http://localhost:5173`

### Construire pour la production
```bash
pnpm run build
# ou
npm run build
```

Les fichiers de production seront dans le dossier `dist/`

## Structure du projet

```
delivery-cost-calculator/
├── src/
│   ├── components/
│   │   ├── AddressInput.jsx      # Autocomplétion d'adresses
│   │   ├── DeliveryForm.jsx      # Formulaire principal
│   │   └── ResultDisplay.jsx     # Affichage des résultats
│   ├── lib/
│   │   ├── googleMapsService.js  # Service Google Maps
│   │   └── pricing.js            # Logique de calcul des tarifs
│   ├── App.jsx                   # Composant principal
│   ├── App.css                   # Styles principaux
│   └── main.jsx                  # Point d'entrée
├── public/                       # Fichiers statiques
├── package.json                  # Dépendances et scripts
└── README.md                     # Ce fichier
```

## Personnalisation

### Modifier les tarifs Zaki
Éditer `/src/lib/pricing.js` dans la section `ZAKI_RATES`

### Ajouter les tarifs Jamal Delivery
Éditer `/src/lib/pricing.js` dans la section `JAMAL_DELIVERY_RATES`

### Modifier les tarifs Yalidine
Éditer `/src/lib/pricing.js` dans la section `YALIDINE_RATES`

### Personnaliser le design
Modifier `/src/App.css` pour ajuster les couleurs, polices et mise en page

## APIs utilisées

- **Google Maps JavaScript API** : Chargement de la carte
- **Google Places API** : Autocomplétion des adresses
- **Google Distance Matrix API** : Calcul des distances
- **Google Geocoding API** : Conversion adresses ↔ coordonnées

## Support

Pour toute question ou modification, contactez le développeur.

## Licence

Projet propriétaire - Tous droits réservés

