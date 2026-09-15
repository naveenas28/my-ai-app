// Global Hierarchical Geographic Dataset with Localized Administrative Terminology

export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  level1Name: string; // State, Province, Region, Department, Land
  level2Name: string; // District, County, Prefecture, Department, Municipality
  level3Name: string; // Taluk/Tehsil, Sub-county, LGA, Township, Canton, Ward
  level4Name: string; // Village, Town, Locality, Settlement, Barangay, Commune
  states: StateHierarchy[];
}

export interface StateHierarchy {
  name: string;
  code?: string;
  districts: DistrictHierarchy[];
}

export interface DistrictHierarchy {
  name: string;
  code?: string;
  subDistricts: SubDistrictHierarchy[];
}

export interface SubDistrictHierarchy {
  name: string;
  code?: string;
  isUnavailable?: boolean;
  villages: string[];
}

// 1. Comprehensive Global Countries Dataset with Deep Administrative Hierarchies
export const GLOBAL_COUNTRIES: CountryInfo[] = [
  {
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    level1Name: 'State / UT',
    level2Name: 'District',
    level3Name: 'Taluk / Tehsil',
    level4Name: 'Village / Town',
    states: [
      {
        name: 'Karnataka',
        code: 'KA',
        districts: [
          {
            name: 'Chikkaballapura',
            subDistricts: [
              { name: 'Chikkaballapura', villages: ['Anemadagu', 'Kandavara', 'Agalagurki', 'Nandi', 'Harobele', 'Maralur'] },
              { name: 'Gauribidanur', villages: ['Vidurashwatha', 'Nagaragere', 'Kalludi', 'Thondebhavi', 'D-Palya'] },
              { name: 'Bagepalli', villages: ['Chelur', 'Pathapalya', 'Guluru', 'Mittemari', 'Billur'] },
              { name: 'Sidlaghatta', villages: ['Melur', 'Jangamakote', 'Dibburahalli', 'Basavattana', 'Sadali'] },
              { name: 'Chintamani', villages: ['Kaivara', 'Muragamalla', 'Ambajidurga', 'Burudagunte', 'Yagavakote'] },
              { name: 'Gudibande', villages: ['Beechaganahalli', 'Somenahalli', 'Ullodu', 'Ellodu'] }
            ]
          },
          {
            name: 'Kolar',
            subDistricts: [
              { name: 'Kolar', villages: ['Vokkaleri', 'Sugatur', 'Huthur', 'Holur', 'Vemgal'] },
              { name: 'Bangarapet', villages: ['Deshihalli', 'Kamasamudram', 'Kyasamballi', 'Bethamangala'] },
              { name: 'Malur', villages: ['Lakkur', 'Tekal', 'Masti', 'Hullur', 'Hulimangala'] },
              { name: 'Srinivaspur', villages: ['Rayalpadu', 'Ronur', 'Yeldur', 'Gownipalli'] },
              { name: 'Mulbagal', villages: ['Tayalur', 'Avani', 'Byrakur', 'Duggasandra'] }
            ]
          },
          {
            name: 'Mandya',
            subDistricts: [
              { name: 'Mandya', villages: ['Dudda', 'Basaralu', 'Keragodu', 'Kothathi'] },
              { name: 'Maddur', villages: ['Koppa', 'Besagarahalli', 'Athagur', 'Chikkarasinakere'] },
              { name: 'Malavalli', villages: ['Halagur', 'Belakavadi', 'Kirugavalu', 'Panditahalli'] },
              { name: 'Pandavapura', villages: ['Melukote', 'Chinya', 'Kyathanahalli', 'Harohalli'] },
              { name: 'Srirangapatna', villages: ['Arakere', 'KRS', 'Belagola', 'Mahadevapura'] },
              { name: 'Nagarnangala', villages: ['Bellur', 'Bindiganavile', 'Devalapura', 'Honakere'] },
              { name: 'Krishnarajpet', villages: ['Santhebachahalli', 'Kikkeri', 'Bukinakere', 'Sheelanere'] }
            ]
          },
          {
            name: 'Dharwad',
            subDistricts: [
              { name: 'Dharwad', villages: ['Garag', 'Hebballi', 'Mugad', 'Alnavar', 'Narendra'] },
              { name: 'Hubballi Urban', villages: ['Unkal', 'Navanagar', 'Bhairidevarakoppa', 'Gopankoppa'] },
              { name: 'Hubballi Rural', villages: ['Chabbi', 'Kusugal', 'Shirguppi', 'Bhandiwad'] },
              { name: 'Kalghatgi', villages: ['Dummavad', 'Mishrikoti', 'Tabakad Honnalli'] },
              { name: 'Kundgol', villages: ['Saunshi', 'Yaliwal', 'Pashupathihal', 'Hireharkuni'] },
              { name: 'Navalgund', villages: ['Annigeri', 'Arekurahatti', 'Morab', 'Alagawadi'] }
            ]
          },
          {
            name: 'Koppal',
            subDistricts: [
              { name: 'Koppal', villages: ['Alavandi', 'Kinnal', 'Bhagyanagar', 'Bannikoppa'] },
              { name: 'Gangavathi', villages: ['Anegundi', 'Marali', 'Kanakagiri', 'Karatagi'] },
              { name: 'Kushtagi', villages: ['Tavargera', 'Dotihal', 'Hanamsagar', 'Mudenur'] },
              { name: 'Yelbarga', villages: ['Kukanoor', 'Hirewaddatti', 'Bevoor', 'Bannikoppa'] }
            ]
          },
          {
            name: 'Raichur',
            subDistricts: [
              { name: 'Raichur', villages: ['Yermarus', 'Kalmala', 'Ghanagur', 'Matmari'] },
              { name: 'Sindhanur', villages: ['Turvihal', 'Jawalgera', 'Salagunda', 'Gorebal'] },
              { name: 'Manvi', villages: ['Pothnal', 'Sirwar', 'Kallur', 'Harvi'] },
              { name: 'Devadurga', villages: ['Arakera', 'Gabbur', 'Jalahalli', 'Galag'] },
              { name: 'Lingasugur', villages: ['Mudgal', 'Maski', 'Hutti', 'Gurugunta'] }
            ]
          },
          {
            name: 'Tumakuru',
            subDistricts: [
              { name: 'Tumakuru', villages: ['Bellavi', 'Hebbur', 'Urdigere', 'Gulur', 'Kyatsandra'] },
              { name: 'Sira', villages: ['Bukkapatna', 'Kallambella', 'Huliyar', 'Tavarekere'] },
              { name: 'Kunigal', villages: ['Huliyurdurga', 'Amruthur', 'Kothagere', 'Yediyur'] },
              { name: 'Tiptur', villages: ['Honnavalli', 'Kibbanahalli', 'Nonavinakere'] },
              { name: 'Madhugiri', villages: ['Midigeshi', 'Kodigenahalli', 'Puravara', 'Badavanahalli'] },
              { name: 'Pavagada', villages: ['Nagalamadike', 'Roppa', 'Y.N. Hosakote', 'Kotagudda'] }
            ]
          },
          {
            name: 'Mysuru',
            subDistricts: [
              { name: 'Mysuru', villages: ['Varuna', 'Jayapura', 'Kadakola', 'Ilavala', 'Yelwal'] },
              { name: 'Nanjangud', villages: ['Hullahalli', 'Kowlande', 'Biligere', 'Debur'] },
              { name: 'Hunsur', villages: ['Bilikere', 'Gavadagere', 'Hunasavadi', 'Rathehalli'] },
              { name: 'T. Narasipura', villages: ['Mugur', 'Bannur', 'Sosale', 'Talakad'] },
              { name: 'Piriyapatna', villages: ['Bettadapura', 'Ravandur', 'Kamplapura', 'Bylakuppe'] }
            ]
          },
          {
            name: 'Belagavi',
            subDistricts: [
              { name: 'Belagavi', villages: ['Kakati', 'Peeranwadi', 'Badas', 'Uchagaon', 'Sambara'] },
              { name: 'Chikkodi', villages: ['Nipani', 'Sadalaga', 'Examba', 'Kallol', 'Kagwad'] },
              { name: 'Gokak', villages: ['Koujalgi', 'Ankalgi', 'Ghataprabha', 'Arabhavi'] },
              { name: 'Athani', villages: ['Kagawad', 'Ainapur', 'Shedabal', 'Ugar'] },
              { name: 'Bailhongal', villages: ['Sampgaon', 'Nesargi', 'Kittur', 'Murgod'] }
            ]
          },
          {
            name: 'Shivamogga',
            subDistricts: [
              { name: 'Shivamogga', villages: ['Kumsi', 'Haranahalli', 'Holalur', 'Gajanur'] },
              { name: 'Bhadravati', villages: ['Holehonnur', 'Kudli', 'Danayakapura'] },
              { name: 'Sagara', villages: ['Talaguppa', 'Avinahalli', 'Anandapura', 'Jog'] },
              { name: 'Shikaripura', villages: ['Shiralkoppa', 'Kaginelli', 'Salur', 'Hosur'] }
            ]
          },
          {
            name: 'Bengaluru Rural',
            subDistricts: [
              { name: 'Devanahalli', villages: ['Vijayapura', 'Kundana', 'Koira', 'Vishwanathapura'] },
              { name: 'Doddaballapura', villages: ['Tubagere', 'Doddabelavangala', 'Sasalu', 'Madhure'] },
              { name: 'Hosakote', villages: ['Sulibele', 'Anugondanahalli', 'Jadigenahalli', 'Nandagudi'] },
              { name: 'Nelamangala', villages: ['Sompura', 'Dabaspete', 'Thyamagondlu', 'Solur'] }
            ]
          }
        ]
      },
      {
        name: 'Maharashtra',
        code: 'MH',
        districts: [
          {
            name: 'Nashik',
            subDistricts: [
              { name: 'Nashik', villages: ['Deolali', 'Girnare', 'Dindori', 'Eklahare', 'Makhmalabad'] },
              { name: 'Niphad', villages: ['Pimpalgaon Baswant', 'Lasalgaon', 'Ranwad', 'Sukena'] },
              { name: 'Malegaon', villages: ['Satana', 'Ravalgon', 'Saundane', 'Zodge'] },
              { name: 'Sinnar', villages: ['Wavi', 'Pangri', 'Musgaon', 'Dubere'] }
            ]
          },
          {
            name: 'Pune',
            subDistricts: [
              { name: 'Baramati', villages: ['Malegaon BK', 'Songaon', 'Morgaon', 'Dhekalwadi'] },
              { name: 'Haveli', villages: ['Uruli Kanchan', 'Wagholi', 'Loni Kalbhor', 'Khadakwasla'] },
              { name: 'Junnar', villages: ['Narayangaon', 'Alephata', 'Otur', 'Ghodegaon'] },
              { name: 'Indapur', villages: ['Bawda', 'Nimgaon Ketki', 'Kati', 'Walchandnagar'] }
            ]
          },
          {
            name: 'Kolhapur',
            subDistricts: [
              { name: 'Karveer', villages: ['Hupari', 'Kagal', 'Shiroli', 'Uchgaon'] },
              { name: 'Hatkanangle', villages: ['Ichalkaranji', 'Pattankodoli', 'Kabnur', 'Rukadi'] },
              { name: 'Radhanagari', villages: ['Tarale', 'Kasaba Walva', 'Shelewadi'] }
            ]
          },
          {
            name: 'Solapur',
            subDistricts: [
              { name: 'Pandharpur', villages: ['Karkamb', 'Korti', 'Bhalwani', 'Tungat'] },
              { name: 'Barshi', villages: ['Vairag', 'Gaudgaon', 'Pangri', 'Korphale'] },
              { name: 'Akkalkot', villages: ['Maindargi', 'Chapalgaon', 'Kallur'] }
            ]
          },
          {
            name: 'Nagpur',
            subDistricts: [
              { name: 'Katol', villages: ['Kondhali', 'Paradsinga', 'Metpanjra'] },
              { name: 'Saoner', villages: ['Khapa', 'Kelwad', 'Dhapewada'] },
              { name: 'Umred', villages: ['Bhiwapur', 'Kuhi', 'Sirsi'] }
            ]
          }
        ]
      },
      {
        name: 'Punjab',
        code: 'PB',
        districts: [
          {
            name: 'Amritsar',
            subDistricts: [
              { name: 'Amritsar I', villages: ['Attari', 'Chheharta', 'Majitha Rural', 'Khas'] },
              { name: 'Amritsar II', villages: ['Jandiala Guru', 'Rayya', 'Verka', 'Mallunangalpura'] },
              { name: 'Ajnala', villages: ['Ramdas', 'Chogawan', 'Bhindisaidan', 'Fatehgarh Churian'] }
            ]
          },
          {
            name: 'Ludhiana',
            subDistricts: [
              { name: 'Ludhiana East', villages: ['Sahnewal', 'Kohara', 'Samrala', 'Machhiwara'] },
              { name: 'Ludhiana West', villages: ['Mullanpur Dakha', 'Jagraon', 'Raikot', 'Sidhwan Bet'] },
              { name: 'Khanna', villages: ['Payal', 'Doraha', 'Isru', 'Bhadla'] }
            ]
          },
          {
            name: 'Bathinda',
            subDistricts: [
              { name: 'Bathinda', villages: ['Goniana', 'Bhucho Mandi', 'Nathana', 'Sangat'] },
              { name: 'Talwandi Sabo', villages: ['Raman', 'Maur Mandi', 'Kot Shamir', 'Jassi Pau Wali'] },
              { name: 'Rampura Phul', villages: ['Phul', 'Balianwali', 'Chauke', 'Mehraj'] }
            ]
          },
          {
            name: 'Patiala',
            subDistricts: [
              { name: 'Patiala', villages: ['Sanaur', 'Dakala', 'Bahadurgarh', 'Devigarh'] },
              { name: 'Nabha', villages: ['Bhadson', 'Alhoran', 'Dhingi', 'Ghagga'] },
              { name: 'Rajpura', villages: ['Ghanaur', 'Shambhu', 'Seh', 'Jansla'] }
            ]
          }
        ]
      },
      {
        name: 'Tamil Nadu',
        code: 'TN',
        districts: [
          {
            name: 'Coimbatore',
            subDistricts: [
              { name: 'Pollachi', villages: ['Anaimalai', 'Kottur', 'Negamam', 'Kinathukadavu'] },
              { name: 'Mettupalayam', villages: ['Karamadai', 'Sirumugai', 'Nellithurai', 'Bellaepalayam'] },
              { name: 'Sulur', villages: ['Irugur', 'Pallapalayam', 'Somanur', 'Sultanpet'] }
            ]
          },
          {
            name: 'Thanjavur',
            subDistricts: [
              { name: 'Thanjavur', villages: ['Vallam', 'Alakkudi', 'Mariammankoil', 'Kandiyur'] },
              { name: 'Kumbakonam', villages: ['Swamimalai', 'Thirunageswaram', 'Papanasam', 'Dharasuram'] },
              { name: 'Pattukkottai', villages: ['Madukkur', 'Adirampattinam', 'Peravurani'] }
            ]
          },
          {
            name: 'Madurai',
            subDistricts: [
              { name: 'Melur', villages: ['Kottampatti', 'Vellalur', 'Keelavalavu'] },
              { name: 'Usilampatti', villages: ['Sedapatti', 'Chellampatti', 'Valandur'] },
              { name: 'Thirumangalam', villages: ['Kallikudi', 'T.Kallupatti', 'Kappalur'] }
            ]
          }
        ]
      },
      {
        name: 'Andhra Pradesh',
        code: 'AP',
        districts: [
          {
            name: 'Guntur',
            subDistricts: [
              { name: 'Guntur Urban', villages: ['Nallapadu', 'Pedakakani', 'Chebrolu', 'Tenali Rural'] },
              { name: 'Tenali', villages: ['Kollipara', 'Duggirala', 'Tsundur', 'Amruthalur'] },
              { name: 'Mangalagiri', villages: ['Tadepalli', 'Kaza', 'Nowlur', 'Nidamarru'] }
            ]
          },
          {
            name: 'East Godavari',
            subDistricts: [
              { name: 'Rajahmundry', villages: ['Kadiam', 'Rajanagaram', 'Korukonda', 'Dowleswaram'] },
              { name: 'Kakinada', villages: ['Samalkota', 'Peddapuram', 'Karapa', 'Tallarevu'] }
            ]
          }
        ]
      },
      {
        name: 'Telangana',
        code: 'TG',
        districts: [
          {
            name: 'Warangal',
            subDistricts: [
              { name: 'Warangal Urban', villages: ['Kazipet', 'Hanamkonda Rural', 'Inavolu', 'Hasanparthy'] },
              { name: 'Narsampet', villages: ['Chennaraopet', 'Khanapur', 'Duggondi', 'Nekkonda'] }
            ]
          },
          {
            name: 'Nalgonda',
            subDistricts: [
              { name: 'Nalgonda', villages: ['Tipparthy', 'Kanagal', 'Madugulapally', 'Munugode'] },
              { name: 'Miryalaguda', villages: ['Damaracherla', 'Vemulapally', 'Tripuraram'] }
            ]
          }
        ]
      },
      {
        name: 'Uttar Pradesh',
        code: 'UP',
        districts: [
          {
            name: 'Varanasi',
            subDistricts: [
              { name: 'Pindra', villages: ['Phulpur', 'Sindhora', 'Karkhiyawon', 'Mangari'] },
              { name: 'Raja Talab', villages: ['Rohaniya', 'Mirzamurad', 'Kachhwa', 'Arajiline'] }
            ]
          },
          {
            name: 'Agra',
            subDistricts: [
              { name: 'Fatehabad', villages: ['Doki', 'Samogar', 'Barauda', 'Rampura'] },
              { name: 'Kheragarh', villages: ['Saiyan', 'Jagner', 'Basoni'] }
            ]
          }
        ]
      },
      {
        name: 'Kerala',
        code: 'KL',
        districts: [
          {
            name: 'Wayanad',
            subDistricts: [
              { name: 'Sulthan Bathery', villages: ['Noolpuzha', 'Ambalavayal', 'Nenmeni', 'Poothadi'] },
              { name: 'Mananthavady', villages: ['Thirunelly', 'Vellamunda', 'Panamaram', 'Thavinhal'] }
            ]
          },
          {
            name: 'Palakkad',
            subDistricts: [
              { name: 'Alathur', villages: ['Kavassery', 'Tarur', 'Melarcode', 'Kizhakkencherry'] },
              { name: 'Chittur', villages: ['Kozhinjampara', 'Nallepilly', 'Perumatty', 'Vandithavalam'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    level1Name: 'State',
    level2Name: 'County',
    level3Name: 'Township / District',
    level4Name: 'City / Town / Locality',
    states: [
      {
        name: 'California',
        code: 'CA',
        districts: [
          {
            name: 'Fresno County',
            subDistricts: [
              { name: 'Central Valley District', villages: ['Fresno', 'Clovis', 'Sanger', 'Reedley', 'Selma', 'Kerman'] },
              { name: 'Westside Ag District', villages: ['Coalinga', 'Huron', 'Mendota', 'Firebaugh', 'San Joaquin'] },
              { name: 'Kings River District', villages: ['Kingsburg', 'Parlier', 'Fowler', 'Del Rey', 'Caruthers'] }
            ]
          },
          {
            name: 'Tulare County',
            subDistricts: [
              { name: 'Citrus Belt District', villages: ['Visalia', 'Tulare', 'Porterville', 'Dinuba', 'Lindsay', 'Exeter'] },
              { name: 'Southern Valley District', villages: ['Woodlake', 'Farmersville', 'Orosi', 'Cutler', 'Earlimart'] }
            ]
          },
          {
            name: 'Monterey County',
            subDistricts: [
              { name: 'Salinas Valley (Salad Bowl)', villages: ['Salinas', 'Soledad', 'Gonzales', 'Greenfield', 'King City'] },
              { name: 'Coastal Ag District', villages: ['Castroville', 'Marina', 'Pajaro', 'Chualar', 'San Ardo'] }
            ]
          },
          {
            name: 'Kern County',
            subDistricts: [
              { name: 'Bakersfield Ag Plain', villages: ['Bakersfield', 'Delano', 'Wasco', 'Shafter', 'Arvin', 'McFarland'] }
            ]
          },
          {
            name: 'Imperial County',
            subDistricts: [
              { name: 'Imperial Valley Irrigation District', villages: ['El Centro', 'Brawley', 'Calexico', 'Imperial', 'Holtville', 'Westmorland'] }
            ]
          }
        ]
      },
      {
        name: 'Iowa',
        code: 'IA',
        districts: [
          {
            name: 'Polk County',
            subDistricts: [
              { name: 'Des Moines River Basin', villages: ['Des Moines', 'Ankeny', 'Altoona', 'Bondurant', 'Polk City', 'Grimes'] }
            ]
          },
          {
            name: 'Story County',
            subDistricts: [
              { name: 'Ames Ag Innovation District', villages: ['Ames', 'Nevada', 'Story City', 'Huxley', 'Maxwell', 'Roland'] }
            ]
          },
          {
            name: 'Plymouth County',
            subDistricts: [
              { name: 'Northwest Corn Belt', villages: ['Le Mars', 'Remsen', 'Akron', 'Kingsley', 'Merrill', 'Hinton'] }
            ]
          }
        ]
      },
      {
        name: 'Texas',
        code: 'TX',
        districts: [
          {
            name: 'Lubbock County',
            subDistricts: [
              { name: 'High Plains Cotton Belt', villages: ['Lubbock', 'Slaton', 'Idalou', 'Shallowater', 'Wolfforth', 'New Deal'] }
            ]
          },
          {
            name: 'Hidalgo County',
            subDistricts: [
              { name: 'Rio Grande Valley Citrus Basin', villages: ['McAllen', 'Edinburg', 'Mission', 'Weslaco', 'Pharr', 'San Juan'] }
            ]
          }
        ]
      },
      {
        name: 'Nebraska',
        code: 'NE',
        districts: [
          {
            name: 'Lancaster County',
            subDistricts: [
              { name: 'Platte River Valley', villages: ['Lincoln', 'Waverly', 'Hickman', 'Bennet', 'Firth', 'Malcolm'] }
            ]
          },
          {
            name: 'Hall County',
            subDistricts: [
              { name: 'Central Corn & Beef Hub', villages: ['Grand Island', 'Wood River', 'Doniphan', 'Cairo', 'Alda'] }
            ]
          }
        ]
      },
      {
        name: 'Illinois',
        code: 'IL',
        districts: [
          {
            name: 'Champaign County',
            subDistricts: [
              { name: 'Prairie Corn Basin', villages: ['Champaign', 'Urbana', 'Rantoul', 'Mahomet', 'St. Joseph', 'Tolono'] }
            ]
          },
          {
            name: 'McLean County',
            subDistricts: [
              { name: 'Soybean Heartland', villages: ['Bloomington', 'Normal', 'Le Roy', 'Heyworth', 'Lexington', 'Chenoa'] }
            ]
          }
        ]
      },
      {
        name: 'Washington',
        code: 'WA',
        districts: [
          {
            name: 'Yakima County',
            subDistricts: [
              { name: 'Yakima Apple & Hop Valley', villages: ['Yakima', 'Sunnyside', 'Grandview', 'Toppenish', 'Selah', 'Wapato', 'Zillah'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Kenya',
    code: 'KE',
    flag: '🇰🇪',
    level1Name: 'Region / Province',
    level2Name: 'County',
    level3Name: 'Sub-County / Constituency',
    level4Name: 'Ward / Village',
    states: [
      {
        name: 'Rift Valley Region',
        districts: [
          {
            name: 'Nakuru County',
            subDistricts: [
              { name: 'Naivasha Sub-County', villages: ['Mai Mahiu', 'Olkaria', 'Hell\'s Gate', 'Viwandani', 'Biashara Ward'] },
              { name: 'Molo Sub-County', villages: ['Turi', 'Elburgon', 'Molo Town', 'Mariashoni'] },
              { name: 'Njoro Sub-County', villages: ['Nessuit', 'Mauche', 'Njoro Central', 'Lare', 'Kihingo'] },
              { name: 'Rongai Sub-County', villages: ['Menengai West', 'Visoi', 'Solai', 'Boror', 'Mosop'] }
            ]
          },
          {
            name: 'Uasin Gishu County',
            subDistricts: [
              { name: 'Eldoret Sub-County', villages: ['Soy', 'Turbo', 'Moiben', 'Ainabkoi', 'Kapseret', 'Kesses'] },
              { name: 'Turbo Grain Belt', villages: ['Ngenyilel', 'Tapsagoi', 'Kamagut', 'Sugoi', 'Kiplombe'] }
            ]
          },
          {
            name: 'Trans-Nzoia County',
            subDistricts: [
              { name: 'Kitale Maize Belt', villages: ['Cherangany', 'Endebess', 'Kiminini', 'Kwanza', 'Saboti'] }
            ]
          }
        ]
      },
      {
        name: 'Central Region',
        districts: [
          {
            name: 'Kiambu County',
            subDistricts: [
              { name: 'Thika Coffee Zone', villages: ['Gatuanyaga', 'Township', 'Kamenu', 'Hospital Ward', 'Ngoliba'] },
              { name: 'Limuru Tea Basin', villages: ['Bibirioni', 'Limuru Central', 'Ndeiya', 'Tigoni', 'Ngecha'] },
              { name: 'Gatundu Horticulture', villages: ['Kiamwangi', 'Kiganjo', 'Ndunyu', 'Mangu'] }
            ]
          },
          {
            name: 'Nyeri County',
            subDistricts: [
              { name: 'Othaya Coffee Hub', villages: ['Mahiga', 'Iriaini', 'Chinga', 'Karima'] },
              { name: 'Tetu Highland', villages: ['Aguthi-Gaaki', 'Dedan Kimathi', 'Wamagana'] }
            ]
          },
          {
            name: 'Murang\'a County',
            subDistricts: [
              { name: 'Kandara Avocado Belt', villages: ['Muruka', 'Kagundu-ini', 'Ithiru', 'Ruchu'] },
              { name: 'Gatanga Horticulture', villages: ['Kakuzi', 'Kigumo', 'Kariara', 'Kihumbu-ini'] }
            ]
          }
        ]
      },
      {
        name: 'Eastern Region',
        districts: [
          {
            name: 'Meru County',
            subDistricts: [
              { name: 'Imenti Tea & Banana Belt', villages: ['Kibirichia', 'Timau', 'Ruiri', 'Kiagu', 'Abothuguchi'] },
              { name: 'Tigania Dryland Farming', villages: ['Muthara', 'Mikinduri', 'Kiguchwa', 'Karama'] }
            ]
          },
          {
            name: 'Machakos County',
            subDistricts: [
              { name: 'Mwala Ag Basin', villages: ['Mbiuni', 'Makaveti', 'Kibauni', 'Masii', 'Vyulya'] },
              { name: 'Kangundo Mango Belt', villages: ['Kangundo Central', 'Matungulu', 'Tala Town', 'Kyeleni'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Nigeria',
    code: 'NG',
    flag: '🇳🇬',
    level1Name: 'State',
    level2Name: 'Senatorial District',
    level3Name: 'Local Govt Area (LGA)',
    level4Name: 'Ward / Community',
    states: [
      {
        name: 'Kano State',
        districts: [
          {
            name: 'Kano Central',
            subDistricts: [
              { name: 'Dala LGA', villages: ['Kabuwaya', 'Madigawa', 'Yalwa', 'Dogon Nama'] },
              { name: 'Gwale LGA', villages: ['Goron Dutse', 'Diso', 'Dorayi', 'Galadanchi'] }
            ]
          },
          {
            name: 'Kano South (Grain Belt)',
            subDistricts: [
              { name: 'Rano LGA', villages: ['Rura', 'Kibiya', 'Dawaki', 'Zurgu'] },
              { name: 'Bunkure Irrigation Basin', villages: ['Bono', 'Gafan', 'Kulluwa', 'Zangon Barebari'] }
            ]
          }
        ]
      },
      {
        name: 'Kaduna State',
        districts: [
          {
            name: 'Kaduna North (Zaria Maize Basin)',
            subDistricts: [
              { name: 'Zaria LGA', villages: ['Tudun Wada', 'Gyallesu', 'Dambo', 'Kufena', 'Wusasa'] },
              { name: 'Sabon Gari Grain Hub', villages: ['Basawa', 'Bomo', 'Jama\'a', 'Samaru'] },
              { name: 'Giwa Tomato Belt', villages: ['Shika', 'Gangara', 'Yakawada', 'Kidandan'] }
            ]
          }
        ]
      },
      {
        name: 'Oyo State',
        districts: [
          {
            name: 'Oyo North (Oke-Ogun Food Basket)',
            subDistricts: [
              { name: 'Iseyin LGA', villages: ['Ado-Awaye', 'Odo-Omu', 'Koso', 'Ladogan'] },
              { name: 'Saki West Grain Belt', villages: ['Ogboro', 'Sepeteri', 'Ago-Are', 'Irawo'] }
            ]
          }
        ]
      },
      {
        name: 'Benue State',
        districts: [
          {
            name: 'Benue North-East (Food Basket of the Nation)',
            subDistricts: [
              { name: 'Gboko Yam Hub', villages: ['Mkar', 'Yandev', 'Ipav', 'Mbayion', 'Tarka'] },
              { name: 'Katsina-Ala Cassava Belt', villages: ['Tor Donga', 'Abaji', 'Michihe', 'Gbishe'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Brazil',
    code: 'BR',
    flag: '🇧🇷',
    level1Name: 'State (Estado)',
    level2Name: 'Mesoregion / District',
    level3Name: 'Municipality (Município)',
    level4Name: 'District / Settlement (Vila/Distrito)',
    states: [
      {
        name: 'Mato Grosso',
        code: 'MT',
        districts: [
          {
            name: 'Norte Mato-Grossense (Soy Capital)',
            subDistricts: [
              { name: 'Sorriso', villages: ['Primavera do Norte', 'Boa Esperança', 'Caravagio'] },
              { name: 'Lucas do Rio Verde', villages: ['Groslândia', 'Itambé', 'São Cristóvão'] },
              { name: 'Nova Mutum', villages: ['Pontal do Araguaia', 'Ranchão', 'Santa Bárbara'] },
              { name: 'Sinop', villages: ['Alto da Glória', 'São Cristóvão', 'Primavera'] }
            ]
          },
          {
            name: 'Sudeste Mato-Grossense',
            subDistricts: [
              { name: 'Rondonópolis', villages: ['Boa Vista', 'Vila Paulista', 'Campo Limpo'] },
              { name: 'Primavera do Leste', villages: ['Paranatinga Road', 'Vila União'] }
            ]
          }
        ]
      },
      {
        name: 'São Paulo',
        code: 'SP',
        districts: [
          {
            name: 'Ribeirão Preto (Sugarcane Hub)',
            subDistricts: [
              { name: 'Ribeirão Preto', villages: ['Bonfim Paulista', 'Cruz das Posses', 'Jardim Paulista'] },
              { name: 'Sertãozinho', villages: ['Cruz das Posses', 'Vila Garcia', 'Jardim Alvorada'] },
              { name: 'Jaboticabal', villages: ['Córrego Rico', 'Lusitânia', 'Vila Nova'] }
            ]
          },
          {
            name: 'Campinas Citrus Region',
            subDistricts: [
              { name: 'Limeira', villages: ['Tatu', 'Nossa Senhora das Dores', 'Graminha'] },
              { name: 'Mogi Mirim', villages: ['Martim Francisco', 'Santa Cruz', 'Aterrado'] }
            ]
          }
        ]
      },
      {
        name: 'Paraná',
        code: 'PR',
        districts: [
          {
            name: 'Norte Central Paranaense',
            subDistricts: [
              { name: 'Londrina', villages: ['Warta', 'Guaravera', 'Paiquerê', 'São Luiz', 'Lerroville'] },
              { name: 'Maringá', villages: ['Floriano', 'Iguatemi', 'Mandaguaçu Rural'] }
            ]
          },
          {
            name: 'Oeste Paranaense',
            subDistricts: [
              { name: 'Cascavel', villages: ['Sede Alvorada', 'São João', 'Diamante', 'Espigão'] },
              { name: 'Toledo', villages: ['Dois Irmãos', 'Concórdia do Oeste', 'Vila Nova'] }
            ]
          }
        ]
      },
      {
        name: 'Rio Grande do Sul',
        code: 'RS',
        districts: [
          {
            name: 'Noroeste Rio-Grandense',
            subDistricts: [
              { name: 'Passo Fundo', villages: ['Bela Vista', 'Pulador', 'Bom Recreio'] },
              { name: 'Ijuí', villages: ['Alto da União', 'Mauá', 'Barreiro'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    flag: '🇬🇧',
    level1Name: 'Country / Region',
    level2Name: 'County',
    level3Name: 'District / Borough',
    level4Name: 'Town / Village / Parish',
    states: [
      {
        name: 'England',
        districts: [
          {
            name: 'Yorkshire',
            subDistricts: [
              { name: 'North Yorkshire Ag Plain', villages: ['Northallerton', 'Thirsk', 'Ripon', 'Malton', 'Pickering', 'Easingwold'] },
              { name: 'East Riding Arable Belt', villages: ['Beverley', 'Driffield', 'Pocklington', 'Market Weighton', 'Howden'] }
            ]
          },
          {
            name: 'Lincolnshire',
            subDistricts: [
              { name: 'The Fens (Veg Basket)', villages: ['Boston', 'Spalding', 'Holbeach', 'Long Sutton', 'Crowland', 'Donington'] },
              { name: 'Lincolnshire Wolds', villages: ['Louth', 'Horncastle', 'Alford', 'Market Rasen', 'Caistor'] }
            ]
          },
          {
            name: 'Norfolk',
            subDistricts: [
              { name: 'Breckland & Broads', villages: ['Dereham', 'Fakenham', 'Aylsham', 'Diss', 'Swaffham', 'Attleborough'] }
            ]
          },
          {
            name: 'Somerset',
            subDistricts: [
              { name: 'Somerset Levels (Dairy)', villages: ['Glastonbury', 'Street', 'Langport', 'Somerton', 'Cheddar', 'Wedmore'] }
            ]
          }
        ]
      },
      {
        name: 'Scotland',
        districts: [
          {
            name: 'Aberdeenshire (Beef & Barley)',
            subDistricts: [
              { name: 'Buchan & Formartine', villages: ['Inverurie', 'Turriff', 'Peterhead', 'Huntly', 'Ellon', 'Mintlaw'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    level1Name: 'Province / Territory',
    level2Name: 'County / Regional Municipality',
    level3Name: 'Township / Municipality',
    level4Name: 'Town / Community / Locality',
    states: [
      {
        name: 'Saskatchewan',
        code: 'SK',
        districts: [
          {
            name: 'Prairie Wheat Belt',
            subDistricts: [
              { name: 'Rural Municipality of Sherwood', villages: ['Regina Rural', 'Grand Coulee', 'Pense'] },
              { name: 'Rural Municipality of Corman Park', villages: ['Saskatoon Rural', 'Warman', 'Martensville', 'Osler', 'Langham'] },
              { name: 'Swift Current Ag Basin', villages: ['Swift Current', 'Shaunavon', 'Gull Lake', 'Herbert'] }
            ]
          }
        ]
      },
      {
        name: 'Ontario',
        code: 'ON',
        districts: [
          {
            name: 'Oxford County (Dairy Capital)',
            subDistricts: [
              { name: 'South-West Oxford', villages: ['Woodstock', 'Ingersoll', 'Tillsonburg', 'Norwich', 'Tavistock', 'Embro'] }
            ]
          },
          {
            name: 'Chatham-Kent (Produce Belt)',
            subDistricts: [
              { name: 'Lake Erie Ag Plains', villages: ['Chatham', 'Blenheim', 'Dresden', 'Ridgetown', 'Tilbury', 'Wallaceburg'] }
            ]
          },
          {
            name: 'Niagara Region (Fruit & Wine)',
            subDistricts: [
              { name: 'Greenbelt Basin', villages: ['Niagara-on-the-Lake', 'Grimsby', 'Lincoln', 'Pelham', 'Beamsville', 'Vineland'] }
            ]
          }
        ]
      },
      {
        name: 'Alberta',
        code: 'AB',
        districts: [
          {
            name: 'Lethbridge County (Irrigation Hub)',
            subDistricts: [
              { name: 'Southern Alberta Canola Corridor', villages: ['Lethbridge', 'Coaldale', 'Picture Butte', 'Taber', 'Nobleford', 'Barons'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Australia',
    code: 'AU',
    flag: '🇦🇺',
    level1Name: 'State / Territory',
    level2Name: 'Agricultural Region',
    level3Name: 'Local Govt Area (LGA) / Shire',
    level4Name: 'Town / Locality / Suburb',
    states: [
      {
        name: 'New South Wales',
        code: 'NSW',
        districts: [
          {
            name: 'Riverina (Food Bowl)',
            subDistricts: [
              { name: 'Griffith Citrus & Grape Hub', villages: ['Griffith', 'Yenda', 'Hanwood', 'Yoogali', 'Tharbogang', 'Bilbul'] },
              { name: 'Leeton Rice & Cotton Basin', villages: ['Leeton', 'Yanco', 'Wamoon', 'Murrami'] },
              { name: 'Wagga Wagga Wheat Zone', villages: ['Wagga Wagga', 'Coolamon', 'Junee', 'Uranquinty'] }
            ]
          },
          {
            name: 'Murray Valley',
            subDistricts: [
              { name: 'Albury-Deniliquin Pastoral', villages: ['Deniliquin', 'Finley', 'Tocumwal', 'Berrigan', 'Barooga'] }
            ]
          }
        ]
      },
      {
        name: 'Queensland',
        code: 'QLD',
        districts: [
          {
            name: 'Darling Downs (Grain & Cattle)',
            subDistricts: [
              { name: 'Toowoomba Ag Corridor', villages: ['Toowoomba', 'Dalby', 'Warwick', 'Pittsworth', 'Oakey', 'Clifton'] },
              { name: 'Lockyer Valley (Salad Bowl)', villages: ['Gatton', 'Laidley', 'Forest Hill', 'Plainland', 'Helidon'] }
            ]
          }
        ]
      },
      {
        name: 'Victoria',
        code: 'VIC',
        districts: [
          {
            name: 'Goulburn Valley (Fruit Capital)',
            subDistricts: [
              { name: 'Shepparton Orchard Basin', villages: ['Shepparton', 'Mooroopna', 'Tatura', 'Kyabram', 'Cobram', 'Numurkah'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    level1Name: 'Federal State (Bundesland)',
    level2Name: 'District (Landkreis)',
    level3Name: 'Municipality (Gemeinde / Verbandsgemeinde)',
    level4Name: 'Village / Town (Ortsteil / Stadt)',
    states: [
      {
        name: 'Bavaria (Bayern)',
        code: 'BY',
        districts: [
          {
            name: 'Landkreis Kelheim (Hallertau Hops)',
            subDistricts: [
              { name: 'Hallertau Hopfenland', villages: ['Mainburg', 'Abensberg', 'Siegenburg', 'Elsendorf', 'Aiglsbach'] }
            ]
          },
          {
            name: 'Landkreis Passau (Niederbayern Ag)',
            subDistricts: [
              { name: 'Rottal Ackerbau', villages: ['Vilshofen an der Donau', 'Pocking', 'Bad Füssing', 'Rotthalmünster'] }
            ]
          }
        ]
      },
      {
        name: 'Lower Saxony (Niedersachsen)',
        code: 'NI',
        districts: [
          {
            name: 'Landkreis Cloppenburg (Tierhaltung & Getreide)',
            subDistricts: [
              { name: 'Oldenburger Münsterland', villages: ['Cloppenburg', 'Friesoythe', 'Löningen', 'Garrel', 'Cappeln'] }
            ]
          },
          {
            name: 'Landkreis Stade (Altes Land Fruit)',
            subDistricts: [
              { name: 'Altes Land Obstbau', villages: ['Jork', 'Stade', 'Buxtehude', 'Hollern-Twielenfleth', 'Steinkirchen'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'France',
    code: 'FR',
    flag: '🇫🇷',
    level1Name: 'Region (Région)',
    level2Name: 'Department (Département)',
    level3Name: 'Arrondissement / Canton',
    level4Name: 'Commune / Village',
    states: [
      {
        name: 'Nouvelle-Aquitaine',
        districts: [
          {
            name: 'Gironde (Wine & Cereals)',
            subDistricts: [
              { name: 'Bordeaux Vignoble', villages: ['Saint-Émilion', 'Pauillac', 'Margaux', 'Langon', 'Blaye', 'Libourne'] }
            ]
          },
          {
            name: 'Lot-et-Garonne (Fruit & Veg)',
            subDistricts: [
              { name: 'Agenais Pruneau Basin', villages: ['Agen', 'Marmande', 'Villeneuve-sur-Lot', 'Nérac', 'Casteljaloux'] }
            ]
          }
        ]
      },
      {
        name: 'Occitanie',
        districts: [
          {
            name: 'Gers (Cereals, Duck, Garlic)',
            subDistricts: [
              { name: 'Armagnac Terroir', villages: ['Auch', 'Condom', 'Fleurance', 'Lectoure', 'Marciac', 'Vic-Fezensac'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Philippines',
    code: 'PH',
    flag: '🇵🇭',
    level1Name: 'Region',
    level2Name: 'Province',
    level3Name: 'Municipality / City',
    level4Name: 'Barangay / Village',
    states: [
      {
        name: 'Central Luzon (Region III)',
        districts: [
          {
            name: 'Nueva Ecija (Rice Granary of the Philippines)',
            subDistricts: [
              { name: 'Cabanatuan City Plain', villages: ['Magsaysay', 'Valdefuente', 'Sumacab', 'Camp Tinio', 'San Josef'] },
              { name: 'San Jose City Ag Hub', villages: ['Abar 1st', 'Caanawan', 'Kaliwanagan', 'Santo Niño 1st'] },
              { name: 'Gapan City Farmlands', villages: ['Bungo', 'San Lorenzo', 'San Vicente', 'Santa Cruz'] },
              { name: 'Guimba Rice Fields', villages: ['Bacayao', 'Cavite', 'Pacac', 'Triala'] }
            ]
          },
          {
            name: 'Pampanga',
            subDistricts: [
              { name: 'San Fernando Ag Valley', villages: ['Del Carmen', 'Dolores', 'San Nicolas', 'Sindalan'] },
              { name: 'Guagua Rice Basin', villages: ['Ascomo', 'Natividad', 'San Jose', 'San Matias'] }
            ]
          }
        ]
      },
      {
        name: 'Davao Region (Region XI)',
        districts: [
          {
            name: 'Davao del Norte (Banana Capital)',
            subDistricts: [
              { name: 'Tagum City Plantation Corridor', villages: ['Apokon', 'Canocotan', 'Madaum', 'San Agustin'] },
              { name: 'Panabo City Agri-Industrial', villages: ['Gredu', 'Maduao', 'San Pedro', 'Tibungao'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'South Africa',
    code: 'ZA',
    flag: '🇿🇦',
    level1Name: 'Province',
    level2Name: 'District Municipality',
    level3Name: 'Local Municipality',
    level4Name: 'Town / Village / Ward',
    states: [
      {
        name: 'Western Cape',
        districts: [
          {
            name: 'Cape Winelands',
            subDistricts: [
              { name: 'Stellenbosch Wine Basin', villages: ['Stellenbosch Central', 'Franschhoek', 'Pniel', 'Klapmuts'] },
              { name: 'Drakenstein Table Grapes', villages: ['Paarl', 'Wellington', 'Saron', 'Gouda'] }
            ]
          }
        ]
      },
      {
        name: 'Free State',
        districts: [
          {
            name: 'Fezile Dabi (Maize Triangle)',
            subDistricts: [
              { name: 'Moghaka Grain Hub', villages: ['Kroonstad', 'Viljoenskroon', 'Steynsrus'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Mexico',
    code: 'MX',
    flag: '🇲🇽',
    level1Name: 'State (Estado)',
    level2Name: 'Region / District',
    level3Name: 'Municipality (Municipio)',
    level4Name: 'Locality / Village (Localidad / Ejido)',
    states: [
      {
        name: 'Sinaloa (Vegetable & Tomato Capital)',
        districts: [
          {
            name: 'Valle de Culiacán',
            subDistricts: [
              { name: 'Culiacán Municipio', villages: ['Costa Rica', 'Eldorado', 'Quilá', 'El Diez', 'Culiacancito'] },
              { name: 'Navolato Ag Belt', villages: ['Villa Juárez', 'Bachimeto', 'La Palma', 'Altata'] }
            ]
          }
        ]
      },
      {
        name: 'Michoacán (Avocado Capital)',
        districts: [
          {
            name: 'Meseta Purépecha (Avocado Belt)',
            subDistricts: [
              { name: 'Uruapan Municipio', villages: ['Angahuan', 'Capacuaro', 'San Lorenzo', 'Caltzontzin'] },
              { name: 'Tancítaro Avocado Hub', villages: ['Apareo', 'Condémbaro', 'Zirimbo'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Indonesia',
    code: 'ID',
    flag: '🇮🇩',
    level1Name: 'Province (Provinsi)',
    level2Name: 'Regency / City (Kabupaten / Kota)',
    level3Name: 'District (Kecamatan)',
    level4Name: 'Village (Desa / Kelurahan)',
    states: [
      {
        name: 'East Java (Jawa Timur)',
        districts: [
          {
            name: 'Kabupaten Malang',
            subDistricts: [
              { name: 'Kecamatan Pujon (Apple & Dairy)', villages: ['Pandesari', 'Ngabab', 'Bendosari', 'Madiredo'] },
              { name: 'Kecamatan Poncokusumo (Horticulture)', villages: ['Gubugklakah', 'Padas', 'Wringinanom', 'Belung'] }
            ]
          },
          {
            name: 'Kabupaten Jember (Coffee & Tobacco)',
            subDistricts: [
              { name: 'Kecamatan Arjasa', villages: ['Kemuning Lor', 'Darsono', 'Biting', 'Candijati'] }
            ]
          }
        ]
      },
      {
        name: 'West Java (Jawa Barat)',
        districts: [
          {
            name: 'Kabupaten Cianjur (Rice & Tea)',
            subDistricts: [
              { name: 'Kecamatan Pacet (Vegetables)', villages: ['Cipendawa', 'Cibodas', 'Sukanagalih', 'Gadog'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Thailand',
    code: 'TH',
    flag: '🇹🇭',
    level1Name: 'Province (Changwat)',
    level2Name: 'District (Amphoe)',
    level3Name: 'Subdistrict (Tambon)',
    level4Name: 'Village (Muban)',
    states: [
      {
        name: 'Suphan Buri (Central Rice Plains)',
        districts: [
          {
            name: 'Amphoe Mueang Suphan Buri',
            subDistricts: [
              { name: 'Tambon Tha Rahat', villages: ['Muban 1', 'Muban 2', 'Muban 3', 'Muban 4'] },
              { name: 'Tambon Pho Phraya', villages: ['Muban Ban Pho', 'Muban Rim Khlong', 'Muban Don Pho'] }
            ]
          }
        ]
      },
      {
        name: 'Chiang Mai (Northern Fruit & Highland)',
        districts: [
          {
            name: 'Amphoe Fang (Orange & Tea)',
            subDistricts: [
              { name: 'Tambon Mon Pin', villages: ['Ban Yang', 'Ban Fang', 'Ban Doi Ang Khang'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Vietnam',
    code: 'VN',
    flag: '🇻🇳',
    level1Name: 'Province / Municipality (Tỉnh / Thành phố)',
    level2Name: 'District / Town (Huyện / Thị xã)',
    level3Name: 'Commune (Xã / Phường)',
    level4Name: 'Hamlet / Village (Ấp / Làng / Thôn)',
    states: [
      {
        name: 'Đồng Tháp (Mekong Rice Delta)',
        districts: [
          {
            name: 'Huyện Cao Lãnh',
            subDistricts: [
              { name: 'Xã Mỹ Xương (Mango)', villages: ['Ấp Mỹ Thạnh', 'Ấp Mỹ Hưng', 'Ấp Mỹ Tây'] },
              { name: 'Xã Bình Thạnh', villages: ['Ấp Bình Hưng', 'Ấp Bình Hòa'] }
            ]
          }
        ]
      },
      {
        name: 'Đắk Lắk (Central Highlands Coffee Capital)',
        districts: [
          {
            name: 'Thành phố Buôn Ma Thuột',
            subDistricts: [
              { name: 'Xã Hòa Thuận (Coffee Basin)', villages: ['Thôn 1', 'Thôn 2', 'Thôn 3', 'Buôn Ky'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Egypt',
    code: 'EG',
    flag: '🇪🇬',
    level1Name: 'Governorate (Muhafazah)',
    level2Name: 'Markaz / District',
    level3Name: 'Local Unit (Wahda Mahaliyya)',
    level4Name: 'Village (Qarya)',
    states: [
      {
        name: 'Al Buhayrah (Nile Delta Food Hub)',
        districts: [
          {
            name: 'Markaz Damanhur',
            subDistricts: [
              { name: 'Deshnes', villages: ['Afraha', 'Bani Hilal', 'Zawiyet Ghazal'] },
              { name: 'Shubra Khit Citrus Belt', villages: ['Mahallat Farnawi', 'Umm Hakim', 'Iryamun'] }
            ]
          }
        ]
      },
      {
        name: 'Faiyum (Oasis Agriculture)',
        districts: [
          {
            name: 'Markaz Ibshaway (Olives & Fruit)',
            subDistricts: [
              { name: 'Sanur Oasis Unit', villages: ['Nazla', 'Abu Kasah', 'Qasr Bayad'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Argentina',
    code: 'AR',
    flag: '🇦🇷',
    level1Name: 'Province (Provincia)',
    level2Name: 'Department (Departamento)',
    level3Name: 'Municipality / Commune (Municipio / Comuna)',
    level4Name: 'Locality / Settlement (Localidad / Paraje)',
    states: [
      {
        name: 'Buenos Aires (Pampa Húmeda Grain Belt)',
        districts: [
          {
            name: 'Partido de Pergamino (Seed Capital)',
            subDistricts: [
              { name: 'Pergamino Centro', villages: ['Acevedo', 'Manuel Ocampo', 'Mariano H. Alfonzo', 'Rancagua'] }
            ]
          },
          {
            name: 'Partido de Balcarce (Potato Capital)',
            subDistricts: [
              { name: 'Balcarce Rural', villages: ['San Agustín', 'Los Pinos', 'Napaleofú'] }
            ]
          }
        ]
      },
      {
        name: 'Mendoza (Wine & Olive Oasis)',
        districts: [
          {
            name: 'Luján de Cuyo (Malbec Cradle)',
            subDistricts: [
              { name: 'Valle de Uco Gateway', villages: ['Chacras de Coria', 'Vistalba', 'Las Compuertas', 'Agrelo', 'Ugarteche'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Japan',
    code: 'JP',
    flag: '🇯🇵',
    level1Name: 'Prefecture (Todōfuken)',
    level2Name: 'District / Subprefecture (Gun / Shichō)',
    level3Name: 'City / Town / Village (Shi / Chō / Son)',
    level4Name: 'District / Ward (Chōme / Aza)',
    states: [
      {
        name: 'Niigata Prefecture (Koshihikari Rice Heart)',
        districts: [
          {
            name: 'Uonuma District',
            subDistricts: [
              { name: 'Minamiuonuma Rice Valley', villages: ['Muikamachi', 'Shiozawa', 'Yamato', 'Muika'] }
            ]
          }
        ]
      },
      {
        name: 'Hokkaido (Dairy & Wheat Heartland)',
        districts: [
          {
            name: 'Tokachi Subprefecture',
            subDistricts: [
              { name: 'Obihiro Plain', villages: ['Otofuke', 'Memuro', 'Taiki', 'Shikaoi', 'Nakasatsunai'] }
            ]
          }
        ]
      }
    ]
  }
];

// Fallback dynamic terms for any custom/other country
export const DEFAULT_ADMIN_TERMS = {
  level1Name: 'State / Province / Region',
  level2Name: 'District / County / Area',
  level3Name: 'Sub-district / Township / Taluk',
  level4Name: 'Village / City / Locality'
};

/**
 * Get country metadata by name or code
 */
export function getCountryInfo(countryNameOrCode: string): CountryInfo | undefined {
  if (!countryNameOrCode) return undefined;
  const q = countryNameOrCode.trim().toLowerCase();
  return GLOBAL_COUNTRIES.find(
    c => c.name.toLowerCase() === q || c.code.toLowerCase() === q
  );
}

/**
 * Get administrative terms (Level 1-4 labels) for a given country
 */
export function getCountryAdminTerms(countryName: string) {
  const country = getCountryInfo(countryName);
  if (!country) return DEFAULT_ADMIN_TERMS;
  return {
    level1Name: country.level1Name,
    level2Name: country.level2Name,
    level3Name: country.level3Name,
    level4Name: country.level4Name
  };
}

/**
 * Get states for a country
 */
export function getStatesForCountry(countryName: string): StateHierarchy[] {
  const country = getCountryInfo(countryName);
  return country ? country.states : [];
}

/**
 * Get districts for a state in a country
 */
export function getDistrictsForState(countryName: string, stateName: string): DistrictHierarchy[] {
  const country = getCountryInfo(countryName);
  if (!country) return [];
  const state = country.states.find(s => s.name.toLowerCase() === stateName.toLowerCase());
  return state ? state.districts : [];
}

/**
 * Get sub-districts (taluks/counties/LGAs) for a district
 */
export function getSubDistrictsForDistrict(
  countryName: string,
  stateName: string,
  districtName: string
): SubDistrictHierarchy[] {
  const districts = getDistrictsForState(countryName, stateName);
  const district = districts.find(d => d.name.toLowerCase() === districtName.toLowerCase());
  return district ? district.subDistricts : [];
}

/**
 * Get villages/localities for a sub-district
 */
export function getVillagesForSubDistrict(
  countryName: string,
  stateName: string,
  districtName: string,
  subDistrictName: string
): string[] {
  const subDistricts = getSubDistrictsForDistrict(countryName, stateName, districtName);
  const sub = subDistricts.find(s => s.name.toLowerCase() === subDistrictName.toLowerCase());
  return sub ? sub.villages : [];
}

/**
 * Global Search across all levels in dataset (Fuzzy & Multi-field)
 */
export interface GlobalSearchResult {
  country: string;
  countryCode: string;
  flag: string;
  state: string;
  district?: string;
  subDistrict?: string;
  village?: string;
  formattedLabel: string;
  matchType: 'country' | 'state' | 'district' | 'subDistrict' | 'village';
}

export function searchGlobalLocations(query: string, limit: number = 25): GlobalSearchResult[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const results: GlobalSearchResult[] = [];

  for (const country of GLOBAL_COUNTRIES) {
    // 1. Country Match
    if (country.name.toLowerCase().includes(q)) {
      results.push({
        country: country.name,
        countryCode: country.code,
        flag: country.flag,
        state: country.states[0]?.name || '',
        formattedLabel: `${country.flag} ${country.name} (Country)`,
        matchType: 'country'
      });
    }

    for (const state of country.states) {
      // 2. State Match
      if (state.name.toLowerCase().includes(q)) {
        results.push({
          country: country.name,
          countryCode: country.code,
          flag: country.flag,
          state: state.name,
          formattedLabel: `${country.flag} ${state.name}, ${country.name}`,
          matchType: 'state'
        });
      }

      for (const district of state.districts) {
        // 3. District Match
        if (district.name.toLowerCase().includes(q)) {
          results.push({
            country: country.name,
            countryCode: country.code,
            flag: country.flag,
            state: state.name,
            district: district.name,
            formattedLabel: `📍 ${district.name}, ${state.name}, ${country.name}`,
            matchType: 'district'
          });
        }

        for (const sub of district.subDistricts) {
          // 4. Sub-district Match
          if (sub.name.toLowerCase().includes(q)) {
            results.push({
              country: country.name,
              countryCode: country.code,
              flag: country.flag,
              state: state.name,
              district: district.name,
              subDistrict: sub.name,
              formattedLabel: `🏛️ ${sub.name}, ${district.name}, ${state.name}`,
              matchType: 'subDistrict'
            });
          }

          for (const village of sub.villages) {
            // 5. Village Match
            if (village.toLowerCase().includes(q)) {
              results.push({
                country: country.name,
                countryCode: country.code,
                flag: country.flag,
                state: state.name,
                district: district.name,
                subDistrict: sub.name,
                village: village,
                formattedLabel: `🏡 ${village}, ${sub.name}, ${district.name}`,
                matchType: 'village'
              });
            }
          }
        }
      }
    }
  }

  // Deduplicate and slice
  const unique = Array.from(new Map(results.map(item => [item.formattedLabel, item])).values());
  return unique.slice(0, limit);
}
