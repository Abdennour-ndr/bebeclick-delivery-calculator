/**
 * قاعدة بيانات كاملة للولايات والبلديات الجزائرية
 * 58 ولاية مع جميع البلديات
 */

export const ALGERIA_COMPLETE = [
  // الولايات من 1-10 (تم إنشاؤها في الملف السابق)
  
  // الولايات من 11-20
  {
    code: 11,
    name: 'Tamanrasset',
    nameAr: 'تمنراست',
    region: 'sud',
    communes: [
      'Tamanrasset', 'Abalessa', 'In Guezzam', 'Tin Zaouatine', 'Tazrouk', 'In Salah',
      'In Amguel', 'Idles', 'Silet', 'Ain Amguel', 'Foggaret Ezzaouia'
    ]
  },
  {
    code: 12,
    name: 'Tébessa',
    nameAr: 'تبسة',
    region: 'est',
    communes: [
      'Tébessa', 'Bir El Ater', 'Cheria', 'Stah Guentis', 'El Aouinet', 'Lahouidjbet',
      'Safsaf El Ouesra', 'Hammamet', 'Negrine', 'Bir Mokadem', 'El Kouif', 'Morsott',
      'El Ogla', 'Bir Dheheb', 'El Houidjbet', 'Ain Zerga', 'El Meridj', 'Boulhaf Dir',
      'Bekkaria', 'Boukhadra', 'Ouenza', 'El Ogla El Malha', 'Ferkane', 'Oum Ali',
      'Tlidjene', 'Ain Chabro', 'Mazraet El Djemel', 'Bir El Ater'
    ]
  },
  {
    code: 13,
    name: 'Tlemcen',
    nameAr: 'تلمسان',
    region: 'ouest',
    communes: [
      'Tlemcen', 'Mansourah', 'Chetouane', 'Nedroma', 'Ghazaouet', 'Remchi', 'Sabra',
      'Marsa Ben M\'Hidi', 'Bensekrane', 'Amieur', 'Ain Tallout', 'Souani', 'Djebala',
      'El Fehoul', 'Sebdou', 'Beni Mester', 'Belkheir', 'Sid Djillali', 'Beni Boussaid',
      'Hennaya', 'Maghnia', 'Hammam Boughrara', 'Souahlia', 'Msirda Fouaga', 'Ain Fezza',
      'Ouled Mimoun', 'Amieur', 'Ain Ghoraba', 'Chetouane', 'Honaine', 'Tianet',
      'Ouled Riyah', 'Bouihi', 'Souk Tleta', 'Sidi Abdelli', 'Sebaa Chioukh',
      'Beni Semiel', 'Ain Nehala', 'Jebala', 'Dar Yaghmoracene', 'Fellaoucene',
      'Azails', 'Sebbaa Chioukh', 'Terny Beni Hediel', 'Tianet', 'Ouled Mimoun',
      'Beni Ouarsous', 'Souahlia', 'Beni Bahdel', 'El Aricha', 'Sidi Medjahed'
    ]
  },
  {
    code: 14,
    name: 'Tiaret',
    nameAr: 'تيارت',
    region: 'ouest',
    communes: [
      'Tiaret', 'Medroussa', 'Ain Bouchekif', 'Sidi Ali Mellal', 'Ain Zarit', 'Ain Dheb',
      'Sidi Bakhti', 'Medrissa', 'Zmalet El Emir Abdelkader', 'Madna', 'Sebt', 'Mellakou',
      'Dahmouni', 'Rahouia', 'Mahdia', 'Sougueur', 'Sidi Abdelghani', 'Ain El Hadid',
      'Ouled Djerad', 'Naima', 'Meghila', 'Guertoufa', 'Sidi Hosni', 'Djillali Ben Amar',
      'Sebaine', 'Tousnina', 'Frenda', 'Ain Kermes', 'Ksar Chellala', 'Rechaiga',
      'Nadorah', 'Tagdemt', 'Oued Lilli', 'Mechraa Safa', 'Hamadia', 'Chehaima',
      'Takhemaret', 'Sidi Abderrahmane', 'Serghine', 'Bougara', 'Faidja', 'Tidda'
    ]
  },
  {
    code: 15,
    name: 'Tizi Ouzou',
    nameAr: 'تيزي وزو',
    region: 'nord',
    communes: [
      'Tizi Ouzou', 'Ain El Hammam', 'Akbil', 'Freha', 'Souama', 'Mechtras', 'Irdjen',
      'Timizart', 'Makouda', 'Draa El Mizan', 'Tizi Gheniff', 'Bounouh', 'Ait Chafaa',
      'Frikat', 'Beni Aissi', 'Beni Zmenzer', 'Iferhounene', 'Azazga', 'Illoula Oumalou',
      'Yakouren', 'Larbaâ Nath Irathen', 'Tizi Rached', 'Zekri', 'Ouaguenoun',
      'Ain Zaouia', 'M\'Kira', 'Ait Yahia', 'Ait Mahmoud', 'Maatkas', 'Ait Boumahdi',
      'Abi Youcef', 'Beni Douala', 'Illilten', 'Bouzeguene', 'Ait Aggouacha',
      'Ouadhias', 'Azeffoun', 'Tigzirt', 'Ait Aissa Mimoun', 'Boghni', 'Ifigha',
      'Ait Oumalou', 'Tirmitine', 'Akerrou', 'Yatafen', 'Beni Ziki', 'Draâ Ben Khedda',
      'Ouacifs', 'Idjeur', 'Iflis', 'Tadmait', 'Ait Yahia Moussa', 'Souk El Tenine',
      'Ait Khelili', 'Sidi Naamane', 'Iboudraren', 'Aghribs', 'Mizrana', 'Imsouhal',
      'Tadmait', 'Ait Bouaddou', 'Assi Youcef', 'Ait Toudert'
    ]
  },
  {
    code: 16,
    name: 'Alger',
    nameAr: 'الجزائر',
    region: 'centre',
    communes: [
      'Alger Centre', 'Sidi M\'Hamed', 'El Madania', 'Hamma El Annasser', 'Bab El Oued',
      'Bologhine', 'Casbah', 'Oued Koriche', 'Bir Mourad Rais', 'El Biar', 'Bouzareah',
      'Birkhadem', 'El Harrach', 'Baraki', 'Oued Smar', 'Bourouba', 'Hussein Dey',
      'Kouba', 'Bachdjerrah', 'Dar El Beida', 'Bab Ezzouar', 'Ben Aknoun', 'Dely Ibrahim',
      'El Mouradia', 'Hydra', 'Mohammadia', 'Bordj El Kiffan', 'El Magharia',
      'Beni Messous', 'Les Eucalyptus', 'Birtouta', 'Tessala El Merdja', 'Ouled Chebel',
      'Sidi Moussa', 'Ain Taya', 'Bordj El Bahri', 'El Marsa', 'H\'Raoua', 'Rouiba',
      'Reghaïa', 'Ain Benian', 'Staoueli', 'Zeralda', 'Mahelma', 'Rahmania',
      'Souidania', 'Cheraga', 'Ouled Fayet', 'El Achour', 'Draria', 'Douera',
      'Baba Hassen', 'Khraicia', 'Saoula', 'Baraki', 'Sehaoula'
    ]
  },
  {
    code: 17,
    name: 'Djelfa',
    nameAr: 'الجلفة',
    region: 'centre',
    communes: [
      'Djelfa', 'Moudjbara', 'El Guedid', 'Hassi Bahbah', 'Ain Maabed', 'Sed Rahal',
      'Faidh El Botma', 'Birine', 'Bouira Lahdab', 'Zaccar', 'El Khemis', 'Sidi Baizid',
      'Mliliha', 'El Idrissia', 'Douis', 'Hassi El Euch', 'Messaad', 'Guettara',
      'Ain Chouhada', 'Dar Chioukh', 'Selmana', 'Ain El Ibel', 'Ain Oussera',
      'Benhar', 'Hassi Fedoul', 'Charef', 'M\'Liliha', 'El Guedid', 'Had Sahary',
      'Guernini', 'Sidi Ladjel', 'Hassi R\'Mel', 'Ain Feka', 'Tadmit', 'El Mesrane',
      'Amourah'
    ]
  },
  {
    code: 18,
    name: 'Jijel',
    nameAr: 'جيجل',
    region: 'nord',
    communes: [
      'Jijel', 'Eraguene', 'El Aouana', 'Ziama Mansouria', 'Taher', 'Emir Abdelkader',
      'Chekfa', 'Chahna', 'El Milia', 'Sidi Marouf', 'Settara', 'El Ancer', 'Sidi Abdelaziz',
      'Kaous', 'Ghebala', 'Bouraoui Belhadef', 'Djimla', 'Selma Benziada', 'Boudria Beniyadjis',
      'Oudjana', 'Texenna', 'Djemaa Beni Habibi', 'Bordj Tahar', 'Ouled Yahia Khedrouche',
      'Ouled Rabah', 'Ouled Askeur', 'Khiri Oued Adjoul', 'El Kennar Nouchfi'
    ]
  },
  {
    code: 19,
    name: 'Sétif',
    nameAr: 'سطيف',
    region: 'est',
    communes: [
      'Sétif', 'Ain El Kebira', 'Dehamcha', 'Babor', 'Guidjel', 'Ain Lahdjar',
      'Ouled Addouane', 'Boutaleb', 'Ain Sebt', 'Hammam Guergour', 'Ras El Oued',
      'Mezloug', 'Bir Haddada', 'Ouled Sabor', 'Guenzet', 'Tala Ifacene', 'Beidha Bordj',
      'El Eulma', 'Djemila', 'Beni Aziz', 'Ouled Tebben', 'Rosfa', 'Ouled Si Ahmed',
      'Hammam Sokhna', 'Ain Arnat', 'Ain Abessa', 'Dehamcha', 'Bougaa', 'Bordj Ghedir',
      'El Ouricia', 'Maouaklane', 'Tachouda', 'Beni Chebana', 'Ouled Addouane',
      'Belaa', 'Ain Legradj', 'Ain Oulmene', 'Beni Fouda', 'Bazer Sakhra', 'Harbil',
      'El Ouldja', 'Tizi N\'Bechar', 'Salah Bey', 'Ain Azal', 'Guellal', 'Ain Karcha',
      'Daraa', 'Beni Hocine', 'Beni Ourtilane', 'Hamma', 'Maaouia', 'Ain Lahdjar',
      'Ksar El Abtal', 'Beni Mouhli', 'Ouled Brahem', 'Amoucha', 'Ain Roua',
      'Oued El Bared', 'Talaifacene', 'Bousselam'
    ]
  },
  {
    code: 20,
    name: 'Saïda',
    nameAr: 'سعيدة',
    region: 'ouest',
    communes: [
      'Saïda', 'Doui Thabet', 'Ouled Brahim', 'Moulay Larbi', 'Youb', 'Hounet',
      'Sidi Amar', 'Sidi Boubekeur', 'El Hassasna', 'Maamora', 'Sidi Yacoub',
      'Ouled Khaled', 'Ain El Hadjar', 'Ouled Brahim', 'Tircine', 'Ain Soltane'
    ]
  }
];
