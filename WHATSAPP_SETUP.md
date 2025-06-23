# Configuration WhatsApp pour Bebe Click

## Vue d'ensemble

Le système permet d'envoyer automatiquement les commandes via WhatsApp au livreur Zaki uniquement. Yalidine et Jamal Delivery utilisent leurs propres systèmes.

## Configuration requise

### 1. Configurer le numéro WhatsApp de Zaki

Ouvrir le fichier `src/config/whatsapp.js` et modifier:

```javascript
export const WHATSAPP_NUMBERS = {
  Zaki: '213XXXXXXXXX', // Remplacer par le vrai numéro
};
```

### 2. Format du numéro

- **Format requis**: Code pays + numéro sans le 0 initial
- **Exemple**: Pour +213 555 12 34 56 → utiliser `213555123456`
- **Pas d'espaces, tirets ou parenthèses**

## Fonctionnement

### 1. Quand la section WhatsApp apparaît

- **Seulement pour Zaki**: La section n'apparaît que si le service sélectionné est "Zaki"
- **Après calcul**: Visible uniquement après avoir calculé le coût de livraison
- **Champs requis**: Numéro client et prix total obligatoires

### 2. Informations envoyées

Le message WhatsApp contient:
```
Nouvelle commande Bebe Click:

Numero de telephone: 0555123456
Adresse de livraison: Bab Ezzouar, Alger
Prix de livraison: 400 DZD
Prix total avec livraison: 25400 DZD
Note: Livraison urgente
```

### 3. Champs du formulaire

- **Numéro de téléphone client**: Obligatoire
- **Prix total commande**: Obligatoire (sans livraison)
- **Note**: Optionnel (informations supplémentaires)

## Utilisation pour les employés

### 1. Calculer la livraison
1. Remplir l'adresse de destination
2. Sélectionner "Zaki" comme service
3. Cliquer "Calculer"

### 2. Envoyer la commande
1. Remplir le numéro du client
2. Saisir le prix total de la commande
3. Ajouter une note si nécessaire
4. Cliquer "Envoyer à Zaki WhatsApp"

### 3. Résultat
- WhatsApp s'ouvre automatiquement
- Le message est pré-rempli
- Il suffit d'appuyer "Envoyer"

## Sécurité et limitations

### Services supportés
- ✅ **Zaki**: Envoi WhatsApp activé
- ❌ **Yalidine**: Pas de WhatsApp (système propre)
- ❌ **Jamal Delivery**: Pas de WhatsApp (système propre)

### Validation
- Vérification du service avant envoi
- Champs obligatoires validés
- Gestion d'erreurs intégrée

## Dépannage

### Problème: "L'envoi WhatsApp n'est disponible que pour Zaki"
- **Cause**: Service autre que Zaki sélectionné
- **Solution**: Sélectionner "Zaki" dans les options de service

### Problème: "Veuillez remplir le numéro de téléphone..."
- **Cause**: Champs obligatoires vides
- **Solution**: Remplir numéro client et prix total

### Problème: WhatsApp ne s'ouvre pas
- **Cause**: Numéro mal configuré ou WhatsApp non installé
- **Solution**: Vérifier le numéro dans `whatsapp.js` et installer WhatsApp

## Personnalisation

### Modifier le message
Éditer la fonction `formatOrderMessage` dans `src/config/whatsapp.js`

### Ajouter d'autres services
1. Ajouter le numéro dans `WHATSAPP_NUMBERS`
2. Ajouter le service dans `WHATSAPP_ENABLED_SERVICES`

### Changer le format
Modifier la template du message dans `formatOrderMessage`

## Support technique

Pour toute question technique:
1. Vérifier la console du navigateur (F12)
2. Contrôler la configuration dans `whatsapp.js`
3. Tester avec un numéro de test d'abord
