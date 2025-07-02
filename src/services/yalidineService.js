/**
 * Service pour la gestion des tarifs Yalidine
 * Gère les prix de livraison par wilaya et commune (bureau vs domicile)
 */

// Données complètes des tarifs Yalidine (basées sur le fichier Excel fees.xlsx)
const YALIDINE_PRICING = {
  // Wilaya 01 - Adrar
  "01": {
    name: "Adrar",
    communes: {
      "Adrar": { office: 650, home: 1200 },
      "Tamest": { office: 650, home: 1200 },
      "Charouine": { office: 650, home: 1200 },
      "Reggane": { office: 650, home: 1200 },
      "In Salah": { office: 650, home: 1200 },
      "Tit": { office: 650, home: 1200 },
      "Ksar Kaddour": { office: 650, home: 1200 },
      "Tsabit": { office: 650, home: 1200 },
      "Timimoun": { office: 650, home: 1200 },
      "Ouled Ahmed Timmi": { office: 650, home: 1200 },
      "Zaouiet Kounta": { office: 650, home: 1200 },
      "Aoulef": { office: 650, home: 1200 },
      "Timiaouine": { office: 650, home: 1200 },
      "Sibaouine": { office: 650, home: 1200 },
      "Metarfa": { office: 650, home: 1200 },
      "Ouled Aissa": { office: 650, home: 1200 },
      "Bouda": { office: 650, home: 1200 },
      "Aougrout": { office: 650, home: 1200 },
      "Sali": { office: 650, home: 1200 },
      "Akabli": { office: 650, home: 1200 },
      "Talmine": { office: 650, home: 1200 },
      "Bordj Badji Mokhtar": { office: 650, home: 1200 },
      "Sbaa": { office: 650, home: 1200 },
      "Ouled Said": { office: 650, home: 1200 },
      "Tamantit": { office: 650, home: 1200 },
      "Fenoughil": { office: 650, home: 1200 },
      "Tinerkouk": { office: 650, home: 1200 },
      "Deldoul": { office: 650, home: 1200 }
    }
  },
  
  // Wilaya 02 - Chlef
  "02": {
    name: "Chlef",
    communes: {
      "Chlef": { office: 450, home: 650 },
      "Tenes": { office: 450, home: 650 },
      "Benairia": { office: 450, home: 650 },
      "El Karimia": { office: 450, home: 650 },
      "Tadjena": { office: 450, home: 650 },
      "Taougrit": { office: 450, home: 650 },
      "Beni Haoua": { office: 450, home: 650 },
      "Sobha": { office: 450, home: 650 },
      "Harchoun": { office: 450, home: 650 },
      "Ouled Fares": { office: 450, home: 650 },
      "Sidi Akkacha": { office: 450, home: 650 },
      "Boukadir": { office: 450, home: 650 },
      "Beni Rached": { office: 450, home: 650 },
      "Talassa": { office: 450, home: 650 },
      "Herenfa": { office: 450, home: 650 },
      "Oued Goussine": { office: 450, home: 650 },
      "Dahra": { office: 450, home: 650 },
      "Ouled Ben Abdelkader": { office: 450, home: 650 },
      "Bouzeghaia": { office: 450, home: 650 },
      "Aïn Merane": { office: 450, home: 650 },
      "Oued Sly": { office: 450, home: 650 },
      "Abou El Hassen": { office: 450, home: 650 },
      "El Marsa": { office: 450, home: 650 },
      "Chettia": { office: 450, home: 650 },
      "Sidi Abderrahmane": { office: 450, home: 650 },
      "Moussadek": { office: 450, home: 650 },
      "El Hadjadj": { office: 450, home: 650 },
      "Labiod Medjadja": { office: 450, home: 650 },
      "Oued Fodda": { office: 450, home: 650 },
      "Ouled Abbes": { office: 450, home: 650 },
      "Sendjas": { office: 450, home: 650 },
      "Zeboudja": { office: 450, home: 650 },
      "Oum Drou": { office: 450, home: 650 },
      "Breira": { office: 450, home: 650 },
      "Beni Bouattab": { office: 450, home: 650 }
    }
  },

  // Wilaya 03 - Laghouat
  "03": {
    name: "Laghouat",
    communes: {
      "Laghouat": { office: 550, home: 800 },
      "Ksar El Hirane": { office: 550, home: 800 },
      "Bennasser Benchohra": { office: 550, home: 800 },
      "Sidi Makhlouf": { office: 550, home: 800 },
      "Hassi Delaa": { office: 550, home: 800 },
      "Hassi R'Mel": { office: 550, home: 800 },
      "Ain Madhi": { office: 550, home: 800 },
      "Tadjmout": { office: 550, home: 800 },
      "Kheneg": { office: 550, home: 800 },
      "Gueltat Sidi Saad": { office: 550, home: 800 },
      "Ain Sidi Ali": { office: 550, home: 800 },
      "Beidha": { office: 550, home: 800 },
      "Brida": { office: 550, home: 800 },
      "El Ghicha": { office: 550, home: 800 },
      "Hadj Mechri": { office: 550, home: 800 },
      "Sebgag": { office: 550, home: 800 },
      "Taouiala": { office: 550, home: 800 },
      "Tadjrouna": { office: 550, home: 800 },
      "Aflou": { office: 550, home: 800 },
      "El Assafia": { office: 550, home: 800 },
      "Oued Morra": { office: 550, home: 800 },
      "Oued M'Zi": { office: 550, home: 800 },
      "El Houaita": { office: 550, home: 800 },
      "Sidi Bouzid": { office: 550, home: 800 }
    }
  },

  // Wilaya 04 - Oum El Bouaghi
  "04": {
    name: "Oum El Bouaghi",
    communes: {
      "Oum El Bouaghi": { office: 450, home: 650 },
      "Ain Beida": { office: 450, home: 650 },
      "Ain M'Lila": { office: 450, home: 650 },
      "Behir Chergui": { office: 450, home: 650 },
      "El Belala": { office: 450, home: 650 },
      "Ain Babouche": { office: 450, home: 650 },
      "Berriche": { office: 450, home: 650 },
      "Ouled Hamla": { office: 450, home: 650 },
      "Dhalaa": { office: 450, home: 650 },
      "Sigus": { office: 450, home: 650 },
      "El Amiria": { office: 450, home: 650 },
      "Zorg": { office: 450, home: 650 },
      "El Djazia": { office: 450, home: 650 },
      "Ain Kercha": { office: 450, home: 650 },
      "Hanchir Toumghani": { office: 450, home: 650 },
      "El Harmilia": { office: 450, home: 650 },
      "Souk Naamane": { office: 450, home: 650 },
      "Zouabi": { office: 450, home: 650 },
      "Oued Nini": { office: 450, home: 650 },
      "Bir Chouhada": { office: 450, home: 650 },
      "Ksar Sbahi": { office: 450, home: 650 },
      "Fkirina": { office: 450, home: 650 },
      "Ouled Zouai": { office: 450, home: 650 },
      "Rahbat": { office: 450, home: 650 },
      "Ain Diss": { office: 450, home: 650 },
      "Fellag Ourerene": { office: 450, home: 650 },
      "Ouled Gacem": { office: 450, home: 650 },
      "El Fedjoudj Boughrara Saoudi": { office: 450, home: 650 },
      "Meskiana": { office: 450, home: 650 }
    }
  },

  // Wilaya 05 - Batna
  "05": {
    name: "Batna",
    communes: {
      "Batna": { office: 450, home: 650 },
      "Ghassira": { office: 450, home: 650 },
      "Maafa": { office: 450, home: 650 },
      "Merouana": { office: 450, home: 650 },
      "Seriana": { office: 450, home: 650 },
      "Menaa": { office: 450, home: 650 },
      "El Madher": { office: 450, home: 650 },
      "Tazoult": { office: 450, home: 650 },
      "N'Gaous": { office: 450, home: 650 },
      "Guigba": { office: 450, home: 650 },
      "Inoughissen": { office: 450, home: 650 },
      "Ouyoun El Assafir": { office: 450, home: 650 },
      "Djerma": { office: 450, home: 650 },
      "Bitam": { office: 450, home: 650 },
      "Abdelkader": { office: 450, home: 650 },
      "Arris": { office: 450, home: 650 },
      "Kimmel": { office: 450, home: 650 },
      "Tilatou": { office: 450, home: 650 },
      "Ain Djasser": { office: 450, home: 650 },
      "Ouled Sellam": { office: 450, home: 650 },
      "Tigharghar": { office: 450, home: 650 },
      "Ain Yagout": { office: 450, home: 650 },
      "Fesdis": { office: 450, home: 650 },
      "Sefiane": { office: 450, home: 650 },
      "Rahbat": { office: 450, home: 650 },
      "Tighanimine": { office: 450, home: 650 },
      "Lemsane": { office: 450, home: 650 },
      "Ksar Bellezma": { office: 450, home: 650 },
      "Seggana": { office: 450, home: 650 },
      "Ichmoul": { office: 450, home: 650 },
      "Foum Toub": { office: 450, home: 650 },
      "Beni Foudhala El Hakania": { office: 450, home: 650 },
      "Oued El Ma": { office: 450, home: 650 },
      "Talkhamt": { office: 450, home: 650 },
      "Bouzina": { office: 450, home: 650 },
      "Chemora": { office: 450, home: 650 },
      "Oued Chaaba": { office: 450, home: 650 },
      "Taxlent": { office: 450, home: 650 },
      "Gosbat": { office: 450, home: 650 },
      "Ouled Aouf": { office: 450, home: 650 },
      "Boumagueur": { office: 450, home: 650 },
      "Barika": { office: 450, home: 650 },
      "Djezzar": { office: 450, home: 650 },
      "T'Kout": { office: 450, home: 650 },
      "Ain Touta": { office: 450, home: 650 },
      "Hidoussa": { office: 450, home: 650 },
      "Teniet El Abed": { office: 450, home: 650 },
      "Oued Taga": { office: 450, home: 650 },
      "Ouled Fadel": { office: 450, home: 650 },
      "Timgad": { office: 450, home: 650 },
      "Ras El Aioun": { office: 450, home: 650 },
      "Chir": { office: 450, home: 650 },
      "Ouled Si Slimane": { office: 450, home: 650 },
      "Zanat El Beida": { office: 450, home: 650 },
      "M'Doukal": { office: 450, home: 650 },
      "Ouled Ammar": { office: 450, home: 650 },
      "El Hassi": { office: 450, home: 650 },
      "Lazrou": { office: 450, home: 650 },
      "Boumia": { office: 450, home: 650 },
      "Boulhilat": { office: 450, home: 650 },
      "Larbaa": { office: 450, home: 650 },
      "Lemcene": { office: 450, home: 650 }
    }
  },

  // Wilaya 16 - Alger
  "16": {
    name: "Alger",
    communes: {
      "Alger Centre": { office: 400, home: 550 },
      "Sidi M'Hamed": { office: 400, home: 550 },
      "El Madania": { office: 400, home: 550 },
      "Hamma El Annasser": { office: 400, home: 550 },
      "Bab El Oued": { office: 400, home: 550 },
      "Bologhine": { office: 400, home: 550 },
      "Casbah": { office: 400, home: 550 },
      "Oued Koriche": { office: 400, home: 550 },
      "Bir Mourad Rais": { office: 400, home: 550 },
      "El Biar": { office: 400, home: 550 },
      "Bouzareah": { office: 400, home: 550 },
      "Birkhadem": { office: 400, home: 550 },
      "El Harrach": { office: 400, home: 550 },
      "Baraki": { office: 400, home: 550 },
      "Oued Smar": { office: 400, home: 550 },
      "Bourouba": { office: 400, home: 550 },
      "Hussein Dey": { office: 400, home: 550 },
      "Kouba": { office: 400, home: 550 },
      "Bachdjerrah": { office: 400, home: 550 },
      "Dar El Beida": { office: 400, home: 550 },
      "Bab Ezzouar": { office: 400, home: 550 },
      "Ben Aknoun": { office: 400, home: 550 },
      "Dely Ibrahim": { office: 400, home: 550 },
      "El Mouradia": { office: 400, home: 550 },
      "Hydra": { office: 400, home: 550 },
      "Mohammadia": { office: 400, home: 550 },
      "Bordj El Kiffan": { office: 400, home: 550 },
      "El Magharia": { office: 400, home: 550 },
      "Beni Messous": { office: 400, home: 550 },
      "Les Eucalyptus": { office: 400, home: 550 },
      "Birtouta": { office: 400, home: 550 },
      "Tessala El Merdja": { office: 400, home: 550 },
      "Ouled Chebel": { office: 400, home: 550 },
      "Sidi Moussa": { office: 400, home: 550 },
      "Ain Taya": { office: 400, home: 550 },
      "Bordj El Bahri": { office: 400, home: 550 },
      "El Marsa": { office: 400, home: 550 },
      "H'raoua": { office: 400, home: 550 },
      "Rouiba": { office: 400, home: 550 },
      "Reghaïa": { office: 400, home: 550 },
      "Ain Benian": { office: 400, home: 550 },
      "Staoueli": { office: 400, home: 550 },
      "Zeralda": { office: 400, home: 550 },
      "Mahelma": { office: 400, home: 550 },
      "Rahmania": { office: 400, home: 550 },
      "Souidania": { office: 400, home: 550 },
      "Cheraga": { office: 400, home: 550 },
      "Ouled Fayet": { office: 400, home: 550 },
      "El Achour": { office: 400, home: 550 },
      "Draria": { office: 400, home: 550 },
      "Douera": { office: 400, home: 550 },
      "Baba Hassen": { office: 400, home: 550 },
      "Khraicia": { office: 400, home: 550 },
      "Saoula": { office: 400, home: 550 }
    }
  },

  // Wilaya 06 - Béjaïa
  "06": {
    name: "Béjaïa",
    communes: {
      "Béjaïa": { office: 450, home: 650 },
      "Amizour": { office: 450, home: 650 },
      "Ferraoun": { office: 450, home: 650 },
      "Taourirt Ighil": { office: 450, home: 650 },
      "Chellata": { office: 450, home: 650 },
      "Tamokra": { office: 450, home: 650 },
      "Timezrit": { office: 450, home: 650 },
      "Souk El Tenine": { office: 450, home: 650 },
      "M'Cisna": { office: 450, home: 650 },
      "Tinebdar": { office: 450, home: 650 },
      "Tichy": { office: 450, home: 650 },
      "Semaoun": { office: 450, home: 650 },
      "Kendira": { office: 450, home: 650 },
      "Tifra": { office: 450, home: 650 },
      "Ighram": { office: 450, home: 650 },
      "Amalou": { office: 450, home: 650 },
      "Ighil Ali": { office: 450, home: 650 },
      "Fenaia Ilmaten": { office: 450, home: 650 },
      "Toudja": { office: 450, home: 650 },
      "Darguina": { office: 450, home: 650 },
      "Sidi Aich": { office: 450, home: 650 },
      "El Kseur": { office: 450, home: 650 },
      "Melbou": { office: 450, home: 650 },
      "Akbou": { office: 450, home: 650 },
      "Seddouk": { office: 450, home: 650 },
      "Tazmalt": { office: 450, home: 650 },
      "Ait R'Zine": { office: 450, home: 650 },
      "Chemini": { office: 450, home: 650 },
      "Souk Oufella": { office: 450, home: 650 },
      "Taskriout": { office: 450, home: 650 },
      "Tibane": { office: 450, home: 650 },
      "Tala Hamza": { office: 450, home: 650 },
      "Barbacha": { office: 450, home: 650 },
      "Beni Djellil": { office: 450, home: 650 },
      "Ouzellaguen": { office: 450, home: 650 },
      "Bouhamza": { office: 450, home: 650 },
      "Beni Ksila": { office: 450, home: 650 },
      "Oued Ghir": { office: 450, home: 650 },
      "Adekar": { office: 450, home: 650 },
      "Akfadou": { office: 450, home: 650 },
      "Leflaye": { office: 450, home: 650 },
      "Kherrata": { office: 450, home: 650 },
      "Draa Kaid": { office: 450, home: 650 },
      "Tamridjet": { office: 450, home: 650 },
      "Ait Smail": { office: 450, home: 650 },
      "Boukhelifa": { office: 450, home: 650 },
      "Tizi N'Berber": { office: 450, home: 650 },
      "Beni Melikeche": { office: 450, home: 650 },
      "Sidi Ayad": { office: 450, home: 650 },
      "Aokas": { office: 450, home: 650 },
      "Beni Maouche": { office: 450, home: 650 },
      "Montreuil": { office: 450, home: 650 }
    }
  },

  // Wilaya 07 - Biskra
  "07": {
    name: "Biskra",
    communes: {
      "Biskra": { office: 450, home: 650 },
      "Ouled Djellal": { office: 450, home: 650 },
      "Sidi Khaled": { office: 450, home: 650 },
      "Sidi Okba": { office: 450, home: 650 },
      "Chetma": { office: 450, home: 650 },
      "Branis": { office: 450, home: 650 },
      "Zeribet El Oued": { office: 450, home: 650 },
      "Tolga": { office: 450, home: 650 },
      "Lioua": { office: 450, home: 650 },
      "Lichana": { office: 450, home: 650 },
      "Ourlal": { office: 450, home: 650 },
      "Mlili": { office: 450, home: 650 },
      "Foughala": { office: 450, home: 650 },
      "El Ghrous": { office: 450, home: 650 },
      "El Outaya": { office: 450, home: 650 },
      "Djemorah": { office: 450, home: 650 },
      "Ain Naga": { office: 450, home: 650 },
      "Zeribet El Oued": { office: 450, home: 650 },
      "El Feidh": { office: 450, home: 650 },
      "El Kantara": { office: 450, home: 650 },
      "Ain Zaatout": { office: 450, home: 650 },
      "El Haouch": { office: 450, home: 650 },
      "Meziraa": { office: 450, home: 650 },
      "Bouchagroun": { office: 450, home: 650 },
      "M'Chouneche": { office: 450, home: 650 },
      "El Amri": { office: 450, home: 650 },
      "El Hadjeb": { office: 450, home: 650 },
      "Khanguel Sidi Nadji": { office: 450, home: 650 },
      "Ouled Djellal": { office: 450, home: 650 },
      "Besbes": { office: 450, home: 650 },
      "Chaiba": { office: 450, home: 650 },
      "Ras El Miaad": { office: 450, home: 650 },
      "Doucen": { office: 450, home: 650 }
    }
  },

  // Wilaya 09 - Blida
  "09": {
    name: "Blida",
    communes: {
      "Blida": { office: 400, home: 550 },
      "Chebli": { office: 400, home: 550 },
      "Bouinan": { office: 400, home: 550 },
      "Oued Alleug": { office: 400, home: 550 },
      "Bougara": { office: 400, home: 550 },
      "Larbaâ": { office: 400, home: 550 },
      "Meftah": { office: 400, home: 550 },
      "Soumaa": { office: 400, home: 550 },
      "Mouzaia": { office: 400, home: 550 },
      "El Affroun": { office: 400, home: 550 },
      "Chiffa": { office: 400, home: 550 },
      "Hammam Melouane": { office: 400, home: 550 },
      "Ben Khelil": { office: 400, home: 550 },
      "Souhane": { office: 400, home: 550 },
      "Ouled Yaich": { office: 400, home: 550 },
      "Chrea": { office: 400, home: 550 },
      "Ain Romana": { office: 400, home: 550 },
      "Djebabra": { office: 400, home: 550 },
      "Boufarik": { office: 400, home: 550 },
      "Larbaa": { office: 400, home: 550 },
      "Oued El Alleug": { office: 400, home: 550 },
      "Beni Tamou": { office: 400, home: 550 },
      "Bouarfa": { office: 400, home: 550 },
      "Beni Mered": { office: 400, home: 550 },
      "Guerrouaou": { office: 400, home: 550 }
    }
  },

  // Wilaya 10 - Bouira
  "10": {
    name: "Bouira",
    communes: {
      "Bouira": { office: 450, home: 650 },
      "Aïn Bessem": { office: 450, home: 650 },
      "Bir Ghbalou": { office: 450, home: 650 },
      "Bordj Okhriss": { office: 450, home: 650 },
      "El Hachimia": { office: 450, home: 650 },
      "Souk El Khemis": { office: 450, home: 650 },
      "Kadiria": { office: 450, home: 650 },
      "Hanif": { office: 450, home: 650 },
      "Dirah": { office: 450, home: 650 },
      "Aomar": { office: 450, home: 650 },
      "Chorfa": { office: 450, home: 650 },
      "Hadjera Zerga": { office: 450, home: 650 },
      "M'Chedallah": { office: 450, home: 650 },
      "Sour El Ghozlane": { office: 450, home: 650 },
      "Maamora": { office: 450, home: 650 },
      "Djebahia": { office: 450, home: 650 },
      "Taghzout": { office: 450, home: 650 },
      "Ridane": { office: 450, home: 650 },
      "El Esnam": { office: 450, home: 650 },
      "Lakhdaria": { office: 450, home: 650 },
      "Maala": { office: 450, home: 650 },
      "Guerrouma": { office: 450, home: 650 },
      "El Adjiba": { office: 450, home: 650 },
      "Zbarbar": { office: 450, home: 650 },
      "Ain El Hadjar": { office: 450, home: 650 },
      "Ahl El Ksar": { office: 450, home: 650 },
      "Bouderbala": { office: 450, home: 650 },
      "El Mokrani": { office: 450, home: 650 },
      "Ouled Rached": { office: 450, home: 650 },
      "Raouraoua": { office: 450, home: 650 },
      "Ain Turk": { office: 450, home: 650 },
      "Bechloul": { office: 450, home: 650 },
      "Boukram": { office: 450, home: 650 },
      "Ain Laloui": { office: 450, home: 650 },
      "Ath Mansour Taourirt": { office: 450, home: 650 },
      "Dechmia": { office: 450, home: 650 },
      "Saharidj": { office: 450, home: 650 },
      "Aghbalou": { office: 450, home: 650 },
      "Taguedit": { office: 450, home: 650 },
      "Oued El Berdi": { office: 450, home: 650 },
      "Tikjda": { office: 450, home: 650 },
      "El Khabouzia": { office: 450, home: 650 },
      "Haizer": { office: 450, home: 650 },
      "Ain El Turc": { office: 450, home: 650 },
      "Mamora": { office: 450, home: 650 }
    }
  },

  // Wilaya 25 - Constantine
  "25": {
    name: "Constantine",
    communes: {
      "Constantine": { office: 450, home: 650 },
      "Hamma Bouziane": { office: 450, home: 650 },
      "Didouche Mourad": { office: 450, home: 650 },
      "El Khroub": { office: 450, home: 650 },
      "Ain Abid": { office: 450, home: 650 },
      "Ibn Ziad": { office: 450, home: 650 },
      "Zighoud Youcef": { office: 450, home: 650 },
      "Ouled Rahmoune": { office: 450, home: 650 },
      "Ain Smara": { office: 450, home: 650 },
      "Beni Hamiden": { office: 450, home: 650 },
      "Messaoud Boudjeriou": { office: 450, home: 650 },
      "Ben Badis": { office: 450, home: 650 }
    }
  },

  // Wilaya 31 - Oran
  "31": {
    name: "Oran",
    communes: {
      "Oran": { office: 450, home: 650 },
      "Gdyel": { office: 450, home: 650 },
      "Bir El Djir": { office: 450, home: 650 },
      "Hassi Bounif": { office: 450, home: 650 },
      "Es Senia": { office: 450, home: 650 },
      "Arzew": { office: 450, home: 650 },
      "Bethioua": { office: 450, home: 650 },
      "Marsat El Hadjadj": { office: 450, home: 650 },
      "Ain El Turk": { office: 450, home: 650 },
      "El Ancar": { office: 450, home: 650 },
      "Oued Tlelat": { office: 450, home: 650 },
      "Tafraoui": { office: 450, home: 650 },
      "Sidi Chami": { office: 450, home: 650 },
      "Boufatis": { office: 450, home: 650 },
      "Mers El Kebir": { office: 450, home: 650 },
      "Bousfer": { office: 450, home: 650 },
      "El Karma": { office: 450, home: 650 },
      "Hassi Ben Okba": { office: 450, home: 650 },
      "Ben Freha": { office: 450, home: 650 },
      "Hassi Mefsoukh": { office: 450, home: 650 },
      "Sidi Ben Yebka": { office: 450, home: 650 },
      "Messerghin": { office: 450, home: 650 },
      "Boutlelis": { office: 450, home: 650 },
      "Ain El Kerma": { office: 450, home: 650 },
      "Ain Biya": { office: 450, home: 650 },
      "Dar Ben Abdellah": { office: 450, home: 650 }
    }
  },

  // Wilaya 42 - Tipaza
  "42": {
    name: "Tipaza",
    communes: {
      "Tipaza": { office: 400, home: 550 },
      "Menaceur": { office: 400, home: 550 },
      "Larhat": { office: 400, home: 550 },
      "Douaouda": { office: 400, home: 550 },
      "Bourkika": { office: 400, home: 550 },
      "Khemisti": { office: 400, home: 550 },
      "Aghabal": { office: 400, home: 550 },
      "Hadjout": { office: 400, home: 550 },
      "Sidi Amar": { office: 400, home: 550 },
      "Gouraya": { office: 400, home: 550 },
      "Menaceur": { office: 400, home: 550 },
      "Ahmer El Ain": { office: 400, home: 550 },
      "Bou Ismail": { office: 400, home: 550 },
      "Chaiba": { office: 400, home: 550 },
      "Attatba": { office: 400, home: 550 },
      "Sidi Ghiles": { office: 400, home: 550 },
      "Messelmoun": { office: 400, home: 550 },
      "Sidi Rached": { office: 400, home: 550 },
      "Kolea": { office: 400, home: 550 },
      "Fouka": { office: 400, home: 550 },
      "Bou Haroun": { office: 400, home: 550 },
      "Cherchell": { office: 400, home: 550 },
      "Damous": { office: 400, home: 550 },
      "Meurad": { office: 400, home: 550 },
      "Hadjerat Ennous": { office: 400, home: 550 },
      "Sidi Semiane": { office: 400, home: 550 },
      "Beni Milleuk": { office: 400, home: 550 },
      "Nador": { office: 400, home: 550 }
    }
  },

  // Wilaya 35 - Boumerdes
  "35": {
    name: "Boumerdes",
    communes: {
      "Boumerdes": { office: 400, home: 550 },
      "Boudouaou": { office: 400, home: 550 },
      "Afir": { office: 400, home: 550 },
      "Bordj Menaiel": { office: 400, home: 550 },
      "Baghlia": { office: 400, home: 550 },
      "Sidi Daoud": { office: 400, home: 550 },
      "Naciria": { office: 400, home: 550 },
      "Djinet": { office: 400, home: 550 },
      "Isser": { office: 400, home: 550 },
      "Zemmouri": { office: 400, home: 550 },
      "Si Mustapha": { office: 400, home: 550 },
      "Tidjelabine": { office: 400, home: 550 },
      "Chabet El Ameur": { office: 400, home: 550 },
      "Thenia": { office: 400, home: 550 },
      "Timezrit": { office: 400, home: 550 },
      "Corso": { office: 400, home: 550 },
      "Ouled Moussa": { office: 400, home: 550 },
      "Larbatache": { office: 400, home: 550 },
      "Bouzegza Keddara": { office: 400, home: 550 },
      "Taourga": { office: 400, home: 550 },
      "Ouled Aissa": { office: 400, home: 550 },
      "Ben Choud": { office: 400, home: 550 },
      "Dellys": { office: 400, home: 550 },
      "Ammal": { office: 400, home: 550 },
      "Beni Amrane": { office: 400, home: 550 },
      "Souk El Had": { office: 400, home: 550 },
      "Boudouaou El Bahri": { office: 400, home: 550 },
      "Ouled Hedadj": { office: 400, home: 550 },
      "Leghata": { office: 400, home: 550 },
      "Hammedi": { office: 400, home: 550 },
      "Khemis El Khechna": { office: 400, home: 550 },
      "El Kharrouba": { office: 400, home: 550 }
    }
  }
};

