// Configuration des numeros WhatsApp pour les livreurs

export const WHATSAPP_NUMBERS = {
  // Numero WhatsApp de Zaki (remplacer par le vrai numero)
  Zaki: '213555123456', // NUMERO DE TEST - Remplacer par le vrai numero de Zaki
  
  // Yalidine et Jamal Delivery n'ont pas de WhatsApp direct
  // Ces services utilisent leurs propres systemes
  'Jamal Delivery': null,
  'Yalidine': null
};

// Services qui supportent l'envoi WhatsApp
export const WHATSAPP_ENABLED_SERVICES = ['Zaki'];

// Verifier si un service supporte WhatsApp
export function isWhatsAppEnabled(service) {
  return WHATSAPP_ENABLED_SERVICES.includes(service);
}

// Obtenir le numero WhatsApp d'un service
export function getWhatsAppNumber(service) {
  return WHATSAPP_NUMBERS[service] || null;
}

// Formater un message WhatsApp pour une commande
export function formatOrderMessage(orderData) {
  const {
    customerPhone,
    deliveryAddress,
    deliveryCost,
    orderTotal,
    notes
  } = orderData;

  const totalWithDelivery = parseFloat(orderTotal) + deliveryCost;

  let message = `Nouvelle commande Bebe Click:\n\n`;
  message += `Numero de telephone: ${customerPhone}\n`;
  message += `Adresse de livraison: ${deliveryAddress}\n`;
  message += `Prix de livraison: ${deliveryCost} DZD\n`;
  message += `Prix total avec livraison: ${totalWithDelivery} DZD\n`;
  
  if (notes && notes.trim()) {
    message += `Note: ${notes}\n`;
  }

  return message;
}

// Generer l'URL WhatsApp complete
export function generateWhatsAppURL(service, orderData) {
  const phoneNumber = getWhatsAppNumber(service);

  if (!phoneNumber || phoneNumber.includes('X')) {
    // Si le numero n'est pas configure ou contient des X
    alert('Le numero WhatsApp de Zaki n\'est pas encore configure. Veuillez contacter l\'administrateur.');
    throw new Error(`Numero WhatsApp non configure pour ${service}`);
  }

  const message = formatOrderMessage(orderData);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

// Instructions pour configurer les numeros
export const SETUP_INSTRUCTIONS = {
  fr: {
    title: "Configuration des numeros WhatsApp",
    steps: [
      "1. Ouvrir le fichier src/config/whatsapp.js",
      "2. Remplacer '213XXXXXXXXX' par le vrai numero de Zaki",
      "3. Format: code pays + numero sans le 0 initial",
      "4. Exemple: 213555123456 pour +213 555 12 34 56",
      "5. Sauvegarder le fichier"
    ]
  },
  ar: {
    title: "إعداد أرقام الواتس اب",
    steps: [
      "1. افتح ملف src/config/whatsapp.js",
      "2. استبدل '213XXXXXXXXX' برقم زاكي الحقيقي",
      "3. التنسيق: رمز البلد + الرقم بدون الصفر",
      "4. مثال: 213555123456 لرقم +213 555 12 34 56",
      "5. احفظ الملف"
    ]
  }
};
