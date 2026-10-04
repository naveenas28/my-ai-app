/**
 * Agriculture Knowledge Provider
 * 
 * Authoritative ICAR (Indian Council of Agricultural Research) & 
 * State Agricultural Universities (SAUs) agronomy guidelines and IPM packages of practice.
 * 
 * Used for agricultural reasoning, diagnostic symptoms, organic remedies,
 * fertilizer dosage schedules, and crop management.
 */

export interface CropAgronomyGuidance {
  crop: string;
  scientificName?: string;
  criticalStages: string[];
  recommendedDoseNpkPerAcre: { n: number; p: number; k: number };
  irrigationGuide: string;
  majorPestsDiseases: Array<{
    name: string;
    symptoms: string;
    organicControl: string;
    chemicalControl: string;
    caution?: string;
  }>;
}

export const ICAR_AGRICULTURE_KNOWLEDGE: Record<string, CropAgronomyGuidance> = {
  paddy: {
    crop: 'Paddy / Rice',
    scientificName: 'Oryza sativa',
    criticalStages: ['Active Tillering', 'Panicle Initiation', 'Flowering / Booting', 'Grain Filling / Dough'],
    recommendedDoseNpkPerAcre: { n: 40, p: 20, k: 20 },
    irrigationGuide: 'Maintain shallow standing water (2-3 cm) during tillering and panicle development. Drain field 7-10 days before harvest.',
    majorPestsDiseases: [
      {
        name: 'Zinc Deficiency (Khaira Disease)',
        symptoms: 'Bronze, rust, or reddish-brown chlorotic spots appearing on third and lower leaves 2-3 weeks after transplanting. Leaves turn brittle and roots turn dark brown/stunted.',
        organicControl: 'Apply well-decomposed FYM/compost enriched with Zinc, or green manure (Sesbania/Dhaincha) in puddle field.',
        chemicalControl: 'Foliar spray: 5 kg Zinc Sulphate (21% Zn) + 2.5 kg Slaked Lime per hectare in 500L water (25g ZnSO4 + 12.5g Lime per 10L knapsack sprayer). Apply 2 sprays 10 days apart.',
        caution: 'Never mix Zinc Sulphate directly with DAP, SSP or other phosphatic fertilizers, as insoluble zinc phosphate will precipitate.'
      },
      {
        name: 'Brown Plant Hopper (BPH)',
        symptoms: 'Hopper burn — circular patches of drying and browning plants at tillering/milking stage.',
        organicControl: 'Alternate wetting and drying (AWD) irrigation; avoid excessive nitrogen. Spray Neem oil (10,000 ppm) @ 3ml/L.',
        chemicalControl: 'Triflumezopyrim 10% SC @ 0.5 ml/L or Pymetrozine 50% WG @ 0.6 g/L aimed at the plant base.'
      }
    ]
  },
  wheat: {
    crop: 'Wheat',
    scientificName: 'Triticum aestivum',
    criticalStages: ['Crown Root Initiation (CRI - 20-25 DAS)', 'Tillering (40-45 DAS)', 'Late Jointing (60-65 DAS)', 'Flowering (80-85 DAS)', 'Milking (100-105 DAS)', 'Dough Stage (115-120 DAS)'],
    recommendedDoseNpkPerAcre: { n: 48, p: 24, k: 16 },
    irrigationGuide: 'First and most critical irrigation at Crown Root Initiation (CRI) 20-25 days after sowing. Missing CRI irrigation causes 30-40% yield loss and root stuntedness.',
    majorPestsDiseases: [
      {
        name: 'Yellow Rust / Stripe Rust',
        symptoms: 'Yellow pustules arranged in linear stripes on upper leaf surface, yellow powdery dust on contact.',
        organicControl: 'Grow resistant varieties like HD-2967, PBW-550. Early morning inspection.',
        chemicalControl: 'Propiconazole 25% EC (Tilt) @ 1 ml per liter of water at first appearance of stripes.'
      }
    ]
  },
  cotton: {
    crop: 'Cotton',
    scientificName: 'Gossypium hirsutum',
    criticalStages: ['Square Formation', 'Peak Flowering', 'Boll Development'],
    recommendedDoseNpkPerAcre: { n: 36, p: 18, k: 18 },
    irrigationGuide: 'Avoid waterlogging at all costs in black cotton soils. Provide light irrigation during peak flowering and boll opening.',
    majorPestsDiseases: [
      {
        name: 'Cotton Leaf Reddening (Lal Rog)',
        symptoms: 'Leaves turning deep red/bronze starting from margins and spreading inward during peak boll load. Caused by Magnesium and Nitrogen deficiency exacerbated by sudden cold night temperatures below 15°C.',
        organicControl: 'Improve soil aeration and drainage. Spray liquid seaweed extract or vermiwash @ 10ml/L.',
        chemicalControl: 'Foliar spray: Magnesium Sulphate (MgSO4) @ 10g/L + Urea @ 10g/L of water. Alternatively spray 19:19:19 water-soluble fertilizer @ 5g/L. Apply 2 sprays at 10-12 day interval.',
        caution: 'Spray in early morning before 9 AM or late afternoon after 4 PM to avoid scorch.'
      },
      {
        name: 'Pink Bollworm (PBW)',
        symptoms: 'Rosetted flowers, double seeds inside open bolls, entry holes plugged with frass.',
        organicControl: 'Install Pheromone traps @ 5 per acre with Gossyplure septa. Release Trichogramma parasitoids.',
        chemicalControl: 'Emamectin Benzoate 5% SG @ 0.5 g/L or Chlorantraniliprole 18.5% SC @ 0.3 ml/L during early square/boll stage.'
      }
    ]
  },
  watermelon: {
    crop: 'Watermelon',
    scientificName: 'Citrullus lanatus',
    criticalStages: ['Vine Extension', 'Flowering / Fruit Set', 'Fruit Sizing'],
    recommendedDoseNpkPerAcre: { n: 32, p: 20, k: 32 },
    irrigationGuide: 'Use drip irrigation. Avoid overhead sprinklers which keep leaves wet and trigger fungal outbreaks.',
    majorPestsDiseases: [
      {
        name: 'Powdery Mildew (Podosphaera xanthii)',
        symptoms: 'White powdery talc-like fungal patches appearing on upper and lower surfaces of watermelon leaves, causing chlorosis, leaf curl, and premature defoliation.',
        organicControl: '1. Potassium Bicarbonate or Sodium Bicarbonate spray: 5g bicarbonate + 3ml horticultural/neem oil per liter water. 2. Wettable Sulphur (80% WP) @ 2-3g/L. 3. Neem Seed Kernel Extract (NSKE 5%) or Neem Oil (10,000 ppm) @ 5ml/L.',
        chemicalControl: 'Difenoconazole 25% EC @ 0.5 ml/L or Azoxystrobin 23% SC @ 1 ml/L as protective spray.',
        caution: 'Do not spray sulphur when daytime temperatures exceed 35°C to avoid cucurbit foliage scorch.'
      }
    ]
  },
  soybean: {
    crop: 'Soybean',
    scientificName: 'Glycine max',
    criticalStages: ['Flowering', 'Pod Development', 'Harvest Ripening'],
    recommendedDoseNpkPerAcre: { n: 12, p: 32, k: 16 },
    irrigationGuide: 'Sensitive to drought at flowering and pod filling. Ensure moisture during pod development.',
    majorPestsDiseases: [
      {
        name: 'Harvest Management with Combine Harvester',
        symptoms: 'Optimal moisture for harvesting is 13% to 15%. If harvested below 12% moisture, high pod shattering loss occurs. If harvested above 16% moisture, mechanical bruising and mould occur.',
        organicControl: 'Timely harvesting when 95% of pods turn golden brown and leaves have shed naturally.',
        chemicalControl: 'Harvester Settings: Cylinder speed 400-500 RPM, cutter bar within 5 cm of ground, reel speed synchronized 1.25x forward speed.',
        caution: 'Avoid harvesting during mid-day heat when dried pods are brittle and shatter upon contact.'
      }
    ]
  },
  tomato: {
    crop: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    criticalStages: ['Transplant Establishment (0-10 DAS)', 'Vegetative Flowering', 'Fruit Development'],
    recommendedDoseNpkPerAcre: { n: 40, p: 40, k: 30 },
    irrigationGuide: 'Maintain 60-70% available root-zone moisture with 25-30 minute morning drip cycles every 2-3 days.',
    majorPestsDiseases: [
      {
        name: 'Early Blight (Alternaria solani)',
        symptoms: 'Concentric target-board brown circular spots surrounded by yellow chlorotic halo on older lower leaves.',
        organicControl: 'Spray cold-pressed Neem seed oil (5ml/L) or Trichoderma harzianum @ 5g/L. Prune infected lower leaves.',
        chemicalControl: 'Mancozeb 75% WP @ 2g/L or Copper Oxychloride 50% WP @ 3g/L at first appearance of spots.',
        caution: 'Consult local agricultural extension officer before using systemic fungicides.'
      }
    ]
  },
  ragi: {
    crop: 'Finger Millet (Ragi)',
    scientificName: 'Eleusine coracana',
    criticalStages: ['Tillering', 'Panicle Emergence', 'Grain Hardening'],
    recommendedDoseNpkPerAcre: { n: 24, p: 16, k: 12 },
    irrigationGuide: 'Primarily rainfed in red sandy loams. Provide protective irrigation at tillering and flowering if monsoon breaks.',
    majorPestsDiseases: [
      {
        name: 'Ragi Blast (Pyricularia grisea)',
        symptoms: 'Spindle-shaped lesions on leaves and neck blast causing chaffy grains.',
        organicControl: 'Seed treatment with Trichoderma viride @ 5g/kg seed. Grow resistant varieties like GPU-28, ML-365.',
        chemicalControl: 'Kitazin 48% EC @ 1 ml/L or Tricyclazole 75% WP @ 0.6 g/L.'
      }
    ]
  },
  redgram: {
    crop: 'Red Gram / Pigeonpea (Tur Dal)',
    scientificName: 'Cajanus cajan',
    criticalStages: ['Vegetative Branching (30-40 DAS)', 'Flowering & Pod Initiation (70-90 DAS)', 'Pod Development'],
    recommendedDoseNpkPerAcre: { n: 10, p: 20, k: 10 },
    irrigationGuide: 'Deep-rooted drought-hardy crop. Protect from waterlogging. Two critical irrigations: flower initiation and pod filling stage.',
    majorPestsDiseases: [
      {
        name: 'Spacing and Seed Rate Guidelines',
        symptoms: 'Optimal Plant Spacing: 90 cm to 120 cm row-to-row x 20 cm to 30 cm plant-to-plant (or 150 cm x 30 cm for long-duration branching varieties). Seed Rate: 4 to 5 kg/acre (10-12 kg/ha) for pure sole crop; 2 to 3 kg/acre for intercropping (e.g. Red Gram + Groundnut 1:5 ratio).',
        organicControl: 'Seed treatment with Rhizobium culture (200g/acre) + Phosphobacteria (200g/acre) to fix atmospheric nitrogen and solubilize soil phosphorus.',
        chemicalControl: 'Seed dressing with Carbendazim 50% WP @ 2g/kg seed or Trichoderma viride @ 4g/kg seed before sowing.'
      },
      {
        name: 'Gram Pod Borer (Helicoverpa armigera)',
        symptoms: 'Defoliation of tender leaves, bored holes in flower buds and green pods with head inserted inside.',
        organicControl: 'Install Helicoverpa pheromone traps @ 5/acre. Spray HaNPV (250 LE/acre) or Neem oil (10,000 ppm) @ 3ml/L.',
        chemicalControl: 'Chlorantraniliprole 18.5% SC @ 0.3 ml/L or Indoxacarb 14.5% SC @ 1 ml/L of water.'
      }
    ]
  },
  maize: {
    crop: 'Maize / Corn',
    scientificName: 'Zea mays',
    criticalStages: ['Knee-High Stage (30-35 DAS)', 'Tasseling & Silking Stage (50-60 DAS)', 'Grain Filling / Dough Stage (75-85 DAS)'],
    recommendedDoseNpkPerAcre: { n: 48, p: 24, k: 16 },
    irrigationGuide: 'Tasseling and silking are the most moisture-sensitive stages. Even a 2-day drought during silking causes severe pollination failure and barren cobs. Ensure soil moisture is 60-70% field capacity.',
    majorPestsDiseases: [
      {
        name: 'Fall Armyworm (FAW - Spodoptera frugiperda)',
        symptoms: 'Elongated pinholes and windowing of leaf lamina, ragged chewed leaves, and heavy yellowish sawdust-like frass inside the central plant whorl.',
        organicControl: 'Apply dry sand/wood ash mixed with lime (9:1 ratio) inside whorls. Spray bio-pesticide Metarhizium rileyi or Beauveria bassiana @ 5g/L.',
        chemicalControl: 'Apply Emamectin Benzoate 5% SG @ 0.4 g/L or Spinetoram 11.7% SC @ 0.5 ml/L directed into the central whorl with knapsack sprayer.'
      }
    ]
  },
  onion: {
    crop: 'Onion',
    scientificName: 'Allium cepa',
    criticalStages: ['Bulb Formation', 'Bulb Enlargement', 'Maturity / Neck Fall'],
    recommendedDoseNpkPerAcre: { n: 40, p: 20, k: 25 },
    irrigationGuide: 'Stop irrigation 10-15 days before harvest to prevent bulb rot in storage and promote neck drying.',
    majorPestsDiseases: [
      {
        name: 'Post-Harvest Storage Management',
        symptoms: 'Bulb rotting, sprouting, and black mould (Aspergillus niger) in post-harvest onion storage.',
        organicControl: 'Field cure harvested bulbs with foliage under shade for 10-15 days until tops dry. Trim foliage leaving 2.5 to 3 cm neck. Store in bottom-ventilated racks (chawl) with 65-70% RH and 25-30°C temperature.',
        chemicalControl: 'Foliar spray with Carbendazim 50% WP @ 1g/L 15 days prior to harvest prevents latent fungal infection during storage.'
      }
    ]
  }
};

