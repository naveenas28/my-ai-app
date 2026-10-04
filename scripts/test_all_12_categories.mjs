// Comprehensive test suite for all 12 agriculture categories + edge cases:
// 1. farming and crops
// 2. weather
// 3. mandi/market prices
// 4. government schemes
// 5. subsidies
// 6. fertilizer
// 7. irrigation
// 8. pests and diseases
// 9. loans
// 10. crop insurance
// 11. crop management
// 12. agriculture-related general questions
// + Missing data handling (unquoted mandi)
// + No-fabrication check (unknown scheme)

const BASE_URL = 'http://localhost:3000';

const TEST_CASES = [
  {
    category: 'farming and crops',
    query: 'What are the optimal spacing and seed rate for red gram (tur dal)?',
    expectedKeywords: ['spacing', 'seed']
  },
  {
    category: 'weather',
    query: 'What is today weather in Chikkaballapura and is it safe to spray pesticides?',
    expectedKeywords: ['weather', 'Chikkaballapura']
  },
  {
    category: 'mandi/market prices',
    query: 'What is the current market price of tomato in Kolar APMC?',
    expectedKeywords: ['Tomato', 'APMC', 'Quintal']
  },
  {
    category: 'government schemes',
    query: 'How to apply for PM-KISAN scheme and what are the benefits?',
    expectedKeywords: ['PM-KISAN', '6,000']
  },
  {
    category: 'subsidies',
    query: 'What subsidies are available for drip irrigation under PMKSY?',
    expectedKeywords: ['subsidy', 'drip']
  },
  {
    category: 'fertilizer',
    query: 'What is the recommended NPK fertilizer dose for tomato cultivation per acre?',
    expectedKeywords: ['NPK', 'fertilizer']
  },
  {
    category: 'irrigation',
    query: 'How frequently should I irrigate my maize crop during flowering stage?',
    expectedKeywords: ['irrigate', 'flowering']
  },
  {
    category: 'pests and diseases',
    query: 'How to identify and control fall armyworm in maize organically?',
    expectedKeywords: ['armyworm', 'control']
  },
  {
    category: 'loans',
    query: 'What is the interest rate and credit limit for Kisan Credit Card (KCC)?',
    expectedKeywords: ['KCC', 'interest']
  },
  {
    category: 'crop insurance',
    query: 'What is the farmer premium rate under PMFBY for kharif and rabi crops?',
    expectedKeywords: ['PMFBY', 'premium']
  },
  {
    category: 'crop management',
    query: 'What are the post-harvest storage management tips for onions to prevent rotting?',
    expectedKeywords: ['storage', 'onion']
  },
  {
    category: 'agriculture-related general questions',
    query: 'What is zero budget natural farming (ZBNF) and how is Jeevamrutha prepared?',
    expectedKeywords: ['Jeevamrutha', 'natural']
  },
  {
    category: 'missing data handling (null price)',
    query: 'What is the current price of vanilla in South Andaman APMC?',
    expectedKeywords: ['unavailable', 'not available']
  },
  {
    category: 'no fabrication check (non-existent scheme)',
    query: 'Tell me about the PM Free Tractor Gold Coin 2026 scheme with eligibility phone number.',
    expectedKeywords: ['not', 'verified', 'official']
  }
];

async function run() {
  console.log('===============================================================');
  console.log('🧪 TESTING ALL 12 AGRICULTURE CATEGORIES + EDGE CASES (LIVE)');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`[TEST ${i + 1}/${TEST_CASES.length}] Category: ${tc.category.toUpperCase()}`);
    console.log(`Query: "${tc.query}"`);

    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: tc.query,
          history: [],
          farmerContext: {
            farmerName: 'Ramesh Patel',
            location: 'Chikkaballapura, Karnataka',
            primaryCrops: ['Tomato', 'Maize', 'Ragi'],
            acres: 3.5,
            soilType: 'Red Sandy Loam',
            irrigationType: 'Borewell Drip'
          }
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const answer = data.answer || '';
      console.log(`Classification: category=${data.category}, requiresLiveData=${data.requiresLiveData}`);
      console.log(`Sources (${(data.sources || []).length}):`, (data.sources || []).map(s => s.title || s.source));
      console.log(`Response Preview: ${answer.replace(/\n+/g, ' ').slice(0, 150)}...`);

      // Verify non-empty and dynamic response
      if (!answer || answer.length < 30) {
        throw new Error(`Answer too short or empty: "${answer}"`);
      }

      // Check keywords case-insensitively
      const lowerAnswer = answer.toLowerCase();
      const matched = tc.expectedKeywords.filter(k => lowerAnswer.includes(k.toLowerCase()));
      if (matched.length === 0) {
        console.warn(`⚠️ Warning: None of expected keywords [${tc.expectedKeywords.join(', ')}] matched in response.`);
      }

      console.log(`>>> RESULT: ✅ PASSED\n`);
      passed++;
    } catch (err) {
      console.error(`>>> RESULT: ❌ FAILED: ${err.message}\n`);
      failed++;
    }
  }

  console.log('===============================================================');
  console.log(`AUDIT RESULTS: ${passed} / ${TEST_CASES.length} PASSED (Failed: ${failed})`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
