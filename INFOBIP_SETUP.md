# Configuration Infobip WhatsApp pour Bebe Click

## Vue d'ensemble

Le système utilise maintenant l'API Infobip pour envoyer les messages WhatsApp directement, sans ouvrir WhatsApp Web. C'est plus professionnel et fiable.

## Configuration actuelle

### API Key configurée
```
aa3aa4f1d8c77c81eb410f15945609bf-1b00ae75-8c73-4f37-a5ce-2aac4d07980c
```

### Numéros configurés
- **Test**: 213792717877 (0792717877)
- **Zaki**: 213XXXXXXXXX (à configurer)

## Fonctionnement

### 1. Mode Test (Actuel)
- Tous les messages sont envoyés au numéro de test: **0792717877**
- Permet de tester le système sans déranger Zaki
- Messages formatés avec emojis pour meilleure lisibilité

### 2. Format du message
```
🛍️ Nouvelle commande Bebe Click

📞 Numero de telephone: 0555123456
📍 Adresse de livraison: Bab Ezzouar, Alger
🚚 Prix de livraison: 400 DZD
💰 Prix total avec livraison: 25400 DZD
📝 Note: Livraison urgente

⏰ Commande recue le 23/06/2025 à 14:30:25
```

## Utilisation

### 1. Pour les employés
1. Calculer la livraison (service Zaki)
2. Remplir les informations client
3. Cliquer "Envoyer à Zaki WhatsApp"
4. Attendre la confirmation d'envoi

### 2. Retour utilisateur
- **Succès**: "Message WhatsApp envoyé avec succès! ID: xxx"
- **Erreur**: Message d'erreur détaillé
- **Chargement**: Bouton "Envoi en cours..." avec animation

## Configuration pour production

### 1. Configurer le numéro de Zaki
Dans `src/config/infobip.js`:
```javascript
recipients: {
  test: '213792717877',
  zaki: '213XXXXXXXXX' // Remplacer par le vrai numéro de Zaki
}
```

### 2. Désactiver le mode test
Dans `DeliveryForm.jsx`, ligne 95:
```javascript
// Mode test (actuel)
const sendResult = await sendWhatsAppMessage(orderData, service, true);

// Mode production (changer à false)
const sendResult = await sendWhatsAppMessage(orderData, service, false);
```

## Avantages d'Infobip

### 1. Fiabilité
- API professionnelle
- Statut de livraison en temps réel
- Gestion des erreurs avancée

### 2. Fonctionnalités
- Messages formatés avec emojis
- ID de message unique
- Horodatage automatique
- Callback data pour suivi

### 3. Sécurité
- Authentification API
- Logs détaillés
- Gestion d'erreurs robuste

## Dépannage

### Erreurs communes

#### "Erreur inconnue lors de l'envoi"
- Vérifier la clé API
- Contrôler la connexion internet
- Vérifier le format du numéro

#### "Numero de destination non configuré"
- Configurer le numéro de Zaki
- Vérifier le format international

#### "Authorization failed"
- Vérifier la clé API Infobip
- Contrôler les permissions du compte

### Logs de débogage
Ouvrir la console du navigateur (F12) pour voir:
- Payload envoyé à Infobip
- Réponse de l'API
- Erreurs détaillées

## Test du système

### 1. Test basique
1. Ouvrir http://localhost:5173
2. Calculer une livraison Zaki
3. Remplir: Tel: 0555123456, Prix: 25000
4. Envoyer → Message reçu sur 0792717877

### 2. Test d'erreur
1. Laisser un champ vide
2. Vérifier la validation
3. Tester avec service non-Zaki

## Monitoring

### Infobip Dashboard
- Consulter les statistiques d'envoi
- Voir les messages livrés/échoués
- Analyser les coûts

### Logs application
- Messages de succès/erreur
- IDs de messages pour traçabilité
- Timestamps pour audit

## Coûts

### Tarification Infobip
- Vérifier les tarifs WhatsApp Business
- Surveiller la consommation
- Optimiser selon l'usage

Le système est maintenant configuré pour envoyer les messages WhatsApp via Infobip de manière professionnelle et fiable!