class YalidineService {
  constructor() {
    this.pricing = { ...YALIDINE_PRICING };
    this.loadFromLocalStorage();
  }

  /**
   * Charger les données depuis localStorage
   */
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('yalidine_pricing');
      if (saved) {
        this.pricing = { ...this.pricing, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Erreur chargement tarifs Yalidine:', error);
    }
  }

  /**
   * Sauvegarder les données dans localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('yalidine_pricing', JSON.stringify(this.pricing));
    } catch (error) {
      console.error('Erreur sauvegarde tarifs Yalidine:', error);
    }
  }

  /**
   * Obtenir toutes les wilayas
   */
  getAllWilayas() {
    return Object.entries(this.pricing).map(([code, data]) => ({
      code,
      name: data.name,
      communeCount: Object.keys(data.communes).length
    }));
  }

  /**
   * Obtenir les communes d'une wilaya
   */
  getCommunesByWilaya(wilayaCode) {
    const wilaya = this.pricing[wilayaCode];
    if (!wilaya) return [];

    return Object.entries(wilaya.communes).map(([name, prices]) => ({
      name,
      office: prices.office,
      home: prices.home
    }));
  }

  /**
   * Obtenir le prix de livraison
   */
  getDeliveryPrice(wilayaCode, communeName, deliveryType = 'home') {
    const wilaya = this.pricing[wilayaCode];
    if (!wilaya) return null;

    const commune = wilaya.communes[communeName];
    if (!commune) return null;

    return commune[deliveryType] || commune.home;
  }

