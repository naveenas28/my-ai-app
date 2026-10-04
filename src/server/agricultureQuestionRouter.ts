/**
 * Central Agriculture Question Router for AgriVerse AI
 * 
 * Classifies questions across 15 agricultural categories, determines if live
 * data is required, extracts relevant entities (crop, location, district, mandi),
 * and routes to the appropriate data sources.
 */

export type AgricultureCategory =
  | 'WEATHER'
  | 'MANDI_PRICE'
  | 'CROP_ADVICE'
  | 'PEST_DISEASE'
  | 'SOIL'
  | 'IRRIGATION'
  | 'FERTILIZER'
  | 'CROP_CALENDAR'
  | 'GOVERNMENT_SCHEME'
  | 'LOAN'
  | 'INSURANCE'
  | 'SUBSIDY'
  | 'MARKET'
  | 'FARM_FINANCE'
  | 'GENERAL_AGRICULTURE';

export type PrimaryDataSource =
  | 'ENAM_MANDI'
  | 'OPEN_METEO_WEATHER'
  | 'GOV_SCHEMES'
  | 'ICAR_AGRONOMY'
  | 'LOCAL_STORE'
  | 'NONE';

export interface QuestionRoutingDecision {
  category: AgricultureCategory;
  requiresLiveData: boolean;
  primaryDataSource: PrimaryDataSource;
  extractedEntities: {
    crop?: string;
    district?: string;
    state?: string;
    mandi?: string;
    schemeName?: string;
  };
  reasoning: string;
}

// Multilingual crop mapping
const CROP_PATTERNS: Array<{ crop: string; regex: RegExp }> = [
  { crop: 'Tomato', regex: /\b(tomato|tomatoes|ಟೊಮೆಟೊ|टमाटर|தக்காளி|టమోటా)\b/i },
  { crop: 'Paddy', regex: /\b(paddy|rice|ಭತ್ತ|ಅಕ್ಕಿ|धान|चावल|நெல்|వరి)\b/i },
  { crop: 'Ragi', regex: /\b(ragi|finger millet|ರಾಗಿ|रागी|கேழ்வரகு|రాగి)\b/i },
  { crop: 'Onion', regex: /\b(onion|onions|ಈರುಳ್ಳಿ|प्याज|வெங்காயம்|ఉల్లిపాయ)\b/i },
  { crop: 'Chilli', regex: /\b(chilli|chili|chillies|green chilli|red chilli|ಮೆಣಸಿನಕಾಯಿ|मिर्च|மிளகாய்|మిరపకాయ)\b/i },
  { crop: 'Wheat', regex: /\b(wheat|ಗೋಧಿ|गेहूं|கோதுமை|గోధుమలు)\b/i },
  { crop: 'Cotton', regex: /\b(cotton|kapas|ಹತ್ತಿ|कपास|பருத்தி|ప్రత్తి)\b/i },
  { crop: 'Maize', regex: /\b(maize|corn|ಮೆಕ್ಕೆಜೋಳ|मक्का|மக்காச்சோளம்|మొక్కజొన్న)\b/i },
  { crop: 'Potato', regex: /\b(potato|potatoes|ಆಲೂಗಡ್ಡೆ|ಆಲೂ|आलू|உருளைக்கிழங்கு|బంగాళాదుంప)\b/i },
  { crop: 'Groundnut', regex: /\b(groundnut|peanut|peanuts|ಕಡಲೆಕಾಯಿ|ಶೇಂಗಾ|मूंगफली|வேர்க்கடலை|వేరుశనగ)\b/i },
  { crop: 'Sugarcane', regex: /\b(sugarcane|sugar cane|ಕಬ್ಬು|गन्ना|கரும்பு|చెరకు)\b/i },
  { crop: 'Mustard', regex: /\b(mustard|ಸಾಸಿವೆ|सरसों|கடுகு|ఆవాలు)\b/i },
  { crop: 'Soybean', regex: /\b(soybean|soya|ಸೋಯಾಬೀನ್|सोयाबीन)\b/i },
  { crop: 'Watermelon', regex: /\b(watermelon|water melon|ಕಲ್ಲಂಗಡಿ|तरबूज|தர்பூசணி|పుచ్చకಾಯ)\b/i },
  { crop: 'Red Gram', regex: /\b(red gram|tur dal|toor dal|tur|toor|arhar|pigeonpea|ತೊಗರಿ|तूर|अरहर)\b/i },
  { crop: 'Gram', regex: /\b(chickpea|bengal gram|chana|gram|ಕಡಲೆ|चना)\b/i }
];

