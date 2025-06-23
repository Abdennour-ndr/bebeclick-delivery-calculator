// Configuration Infobip API pour l'envoi WhatsApp

export const INFOBIP_CONFIG = {
  // Cle API Infobip
  apiKey: 'aa3aa4f1d8c77c81eb410f15945609bf-1b00ae75-8c73-4f37-a5ce-2aac4d07980c',
  
  // URL de base Infobip
  baseUrl: 'https://api.infobip.com',
  
  // Endpoint pour WhatsApp
  whatsappEndpoint: '/whatsapp/1/message/text',
  
  // Numero expediteur (a configurer dans Infobip)
  from: '447860099299', // Numero par defaut Infobip
  
  // Configuration des destinataires
  recipients: {
    // Numero de test Infobip (numero sandbox par defaut)
    test: '385916242493', // Numero test Infobip officiel
    testAlt1: '213792717877', // Votre numero format 1
    testAlt2: '+213792717877', // Votre numero format 2
    testAlt3: '792717877', // Votre numero format 3

    // Numero de Zaki (a remplacer par le vrai numero)
    zaki: '213XXXXXXXXX'
  }
};

// Services qui supportent l'envoi WhatsApp via Infobip
export const INFOBIP_ENABLED_SERVICES = ['Zaki'];

// Verifier si un service supporte Infobip WhatsApp
export function isInfobipEnabled(service) {
  return INFOBIP_ENABLED_SERVICES.includes(service);
}

// Obtenir le numero de destination pour un service
export function getRecipientNumber(service, isTest = false, formatIndex = 0) {
  if (isTest) {
    // Essayer differents formats pour le test
    const testNumbers = [
      INFOBIP_CONFIG.recipients.test,      // 385916242493 (Infobip sandbox)
      INFOBIP_CONFIG.recipients.testAlt1,  // 213792717877 (votre numero)
      INFOBIP_CONFIG.recipients.testAlt2,  // +213792717877 (votre numero avec +)
      INFOBIP_CONFIG.recipients.testAlt3   // 792717877 (votre numero sans code)
    ];

    return testNumbers[formatIndex] || testNumbers[0];
  }

  switch (service) {
    case 'Zaki':
      return INFOBIP_CONFIG.recipients.zaki;
    default:
      return null;
  }
}

// Formater le message pour WhatsApp
export function formatWhatsAppMessage(orderData) {
  const {
    customerPhone,
    deliveryAddress,
    deliveryCost,
    orderTotal,
    notes
  } = orderData;

  const totalWithDelivery = parseFloat(orderTotal) + deliveryCost;

  let message = `🛍️ *Nouvelle commande Bebe Click*\n\n`;
  message += `📞 *Numero de telephone:* ${customerPhone}\n`;
  message += `📍 *Adresse de livraison:* ${deliveryAddress}\n`;
  message += `🚚 *Prix de livraison:* ${deliveryCost} DZD\n`;
  message += `💰 *Prix total avec livraison:* ${totalWithDelivery} DZD\n`;
  
  if (notes && notes.trim()) {
    message += `📝 *Note:* ${notes}\n`;
  }
  
  message += `\n⏰ Commande recue le ${new Date().toLocaleString('fr-FR')}`;

  return message;
}

