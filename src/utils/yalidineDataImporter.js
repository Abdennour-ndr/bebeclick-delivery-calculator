/**
 * Utilitaire pour importer et valider les données Yalidine depuis Excel
 */

// Template pour ajouter facilement de nouvelles wilayas
export const WILAYA_TEMPLATE = {
  // Exemple d'utilisation:
  // "08": {
  //   name: "Béchar",
  //   communes: {
  //     "Béchar": { office: 650, home: 1200 },
  //     "Kenadsa": { office: 650, home: 1200 },
  //     // ... autres communes
  //   }
  // }
};

// Données manquantes à ajouter (basées sur le fichier Excel)
export const MISSING_WILAYAS = {
  // Wilaya 08 - Béchar
  "08": {
    name: "Béchar",
    communes: {
      "Béchar": { office: 650, home: 1200 },
      "Kenadsa": { office: 650, home: 1200 },
      "Abadla": { office: 650, home: 1200 },
      "Igli": { office: 650, home: 1200 },
      "Taghit": { office: 650, home: 1200 },
      "El Ouata": { office: 650, home: 1200 },
      "Boukais": { office: 650, home: 1200 },
      "Mogheul": { office: 650, home: 1200 },
      "Lahmar": { office: 650, home: 1200 },
      "Beni Ounif": { office: 650, home: 1200 },
      "Tabelbala": { office: 650, home: 1200 },
      "Ouled Khoudir": { office: 650, home: 1200 },
      "Ksabi": { office: 650, home: 1200 },
      "Meridja": { office: 650, home: 1200 },
      "Machraa Houari Boumediene": { office: 650, home: 1200 },
      "Beni Abbes": { office: 650, home: 1200 },
      "Tamtert": { office: 650, home: 1200 },
      "El Ksar": { office: 650, home: 1200 },
      "Erg Ferradj": { office: 650, home: 1200 },
      "Kerzaz": { office: 650, home: 1200 },
      "Timoudi": { office: 650, home: 1200 }
    }
  },

  // Wilaya 11 - Tamanrasset
  "11": {
    name: "Tamanrasset",
    communes: {
      "Tamanrasset": { office: 650, home: 1200 },
      "Abalessa": { office: 650, home: 1200 },
      "In Guezzam": { office: 650, home: 1200 },
      "Tin Zaouatine": { office: 650, home: 1200 },
      "Tazrouk": { office: 650, home: 1200 },
      "In Amenas": { office: 650, home: 1200 },
      "Idles": { office: 650, home: 1200 },
      "In Salah": { office: 650, home: 1200 },
      "Foggaret Ezzaouia": { office: 650, home: 1200 },
      "In Ghar": { office: 650, home: 1200 }
    }
  },

  // Wilaya 12 - Tébessa
  "12": {
    name: "Tébessa",
    communes: {
      "Tébessa": { office: 450, home: 650 },
      "Bir El Ater": { office: 450, home: 650 },
      "Cheria": { office: 450, home: 650 },
      "Stah Guentis": { office: 450, home: 650 },
      "El Aouinet": { office: 450, home: 650 },
      "Houidjbet": { office: 450, home: 650 },
      "Safsaf El Ouesra": { office: 450, home: 650 },
      "Hammamet": { office: 450, home: 650 },
      "Negrine": { office: 450, home: 650 },
      "Bir Mokadem": { office: 450, home: 650 },
      "El Kouif": { office: 450, home: 650 },
      "Morsott": { office: 450, home: 650 },
      "El Ogla": { office: 450, home: 650 },
      "Bir Dheheb": { office: 450, home: 650 },
      "El Ogla El Malha": { office: 450, home: 650 },
      "Gorriguer": { office: 450, home: 650 },
      "Bekkaria": { office: 450, home: 650 },
      "Boukhadra": { office: 450, home: 650 },
      "Ouenza": { office: 450, home: 650 },
      "El Ma El Biodh": { office: 450, home: 650 },
      "Oum Ali": { office: 450, home: 650 },
      "Tlidjene": { office: 450, home: 650 },
      "Ain Zerga": { office: 450, home: 650 },
      "El Meridj": { office: 450, home: 650 },
      "Boulhaf Dir": { office: 450, home: 650 },
      "Bekaria": { office: 450, home: 650 },
      "Ferkane": { office: 450, home: 650 },
      "Saf Saf El Ouesra": { office: 450, home: 650 }
    }
  },

  // Wilaya 13 - Tlemcen
  "13": {
    name: "Tlemcen",
    communes: {
      "Tlemcen": { office: 450, home: 650 },
      "Mansourah": { office: 450, home: 650 },
      "Sabra": { office: 450, home: 650 },
      "Ghazaouet": { office: 450, home: 650 },
      "Souani": { office: 450, home: 650 },
      "Djebala": { office: 450, home: 650 },
      "El Fehoul": { office: 450, home: 650 },
      "Sebdou": { office: 450, home: 650 },
      "Beni Mester": { office: 450, home: 650 },
      "Ain Tallout": { office: 450, home: 650 },
      "Remchi": { office: 450, home: 650 },
      "El Gor": { office: 450, home: 650 },
      "Souahlia": { office: 450, home: 650 },
      "Msirda Fouaga": { office: 450, home: 650 },
      "Ain Fezza": { office: 450, home: 650 },
      "Ouled Mimoun": { office: 450, home: 650 },
      "Amieur": { office: 450, home: 650 },
      "Ain Youcef": { office: 450, home: 650 },
      "Zenata": { office: 450, home: 650 },
      "Beni Snous": { office: 450, home: 650 },
      "Bab El Assa": { office: 450, home: 650 },
      "Dar Yaghmoracen": { office: 450, home: 650 },
      "Fellaoucene": { office: 450, home: 650 },
      "Azail": { office: 450, home: 650 },
      "Sebbaa Chioukh": { office: 450, home: 650 },
      "Terni Beni Hediel": { office: 450, home: 650 },
      "Bensekrane": { office: 450, home: 650 },
      "Ain Nehala": { office: 450, home: 650 },
      "Hennaya": { office: 450, home: 650 },
      "Maghnia": { office: 450, home: 650 },
      "Hammam Boughrara": { office: 450, home: 650 },
      "Bouhlou": { office: 450, home: 650 },
      "Ain Ghoraba": { office: 450, home: 650 },
      "Chetouane": { office: 450, home: 650 },
      "Nedroma": { office: 450, home: 650 },
      "Sidi Abdelli": { office: 450, home: 650 },
      "Beni Boussaid": { office: 450, home: 650 },
      "Marsa Ben M'Hidi": { office: 450, home: 650 },
      "Beni Khellad": { office: 450, home: 650 },
      "Souq Tlata": { office: 450, home: 650 },
      "Ain Kebira": { office: 450, home: 650 },
      "Tianet": { office: 450, home: 650 },
      "Ouled Riyah": { office: 450, home: 650 },
      "Poste Frontiere Akid Abbes": { office: 450, home: 650 },
      "Honaine": { office: 450, home: 650 },
      "Tianet": { office: 450, home: 650 },
      "Ouled Mimoun": { office: 450, home: 650 },
      "Beni Ouarsous": { office: 450, home: 650 },
      "Sidi Medjahed": { office: 450, home: 650 },
      "Saida": { office: 450, home: 650 },
      "El Aricha": { office: 450, home: 650 }
    }
  }
};