// Well-known district and market patterns in India
const LOCATION_PATTERNS: Array<{ location: string; district: string; state: string; regex: RegExp }> = [
  { location: 'Chikkaballapura', district: 'Chikkaballapura', state: 'Karnataka', regex: /\b(chikkaballapura|chikkaballapur|chikballapur|ಚಿಕ್ಕಬಳ್ಳಾಪುರ|चिक्काबल्लापुर)\b/i },
  { location: 'Kolar', district: 'Kolar', state: 'Karnataka', regex: /\b(kolar|ಕೋಲಾರ|कोलार)\b/i },
  { location: 'Hubballi', district: 'Dharwad', state: 'Karnataka', regex: /\b(hubballi|hubli|ಹುಬ್ಬಳ್ಳಿ|हुबली)\b/i },
  { location: 'Ballari', district: 'Ballari', state: 'Karnataka', regex: /\b(ballari|bellary|ಬಳ್ಳಾರಿ|बेल्लारी)\b/i },
  { location: 'Raichur', district: 'Raichur', state: 'Karnataka', regex: /\b(raichur|ರಾಯಚೂರು|रायचूर)\b/i },
  { location: 'Bangalore', district: 'Bangalore Urban', state: 'Karnataka', regex: /\b(bangalore|bengaluru|ಬೆಂಗಳೂರು|बैंगलोर)\b/i },
  { location: 'Lasalgaon', district: 'Nashik', state: 'Maharashtra', regex: /\b(lasalgaon|लासलगाव)\b/i },
  { location: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', regex: /\b(guntur|గుంటూరు|गुंटूर)\b/i },
  { location: 'Rajkot', district: 'Rajkot', state: 'Gujarat', regex: /\b(rajkot|રાજકોટ|राजकोट)\b/i },
  { location: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', regex: /\b(jaipur|जयपुर)\b/i },
  { location: 'Warangal', district: 'Warangal', state: 'Telangana', regex: /\b(warangal|వరంగల్|वारंगल)\b/i },
  { location: 'Indore', district: 'Indore', state: 'Madhya Pradesh', regex: /\b(indore|इन्दौर|इंदौर)\b/i },
  { location: 'Agra', district: 'Agra', state: 'Uttar Pradesh', regex: /\b(agra|आगरा)\b/i },
  { location: 'Karnal', district: 'Karnal', state: 'Haryana', regex: /\b(karnal|करनाल)\b/i }
];

/**
 * Classifies an incoming agricultural question and extracts intent and entities.
 */
export function classifyAgricultureQuestion(
  message: string,
  userProfile?: { district?: string; state?: string; primaryCrops?: string[] }
): QuestionRoutingDecision {
  const text = (message || '').trim().toLowerCase();

  // Extract crop
  let detectedCrop: string | undefined;
  for (const { crop, regex } of CROP_PATTERNS) {
    if (regex.test(text)) {
      detectedCrop = crop;
      break;
    }
  }
  if (!detectedCrop && userProfile?.primaryCrops && userProfile.primaryCrops.length > 0) {
    // If user is asking a general question ("How much water does my crop need?"), check if they mention "crop"
    if (text.includes('crop') || text.includes('ಬೆಳೆ') || text.includes('फसल')) {
      detectedCrop = userProfile.primaryCrops[0];
    }
  }

  // Dynamic extraction for crop/commodity after "price of", "rate of", "bhav of"
  if (!detectedCrop) {
    const cropMatch = text.match(/\b(?:price|rate|bhav|daam|cost)\s+of\s+([a-zA-Z\s]+?)(?:\s+(?:in|at|apmc|mandi|market|yard|\?|$)|$)/i);
    if (cropMatch && cropMatch[1]) {
      const cand = cropMatch[1].trim();
      if (cand.length > 2 && !['what', 'the', 'my', 'current', 'today'].includes(cand.toLowerCase())) {
        detectedCrop = cand.charAt(0).toUpperCase() + cand.slice(1);
      }
    }
  }

  // Extract location
  let detectedDistrict: string | undefined;
  let detectedState: string | undefined;
  for (const { district, state, regex } of LOCATION_PATTERNS) {
    if (regex.test(text)) {
      detectedDistrict = district;
      detectedState = state;
      break;
    }
  }
  if (!detectedDistrict && userProfile?.district) {
    detectedDistrict = userProfile.district;
    detectedState = userProfile.state || 'Karnataka';
  }

  // Dynamic extraction for location if not in LOCATION_PATTERNS
  if (!detectedDistrict) {
    const apmcMatch = text.match(/\b([a-zA-Z\s]+?)\s+(?:apmc|mandi|market|yard)\b/i);
    if (apmcMatch && apmcMatch[1]) {
      const cand = apmcMatch[1].trim();
      if (cand.length > 2 && !['what', 'the', 'my', 'current', 'today', 'price of'].includes(cand.toLowerCase())) {
        detectedDistrict = cand.replace(/^(price of|rate of|in|at)s+/i, '').trim();
      }
    } else {
      const inMatch = text.match(/\b(?:in|at|near)\s+([a-zA-Z\s]+?)(?:\s+(?:apmc|mandi|market|yard|\?|$)|$)/i);
      if (inMatch && inMatch[1]) {
        const cand = inMatch[1].trim();
        if (cand.length > 2 && !['what', 'the', 'my', 'current', 'today'].includes(cand.toLowerCase())) {
          detectedDistrict = cand;
        }
      }
    }
  }

  // 1. Weather Questions
  if (
    /\b(weather|forecast|rain|raining|rainfall|temperature|humidity|wind|thunderstorm|climate|ಹವಾಮಾನ|ಮಳೆ|ತಾಪಮಾನ|मौसम|बारिश|बरसात|हवा|வானிலை|மழை|వాతావరణం|వర్షం)\b/i.test(text) ||
    (text.includes('will it rain') || text.includes('rain tomorrow') || text.includes('today\'s weather') || text.includes('rain today'))
  ) {
    return {
      category: 'WEATHER',
      requiresLiveData: true,
      primaryDataSource: 'OPEN_METEO_WEATHER',
      extractedEntities: {
        district: detectedDistrict || 'Chikkaballapura',
        state: detectedState || 'Karnataka',
        crop: detectedCrop
      },
      reasoning: 'Question asks for current meteorological conditions, rain forecast, or weather alerts.'
    };
  }

  // 2. Government Scheme, Loan, Subsidy, Insurance Questions (Prioritized before Mandi to avoid "interest rate" false positive)
  if (
    /\b(scheme|yojana|pm-kisan|pmkisan|kisan samman|subsidies|subsidy|dbt|grant|kcc|kisan credit|crop loan|loan|bima|pmfby|crop insurance|insurance|smam|pmksy|fasal bima|interest subvention|subvention|ಯೋಜನೆ|ಸಬ್ಸಿಡಿ|ವಿಮೆ|ಸಾಲ|योजना|सब्सिडी|बीमा|ऋण|திட்டம்|పథకం)\b/i.test(text)
  ) {
    let subCategory: AgricultureCategory = 'GOVERNMENT_SCHEME';
    if (/\b(loan|credit|kcc|interest subvention|ಸಾಲ|ऋण|ಅಪ್ಲೈ ಸಾಲ)\b/i.test(text)) subCategory = 'LOAN';
    else if (/\b(insurance|bima|pmfby|fasal bima|ವಿಮೆ|बीमा)\b/i.test(text)) subCategory = 'INSURANCE';
    else if (/\b(subsidy|subsidies|tractor subsidy|drip subsidy|ಸಬ್ಸಿಡಿ|सब्सिडी)\b/i.test(text)) subCategory = 'SUBSIDY';

    return {
      category: subCategory,
      requiresLiveData: true,
      primaryDataSource: 'GOV_SCHEMES',
      extractedEntities: {
        district: detectedDistrict,
        state: detectedState,
        crop: detectedCrop,
        schemeName: text.includes('pm-kisan') ? 'PM-KISAN' : text.includes('pmfby') ? 'PMFBY' : text.includes('kcc') ? 'KCC' : undefined
      },
      reasoning: 'Question pertains to verified Government of India or State agriculture schemes, subsidies, or institutional credit.'
    };
  }

  // 3. Mandi Price Questions
  if (
    !text.includes('kcc') &&
    !text.includes('subvention') &&
    !text.includes('interest') &&
    !text.includes('seed rate') &&
    !text.includes('sowing rate') &&
    !text.includes('spacing') &&
    (/\b(mandi|bhav|market price|apmc|daam|cost per quintal|modal price|arrival|ಬೆಲೆ|ಮಾರುಕಟ್ಟೆ|ದರ|ಭಾವ|ದರಗಳು|भाव|दाम|दर|मंडी|விலை|ధర)\b/i.test(text) ||
     (/\b(rate|price)\b/i.test(text) && !text.includes('interest')) ||
     ((text.includes('how much') || text.includes('what is')) && (detectedCrop && (text.includes('price') || text.includes('rate') || text.includes('bhav')))))
  ) {
    return {
      category: 'MANDI_PRICE',
      requiresLiveData: true,
      primaryDataSource: 'ENAM_MANDI',
      extractedEntities: {
        crop: detectedCrop || 'Tomato',
        district: detectedDistrict || 'Chikkaballapura',
        state: detectedState || 'Karnataka'
      },
      reasoning: 'Question requests commodity wholesale/auction prices or market arrivals at APMC yards.'
    };
  }

  // 4. Irrigation Questions
  if (
    /\b(irrigate|irrigation|water|watering|drip|sprinkler|moisture|flood|water requirement|ಹನಿ ನೀರಾವರಿ|ನೀರಾವರಿ|ನೀರು|ಸಿಂಚಾಯಿ|सिंचाई|पानी|சொட்டு நீர்|నీటిపారుదల)\b/i.test(text)
  ) {
    return {
      category: 'IRRIGATION',
      requiresLiveData: true, // Needs weather check for rain warnings + agronomy
      primaryDataSource: 'OPEN_METEO_WEATHER',
      extractedEntities: {
        crop: detectedCrop || 'Tomato',
        district: detectedDistrict || 'Chikkaballapura',
        state: detectedState || 'Karnataka'
      },
      reasoning: 'Question asks about water schedule or irrigation management, cross-referenced with weather rain probability.'
    };
  }

  // 5. Fertilizer & Nutrient Questions
  if (
    /\b(fertilizer|fertilizers|urea|dap|mop|npk|potash|nitrogen|phosphorus|manure|compost|bio-fertilizer|dosage|dose|rdf|ಗೊಬ್ಬರ|ರಸಗೊಬ್ಬರ|ಖಾದ್|खाद|उर्वरक|உரம்|ఎరువులు)\b/i.test(text)
  ) {
    return {
      category: 'FERTILIZER',
      requiresLiveData: false,
      primaryDataSource: 'ICAR_AGRONOMY',
      extractedEntities: {
        crop: detectedCrop || 'Tomato',
        district: detectedDistrict,
        state: detectedState
      },
      reasoning: 'Question requests fertilizer recommendations, NPK calculation, or organic manure application schedule.'
    };
  }

  // 6. Pest & Disease Diagnosis Questions
  if (
    /\b(pest|pests|disease|diseases|yellow|yellowing|yellow leaves|leaf spot|blight|fungus|fungal|wilt|wilting|insect|borer|worm|caterpillar|spray|pesticide|fungicide|rotten|rot|virus|ಹುಳು|ಕೀಟ|ರೋಗ|ಹಳದಿ|ಕಪ್ಪು ಚುಕ್ಕೆ|ಕೀಟನಾಶಕ|कीट|रोग|पीले पत्ते|फफूंद|छिड़काव|பூச்சி|పురుగు)\b/i.test(text)
  ) {
    return {
      category: 'PEST_DISEASE',
      requiresLiveData: false,
      primaryDataSource: 'ICAR_AGRONOMY',
      extractedEntities: {
        crop: detectedCrop || 'Tomato',
        district: detectedDistrict,
        state: detectedState
      },
      reasoning: 'Question reports crop leaf symptoms, pest infestation, or plant pathology concerns requiring IPM advice.'
    };
  }

  // 7. Soil Health Questions
  if (
    /\b(soil|soil test|soil health|red soil|black soil|sandy|clay|loam|ph|alkaline|acidic|ಮಣ್ಣು|ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ|ಮಣ್ಣಿನ ಆರೋಗ್ಯ|मिट्टी|मृदा|மண்|నేల)\b/i.test(text)
  ) {
    return {
      category: 'SOIL',
      requiresLiveData: false,
      primaryDataSource: 'ICAR_AGRONOMY',
      extractedEntities: {
        district: detectedDistrict,
        state: detectedState
      },
      reasoning: 'Question asks about soil classification, pH balance, or fertility enhancement.'
    };
  }

  // 8. Crop Calendar & Sowing Window
  if (
    /\b(sowing|sow|season|planting|harvest|harvesting|calendar|when to plant|best time to grow|sowing time|month to sow|ಬಿತ್ತನೆ|ಕೊಯ್ಲು|ಋತು|ಬುದ್ದಿ|बुवाई|कटाई|सीजन|பயிர் பருவம்|విత్తే సమయం)\b/i.test(text)
  ) {
    return {
      category: 'CROP_CALENDAR',
      requiresLiveData: false,
      primaryDataSource: 'ICAR_AGRONOMY',
      extractedEntities: {
        crop: detectedCrop || 'Tomato',
        district: detectedDistrict,
        state: detectedState
      },
      reasoning: 'Question seeks agronomic calendar, optimal sowing period, or harvest maturity timelines.'
    };
  }

  // 9. Farm Finance & Economics
  if (
    !text.includes('zero budget') &&
    !text.includes('zbnf') &&
    !text.includes('jeevamrutha') &&
    /\b(budget|finance|cost of cultivation|input cost|profit|income per acre|economics|expense|ವ್ಯಯ|ಆದಾಯ|ಲಾಭ|खर्च|कमाई|बजट|வருமானம்|ఆదాయం)\b/i.test(text)
  ) {
    return {
      category: 'FARM_FINANCE',
      requiresLiveData: false,
      primaryDataSource: 'ICAR_AGRONOMY',
      extractedEntities: {
        crop: detectedCrop || 'Tomato',
        district: detectedDistrict,
        state: detectedState
      },
      reasoning: 'Question inquires about farm expenditure, yield economics, or profit projections.'
    };
  }

  // 10. General Market & Trading
  if (
    /\b(market|wholesale|buyer|buyers|trade|enam|selling crop|where to sell|ಮಾರುಕಟ್ಟೆ|ಬಜಾರ್|बाजार|मंडी व्यापार|விற்பனை|మార్కెట్)\b/i.test(text)
  ) {
    return {
      category: 'MARKET',
      requiresLiveData: true,
      primaryDataSource: 'ENAM_MANDI',
      extractedEntities: {
        crop: detectedCrop,
        district: detectedDistrict,
        state: detectedState
      },
      reasoning: 'Question concerns agricultural trading, wholesale market connections, or produce disposal.'
    };
  }

  // 11. General Crop Advice or Default
  if (detectedCrop) {
    return {
      category: 'CROP_ADVICE',
      requiresLiveData: false,
      primaryDataSource: 'ICAR_AGRONOMY',
      extractedEntities: {
        crop: detectedCrop,
        district: detectedDistrict,
        state: detectedState
      },
      reasoning: 'Question is specific to a crop variety, agronomic practices, or cultivation technique.'
    };
  }

  return {
    category: 'GENERAL_AGRICULTURE',
    requiresLiveData: false,
    primaryDataSource: 'NONE',
    extractedEntities: {
      district: detectedDistrict,
      state: detectedState
    },
    reasoning: 'General agricultural advisory question.'
  };
}
