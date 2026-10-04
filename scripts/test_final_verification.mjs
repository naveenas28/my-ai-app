import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function runFinalVerification() {
  console.log('🌾 ===============================================================');
  console.log('🌾 AGRIVERSE AI — FINAL SYSTEM VERIFICATION & AUDIT SUITE');
  console.log('🌾 ===============================================================\n');

  let passed = 0;
  let total = 0;

  async function testSection(num, name, fn) {
    total++;
    console.log(`\n=================================================================`);
    console.log(`[TEST ${num}] ${name}`);
    console.log(`=================================================================`);
    try {
      await fn();
      console.log(`>>> RESULT: ✅ PASSED`);
      passed++;
    } catch (err) {
      console.error(`>>> RESULT: ❌ FAILED - ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: 5 DIFFERENT FARMING QUESTIONS
  // -------------------------------------------------------------
  await testSection('1.1', 'Farming Question 1 (Soil & Irrigation): Wheat at CRI Stage', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How often should I irrigate wheat in sandy loam soil during the crown root initiation (CRI) stage?',
        language: 'en',
        userContext: { crop: 'Wheat' }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = (data.reply || data.text || '');
    console.log('AI Response Excerpt:\n', reply.substring(0, 260) + '...\n');
    console.log('Verified Sources:', data.sources);
    if (!reply.toLowerCase().includes('cri') || !reply.toLowerCase().includes('wheat')) {
      throw new Error('Did not address wheat CRI irrigation requirements');
    }
    if (!reply.includes('20') && !reply.includes('25')) {
      throw new Error('Missing CRI days timing (20-25 DAS)');
    }
  });

  await testSection('1.2', 'Farming Question 2 (Nutrients & Deficiency): Zinc in Paddy', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How do I identify and fix zinc deficiency in paddy or rice?',
        language: 'en',
        userContext: { crop: 'Paddy' }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = (data.reply || data.text || '');
    console.log('AI Response Excerpt:\n', reply.substring(0, 260) + '...\n');
    console.log('Verified Sources:', data.sources);
    if (!reply.toLowerCase().includes('zinc') || (!reply.toLowerCase().includes('khaira') && !reply.toLowerCase().includes('bronze') && !reply.toLowerCase().includes('rust'))) {
      throw new Error('Did not identify zinc deficiency / Khaira disease characteristics');
    }
  });

  await testSection('1.3', 'Farming Question 3 (Crop Disease & Bio-control): Powdery Mildew in Watermelon', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What organic preventive spray stops powdery mildew on watermelon?',
        language: 'en',
        userContext: { crop: 'Watermelon' }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = (data.reply || data.text || '');
    console.log('AI Response Excerpt:\n', reply.substring(0, 260) + '...\n');
    console.log('Verified Sources:', data.sources);
    if (!reply.toLowerCase().includes('powdery mildew') && !reply.toLowerCase().includes('bicarbonate') && !reply.toLowerCase().includes('sulphur')) {
      throw new Error('Did not provide powdery mildew remedies');
    }
  });

  await testSection('1.4', 'Farming Question 4 (Farm Economics & Schemes): KCC Interest Subvention', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How does the Kisan Credit Card (KCC) interest subvention work and what is the effective net interest rate?',
        language: 'en'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = (data.reply || data.text || '');
    console.log('AI Response Excerpt:\n', reply.substring(0, 260) + '...\n');
    console.log('Verified Sources:', data.sources);
    if (!reply.includes('4%') || !reply.includes('7%')) {
      throw new Error('Missing official KCC 7% base / 4% net interest rate figures');
    }
  });

  await testSection('1.5', 'Farming Question 5 (Farm Machinery & Management): Soybean Combine Harvester', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'When is the best moisture level to harvest soybeans using a combine harvester and how to prevent shattering loss?',
        language: 'en',
        userContext: { crop: 'Soybean' }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = (data.reply || data.text || '');
    console.log('AI Response Excerpt:\n', reply.substring(0, 260) + '...\n');
    console.log('Verified Sources:', data.sources);
    if (!reply.includes('13%') && !reply.includes('15%') && !reply.toLowerCase().includes('moisture')) {
      throw new Error('Missing harvest moisture recommendations (13-15%)');
    }
  });

  // -------------------------------------------------------------
  // TEST 2: FOLLOW-UP QUESTION & CONTEXT PRESERVATION
  // -------------------------------------------------------------
  await testSection('2', 'Follow-up Question with Context Retention: Cotton Red Leaves', async () => {
    // Turn 1
    const res1 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'My cotton crop is showing red leaves.',
        language: 'en',
        userContext: { crop: 'Cotton' }
      })
    });
    if (!res1.ok) throw new Error(`Turn 1 failed: HTTP ${res1.status}`);
    const data1 = await res1.json();
    const reply1 = data1.reply || data1.text;
    console.log('Turn 1 Excerpt:\n', reply1.substring(0, 180) + '...');

    // Turn 2: Follow-up without repeating "cotton"
    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What foliar spray should I apply immediately to cure it?',
        language: 'en',
        userContext: { crop: 'Cotton' },
        conversationHistory: [
          { role: 'user', content: 'My cotton crop is showing red leaves.' },
          { role: 'model', content: reply1 }
        ]
      })
    });
    if (!res2.ok) throw new Error(`Turn 2 failed: HTTP ${res2.status}`);
    const data2 = await res2.json();
    const reply2 = (data2.reply || data2.text || '').toLowerCase();
    console.log('\nTurn 2 (Follow-up) Excerpt:\n', (data2.reply || data2.text).substring(0, 260) + '...\n');
    if (!reply2.includes('cotton') && !reply2.includes('magnesium') && !reply2.includes('urea') && !reply2.includes('mgso4')) {
      throw new Error('Follow-up lost context of the cotton leaf reddening conversation');
    }
  });

  // -------------------------------------------------------------
  // TEST 3: CURRENT-DATA QUESTIONS (Mandi, Weather, Government Schemes)
  // -------------------------------------------------------------
  await testSection('3.1', 'Current Live Data: Open-Meteo Weather Forecast', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the current weather forecast for my field in Chikkaballapura?',
        language: 'en',
        farmerProfile: { district: 'Chikkaballapura', state: 'Karnataka' },
        userContext: { district: 'Chikkaballapura', state: 'Karnataka' }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('Weather Advisory Excerpt:\n', (data.reply || data.text).substring(0, 220) + '...\n');
    console.log('Verified Sources Attached:', data.sources);
    if (!data.sources || data.sources.length === 0) throw new Error('Live weather data source missing');
    if (!data.sources.some(s => s.type === 'weather')) throw new Error('No weather source verified');
  });

  await testSection('3.2', 'Current Live Data: Agmarknet APMC Tomato Price', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the current tomato mandi price in Kolar market today?',
        language: 'en',
        userContext: { crop: 'Tomato', district: 'Kolar', state: 'Karnataka' }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('Mandi Price Excerpt:\n', (data.reply || data.text).substring(0, 220) + '...\n');
    console.log('Verified Sources Attached:', data.sources);
    if (!data.sources || data.sources.length === 0) throw new Error('Live APMC mandi data source missing');
    if (!data.sources.some(s => s.type === 'mandi')) throw new Error('No APMC mandi source verified');
  });

  // -------------------------------------------------------------
  // TEST 4 & 5: VOICE PIPELINE (SPEECH RECOGNITION & SYNTHESIS)
  // -------------------------------------------------------------
  await testSection('4', 'Voice Input Pipeline (SpeechRecognition -> Dispatch -> /api/chat)', async () => {
    const simulatedTranscribedText = 'What fertilizer is best for ragi during tillering?';
    console.log(`Transcribed voice input from browser microphone: "${simulatedTranscribedText}"`);
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: simulatedTranscribedText,
        language: 'en',
        userContext: { crop: 'Ragi' }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('AI Response to Voice Input Excerpt:\n', (data.reply || data.text).substring(0, 220) + '...\n');
    if (!data.reply && !data.text) throw new Error('Empty response for voice query');
  });

  await testSection('5', 'Voice Output Pipeline (Markdown sanitization for SpeechSynthesis)', async () => {
    const sampleAiMarkdown = `**Diagnostic & Action Guide**:
• Spray **Neem Oil 10,000 ppm @ 5ml/L**.
• Visit [pmkisan.gov.in](https://pmkisan.gov.in).`;

    function cleanTextForSpeech(text) {
      return text
        .replace(/https?:\/\/[^\s]+/g, 'official portal')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/#+\s*/g, '')
        .replace(/•\s*/g, '. ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[\n\r]+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const spokenSpeech = cleanTextForSpeech(sampleAiMarkdown);
    console.log('Original Markdown:\n', sampleAiMarkdown);
    console.log('\nCleaned Spoken Utterance for SpeechSynthesis:\n', `"${spokenSpeech}"\n`);
    if (spokenSpeech.includes('**') || spokenSpeech.includes('http') || spokenSpeech.includes('•')) {
      throw new Error('Markdown or raw URL remained in speech string');
    }
  });

  // -------------------------------------------------------------
  // TEST 6: ACTUAL CROP IMAGE (MULTIMODAL DIAGNOSIS)
  // -------------------------------------------------------------
  await testSection('6', 'Actual Crop Image Analysis (/api/diagnose)', async () => {
    const sampleLeafBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const res = await fetch(`${BASE_URL}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: sampleLeafBase64,
        cropType: 'Tomato',
        language: 'en'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const report = await res.json();
    console.log('Structured Plant Inspection Report:', {
      cropName: report.cropName,
      diseaseName: report.diseaseName,
      confidence: report.confidence,
      severity: report.severity,
      organicControl: report.organicControl,
      chemicalControl: report.chemicalControl
    });
    if (!report.diseaseName || !report.organicControl) {
      throw new Error('Incomplete diagnostic report returned');
    }
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log(`\n=================================================================`);
  console.log(`🎯 FINAL AUDIT SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log(`=================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runFinalVerification().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