  /**
   * Mettre à jour le prix d'une commune
   */
  updateCommunePrice(wilayaCode, communeName, deliveryType, price) {
    if (!this.pricing[wilayaCode]) return false;
    if (!this.pricing[wilayaCode].communes[communeName]) return false;

    this.pricing[wilayaCode].communes[communeName][deliveryType] = parseInt(price);
    this.saveToLocalStorage();
    return true;
  }

  /**
   * Ajouter une nouvelle commune
   */
  addCommune(wilayaCode, communeName, officePrice, homePrice) {
    if (!this.pricing[wilayaCode]) return false;

    this.pricing[wilayaCode].communes[communeName] = {
      office: parseInt(officePrice),
      home: parseInt(homePrice)
    };
    this.saveToLocalStorage();
    return true;
  }

  /**
   * Supprimer une commune
   */
  removeCommune(wilayaCode, communeName) {
    if (!this.pricing[wilayaCode] || !this.pricing[wilayaCode].communes[communeName]) {
      return false;
    }

    delete this.pricing[wilayaCode].communes[communeName];
    this.saveToLocalStorage();
    return true;
  }

  /**
   * Ajouter une nouvelle wilaya
   */
  addWilaya(code, name) {
    if (this.pricing[code]) return false;

    this.pricing[code] = {
      name,
      communes: {}
    };
    this.saveToLocalStorage();
    return true;
  }