// Envoyer un message WhatsApp via Infobip
export async function sendWhatsAppMessage(orderData, service, isTest = false, formatIndex = 0) {
  try {
    const recipient = getRecipientNumber(service, isTest, formatIndex);
    
    if (!recipient) {
      throw new Error(`Numero de destination non configure pour ${service}`);
    }

    const message = formatWhatsAppMessage(orderData);
    
    const payload = {
      from: INFOBIP_CONFIG.from,
      to: recipient,
      messageId: `bebe-click-${Date.now()}`,
      content: {
        text: message
      },
      callbackData: `order-${service}-${Date.now()}`
    };

    console.log('=== ENVOI WHATSAPP VIA INFOBIP ===');
    console.log('URL:', `${INFOBIP_CONFIG.baseUrl}${INFOBIP_CONFIG.whatsappEndpoint}`);
    console.log('Headers:', {
      'Authorization': `App ${INFOBIP_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(
      `${INFOBIP_CONFIG.baseUrl}${INFOBIP_CONFIG.whatsappEndpoint}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `App ${INFOBIP_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    console.log('=== REPONSE HTTP ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    let result;
    try {
      result = await response.json();
      console.log('=== REPONSE INFOBIP ===');
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (jsonError) {
      console.error('=== ERREUR PARSING JSON ===');
      console.error('JSON Error:', jsonError);
      const textResponse = await response.text();
      console.log('Raw response:', textResponse);
      throw new Error(`Erreur de parsing JSON: ${jsonError.message}`);
    }

    console.log('=== ANALYSE REPONSE ===');
    console.log('Response OK:', response.ok);
    console.log('Has messages:', !!result.messages);

    if (result.messages && result.messages.length > 0) {
      console.log('First message:', result.messages[0]);
      console.log('Status group ID:', result.messages[0].status?.groupId);
      console.log('Status name:', result.messages[0].status?.name);
      console.log('Status description:', result.messages[0].status?.description);
    }

    if (result.requestError) {
      console.log('Request error:', result.requestError);
    }

    if (response.ok) {
      console.log('=== REPONSE HTTP OK ===');

      // Verifier si la reponse contient des messages
      if (result.messages && result.messages.length > 0) {
        const message = result.messages[0];
        console.log('Premier message:', message);

        // Verifier le statut du message
        if (message.status && message.status.groupId === 1) {
          console.log('=== SUCCES - MESSAGE ACCEPTE ===');
          return {
            success: true,
            messageId: message.messageId,
            status: message.status.name,
            description: message.status.description,
            data: result
          };
        } else {
          console.log('=== ECHEC - MESSAGE REJETE ===');
          const errorMessage = message.status?.description || 'Message rejete par Infobip';
          console.log('Raison du rejet:', errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        console.log('=== ECHEC - AUCUN MESSAGE DANS LA REPONSE ===');
        console.log('Reponse complete:', result);
        console.log('Type de reponse:', typeof result);
        console.log('Cles de la reponse:', Object.keys(result));

        // Verifier s'il y a des erreurs dans la reponse
        if (result.requestError) {
          console.log('Erreur de requete detectee:', result.requestError);
          throw new Error(`Erreur Infobip: ${result.requestError.serviceException?.text || 'Erreur inconnue'}`);
        }

        throw new Error(`Aucun message dans la reponse Infobip. Reponse: ${JSON.stringify(result)}`);
      }
    } else {
      console.log('=== ECHEC - ERREUR HTTP ===');
      const errorMessage = result.requestError?.serviceException?.text ||
                          `HTTP ${response.status}: ${response.statusText}`;

      console.log('Erreur HTTP:', errorMessage);
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('=== ERREUR INFOBIP ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);

    // Verifier si c'est une erreur CORS
    if (error.message.includes('CORS') || error.message.includes('fetch')) {
      console.error('PROBLEME CORS DETECTE - L\'API Infobip ne peut pas etre appelee depuis le navigateur');
    }

    return {
      success: false,
      error: error.message,
      details: error,
      type: error.constructor.name
    };
  }
}

// Verifier la configuration Infobip
export function validateInfobipConfig() {
  const issues = [];
  
  if (!INFOBIP_CONFIG.apiKey || INFOBIP_CONFIG.apiKey.includes('XXXX')) {
    issues.push('Cle API Infobip non configuree');
  }
  
  if (!INFOBIP_CONFIG.recipients.zaki || INFOBIP_CONFIG.recipients.zaki.includes('X')) {
    issues.push('Numero de Zaki non configure');
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}

// Tester l'API Infobip avec SMS (plus simple que WhatsApp)
export async function testInfobipSMS(phoneNumber) {
  try {
    console.log('=== TEST SMS INFOBIP ===');

    const payload = {
      messages: [{
        from: 'InfoSMS',
        destinations: [{
          to: phoneNumber
        }],
        text: 'Test SMS depuis Bebe Click - API Infobip fonctionne!'
      }]
    };

    console.log('SMS Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(
      `${INFOBIP_CONFIG.baseUrl}/sms/2/text/advanced`,
      {
        method: 'POST',
        headers: {
          'Authorization': `App ${INFOBIP_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    console.log('SMS Response Status:', response.status);
    const result = await response.json();
    console.log('SMS Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.messages && result.messages.length > 0) {
      return { success: true, type: 'SMS', result };
    } else {
      return { success: false, type: 'SMS', error: 'SMS failed', result };
    }

  } catch (error) {
    console.error('Erreur test SMS:', error);
    return { success: false, type: 'SMS', error: error.message };
  }
}

// Tester tous les formats de numero
export async function testAllNumberFormats(orderData, service) {
  const formats = [
    { name: 'Format Sandbox (385916242493)', index: 0 },
    { name: 'Format 1 (213792717877)', index: 1 },
    { name: 'Format 2 (+213792717877)', index: 2 },
    { name: 'Format 3 (792717877)', index: 3 }
  ];

  console.log('=== TEST DE TOUS LES FORMATS DE NUMERO ===');

  for (const format of formats) {
    console.log(`\n--- Test ${format.name} ---`);

    try {
      // Modifier temporairement la fonction pour utiliser ce format
      const originalGetRecipient = getRecipientNumber;
      const testNumber = getRecipientNumber(service, true, format.index);

      console.log('Numero teste:', testNumber);

      const result = await sendWhatsAppMessage(orderData, service, true, format.index);

      if (result.success) {
        console.log(`✅ SUCCES avec ${format.name}`);
        return { success: true, format: format.name, result };
      } else {
        console.log(`❌ ECHEC avec ${format.name}:`, result.error);
      }

    } catch (error) {
      console.log(`❌ ERREUR avec ${format.name}:`, error.message);
    }
  }

  return { success: false, error: 'Aucun format de numero ne fonctionne' };
}

// Instructions de configuration
export const INFOBIP_SETUP_INSTRUCTIONS = {
  fr: [
    "1. Creer un compte sur infobip.com",
    "2. Obtenir une cle API dans le dashboard",
    "3. Configurer un numero expediteur WhatsApp",
    "4. Remplacer la cle API dans ce fichier",
    "5. Configurer le numero de Zaki",
    "6. Tester avec le numero de test"
  ]
};