/**
 * Fonction pour valider les données d'une wilaya
 */
export function validateWilayaData(wilayaData) {
  const errors = [];
  
  if (!wilayaData.name) {
    errors.push('Nom de wilaya manquant');
  }
  
  if (!wilayaData.communes || Object.keys(wilayaData.communes).length === 0) {
    errors.push('Aucune commune définie');
  }
  
  Object.entries(wilayaData.communes || {}).forEach(([communeName, prices]) => {
    if (!prices.office || !prices.home) {
      errors.push(`Prix manquants pour la commune ${communeName}`);
    }
    
    if (prices.office >= prices.home) {
      errors.push(`Prix bureau >= prix domicile pour ${communeName}`);
    }
  });
  
  return errors;
}

/**
 * Fonction pour importer des données depuis un format CSV
 */
export function parseCSVData(csvText) {
  const lines = csvText.split('\n');
  const header = lines[0].split(',');
  const data = {};
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= 5) {
      const [wilayaCode, wilayaName, communeName, officePrice, homePrice] = values;
      
      if (!data[wilayaCode]) {
        data[wilayaCode] = {
          name: wilayaName,
          communes: {}
        };
      }
      
      data[wilayaCode].communes[communeName] = {
        office: parseInt(officePrice),
        home: parseInt(homePrice)
      };
    }
  }
  
  return data;
}

/**
 * Fonction pour exporter les données au format requis pour yalidineService
 */
export function exportToServiceFormat(data) {
  let output = 'const YALIDINE_PRICING = {\n';
  
  Object.entries(data).forEach(([code, wilaya]) => {
    output += `  // Wilaya ${code} - ${wilaya.name}\n`;
    output += `  "${code}": {\n`;
    output += `    name: "${wilaya.name}",\n`;
    output += `    communes: {\n`;
    
    Object.entries(wilaya.communes).forEach(([communeName, prices]) => {
      output += `      "${communeName}": { office: ${prices.office}, home: ${prices.home} },\n`;
    });
    
    output += `    }\n`;
    output += `  },\n\n`;
  });
  
  output += '};\n';
  return output;
}

/**
 * Fonction pour obtenir les statistiques des données
 */
export function getDataStats(data) {
  const stats = {
    totalWilayas: Object.keys(data).length,
    totalCommunes: 0,
    avgOfficePrice: 0,
    avgHomePrice: 0,
    priceRanges: {
      office: { min: Infinity, max: 0 },
      home: { min: Infinity, max: 0 }
    }
  };
  
  let totalPrices = 0;
  let totalOfficePrice = 0;
  let totalHomePrice = 0;
  
  Object.values(data).forEach(wilaya => {
    const communes = Object.values(wilaya.communes);
    stats.totalCommunes += communes.length;
    
    communes.forEach(commune => {
      totalOfficePrice += commune.office;
      totalHomePrice += commune.home;
      totalPrices++;
      
      stats.priceRanges.office.min = Math.min(stats.priceRanges.office.min, commune.office);
      stats.priceRanges.office.max = Math.max(stats.priceRanges.office.max, commune.office);
      stats.priceRanges.home.min = Math.min(stats.priceRanges.home.min, commune.home);
      stats.priceRanges.home.max = Math.max(stats.priceRanges.home.max, commune.home);
    });
  });
  
  if (totalPrices > 0) {
    stats.avgOfficePrice = Math.round(totalOfficePrice / totalPrices);
    stats.avgHomePrice = Math.round(totalHomePrice / totalPrices);
  }
  
  return stats;
}

export default {
  WILAYA_TEMPLATE,
  MISSING_WILAYAS,
  validateWilayaData,
  parseCSVData,
  exportToServiceFormat,
  getDataStats
};