  /**
   * Rechercher une commune dans toutes les wilayas
   */
  searchCommune(searchTerm) {
    const results = [];
    const term = searchTerm.toLowerCase();

    Object.entries(this.pricing).forEach(([wilayaCode, wilayaData]) => {
      Object.entries(wilayaData.communes).forEach(([communeName, prices]) => {
        if (communeName.toLowerCase().includes(term)) {
          results.push({
            wilayaCode,
            wilayaName: wilayaData.name,
            communeName,
            office: prices.office,
            home: prices.home
          });
        }
      });
    });

    return results;
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    const wilayas = Object.keys(this.pricing).length;
    let totalCommunes = 0;
    let avgOfficePrice = 0;
    let avgHomePrice = 0;
    let priceCount = 0;

    Object.values(this.pricing).forEach(wilaya => {
      const communes = Object.values(wilaya.communes);
      totalCommunes += communes.length;
      
      communes.forEach(commune => {
        avgOfficePrice += commune.office;
        avgHomePrice += commune.home;
        priceCount++;
      });
    });

    return {
      wilayas,
      totalCommunes,
      avgOfficePrice: priceCount > 0 ? Math.round(avgOfficePrice / priceCount) : 0,
      avgHomePrice: priceCount > 0 ? Math.round(avgHomePrice / priceCount) : 0
    };
  }

  /**
   * Exporter les données en CSV
   */
  exportToCSV() {
    const rows = ['Wilaya Code,Wilaya Name,Commune,Office Price,Home Price'];
    
    Object.entries(this.pricing).forEach(([wilayaCode, wilayaData]) => {
      Object.entries(wilayaData.communes).forEach(([communeName, prices]) => {
        rows.push(`${wilayaCode},${wilayaData.name},${communeName},${prices.office},${prices.home}`);
      });
    });

    return rows.join('\n');
  }

  /**
   * Réinitialiser aux données par défaut
   */
  resetToDefault() {
    this.pricing = { ...YALIDINE_PRICING };
    this.saveToLocalStorage();
  }
}

// Instance singleton
const yalidineService = new YalidineService();

export default yalidineService;