/**
 * Look up agronomy knowledge by crop name or query terms
 */
export function lookupCropAgronomy(cropName: string): CropAgronomyGuidance | null {
  const norm = cropName.toLowerCase().trim();
  if (norm.includes('paddy') || norm.includes('rice')) return ICAR_AGRICULTURE_KNOWLEDGE.paddy;
  if (norm.includes('wheat')) return ICAR_AGRICULTURE_KNOWLEDGE.wheat;
  if (norm.includes('cotton')) return ICAR_AGRICULTURE_KNOWLEDGE.cotton;
  if (norm.includes('watermelon')) return ICAR_AGRICULTURE_KNOWLEDGE.watermelon;
  if (norm.includes('soybean') || norm.includes('soya')) return ICAR_AGRICULTURE_KNOWLEDGE.soybean;
  if (norm.includes('tomato')) return ICAR_AGRICULTURE_KNOWLEDGE.tomato;
  if (norm.includes('ragi') || norm.includes('millet')) return ICAR_AGRICULTURE_KNOWLEDGE.ragi;
  if (norm.includes('red gram') || norm.includes('tur') || norm.includes('toor') || norm.includes('arhar') || norm.includes('pigeonpea')) return ICAR_AGRICULTURE_KNOWLEDGE.redgram;
  if (norm.includes('maize') || norm.includes('corn')) return ICAR_AGRICULTURE_KNOWLEDGE.maize;
  if (norm.includes('onion')) return ICAR_AGRICULTURE_KNOWLEDGE.onion;
  return null;
}
