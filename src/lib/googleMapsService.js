// Configuration des clés API
const API_KEYS = {
  places: 'AIzaSyCr7tz7ZaL3sMtrnK3Pl89qRRWJu4xBrdM',
  distanceMatrix: 'AIzaSyCAx9J4hejd-vmM4xVoIqw_qNdC3AezZ90',
  geocoding: 'AIzaSyCr7tz7ZaL3sMtrnK3Pl89qRRWJu4xBrdM' // Utiliser la même clé que Places pour Geocoding
};

// Point de départ fixe (Bebe Click - Ouled Fayet)
const ORIGIN_COORDINATES = {
  lat: 36.7333,
  lng: 2.9500
};

class GoogleMapsService {
  constructor() {
    this.isLoaded = true; // Pas besoin de charger l'API JavaScript
  }

  async initialize() {
    // Pas besoin d'initialisation pour les appels REST API
    console.log('Google Maps Service ready (using REST APIs)');
  }

  // Recherche d'adresses avec autocomplétion
  async searchPlaces(input) {
    console.log('🔍 Searching for:', input);

    if (!input || input.length < 3) {
      console.log('❌ Input too short:', input);
      return [];
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(input)}&` +
        `key=${API_KEYS.places}&` +
        `components=country:dz&` +
        `types=geocode`;

      console.log('📍 Making request to:', url);

      // Note: This will fail due to CORS, but let's try a proxy approach
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl);
      const data = await response.json();

      console.log('📋 API Response:', data);

      if (data.status === 'OK' && data.predictions) {
        const suggestions = data.predictions.map(prediction => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text
        }));
        console.log('✅ Suggestions found:', suggestions.length);
        return suggestions;
      } else {
        console.warn('❌ Places search failed:', data.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error in searchPlaces:', error);
      return [];
    }
  }

  // Obtenir les détails d'un lieu (coordonnées)
  async getPlaceDetails(placeId) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}&` +
        `key=${API_KEYS.places}&` +
        `fields=geometry,formatted_address,name`;

      console.log('📍 Getting place details for:', placeId);

      // Using proxy to avoid CORS
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const place = data.result;
        return {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          address: place.formatted_address,
          name: place.name
        };
      } else {
        console.error('Place details failed:', data.status);
        throw new Error('Failed to get place details');
      }
    } catch (error) {
      console.error('❌ Error in getPlaceDetails:', error);
      throw error;
    }
  }

  // Calculer la distance entre deux points
  async calculateDistance(destinationCoords) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${ORIGIN_COORDINATES.lat},${ORIGIN_COORDINATES.lng}&` +
        `destinations=${destinationCoords.lat},${destinationCoords.lng}&` +
        `units=metric&` +
        `key=${API_KEYS.distanceMatrix}&` +
        `mode=driving`;

      console.log('🚗 Calculating distance from Bebe Click to destination');

      // Using proxy to avoid CORS
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        const element = data.rows[0].elements[0];
        console.log('✅ Distance calculated successfully:', element.distance.text);
        return {
          distance: element.distance.value / 1000, // Convertir en kilomètres
          duration: element.duration.text,
          distanceText: element.distance.text
        };
      } else {
        throw new Error('Distance calculation failed');
      }
    } catch (error) {
      console.error('❌ Error calculating distance:', error);
      console.log('🔄 Falling back to straight-line distance calculation');
      // Fallback: calculer la distance à vol d'oiseau
      return this.calculateStraightLineDistance(destinationCoords);
    }
  }

  // Calcul de distance à vol d'oiseau (fallback)
  calculateStraightLineDistance(destinationCoords) {
    console.log('📏 Calculating straight-line distance as fallback');
    console.log('📍 From Bebe Click:', ORIGIN_COORDINATES);
    console.log('📍 To destination:', destinationCoords);

    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(destinationCoords.lat - ORIGIN_COORDINATES.lat);
    const dLng = this.toRad(destinationCoords.lng - ORIGIN_COORDINATES.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(ORIGIN_COORDINATES.lat)) * Math.cos(this.toRad(destinationCoords.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const result = {
      distance: Math.round(distance * 10) / 10,
      duration: 'Estimation',
      distanceText: `${Math.round(distance * 10) / 10} km (à vol d'oiseau)`
    };

    console.log('✅ Straight-line distance calculated:', result);
    return result;
  }

  toRad(value) {
    return value * Math.PI / 180;
  }

  // Extraire la wilaya d'une adresse
  extractWilaya(address) {
    // Liste des wilayas algériennes
    const wilayas = [
      'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
      'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
      'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
      'Constantine', 'Médéa', 'Mostaganem', 'MSila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
      'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
      'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
      'Ghardaïa', 'Relizane'
    ];

    // Chercher la wilaya dans l'adresse
    for (const wilaya of wilayas) {
      if (address.toLowerCase().includes(wilaya.toLowerCase())) {
        return wilaya;
      }
    }

    // Si aucune wilaya trouvée, essayer d'extraire le dernier mot
    const parts = address.split(',').map(part => part.trim());
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }

    return 'Autre';
  }
}

export default new GoogleMapsService();

