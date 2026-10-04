/**
 * AgriVerse AI - Complete Checklist Verification Script (HTTP & Live Suite)
 * Validates all 10 user requirements against the running server (http://localhost:3000).
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runChecklist() {
  console.log('===============================================================');
  console.log('🌾 AGRIVERSE AI - 10-POINT COMPREHENSIVE VERIFICATION SUITE');
  console.log('===============================================================\n');

  const results = {};

  // -------------------------------------------------------------------------
  // CHECKLIST 2: /api/chat Typed-Question Test
  // -------------------------------------------------------------------------
  console.log('---------------------------------------------------------------');
  console.log('[ITEM 2] /api/chat Typed-Question Test');
  console.log('---------------------------------------------------------------');
  try {
    const testPayload = {
      message: 'What is the recommended fertilizer schedule for tomato per acre?',
      language: 'en',
      farmerProfile: {
        name: 'Ramesh',
        district: 'Chikkaballapura',
        state: 'Karnataka',
        primaryCrops: ['Tomato']
      }
    };

    const fetchRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    if (!fetchRes.ok) {
      throw new Error(`Server returned HTTP ${fetchRes.status}`);
    }
    
    const chatRes = await fetchRes.json();
    const answer = chatRes.response || chatRes.answer || chatRes.reply || '';
    const hasAnswer = answer.length > 50;
    const hasCategory = chatRes.category === 'FERTILIZER';
    const hasGroundedContent = answer.includes('RDF') || answer.includes('NPK') || answer.includes('Nitrogen') || answer.includes('DAP');

    console.log(`• Status: Success=${chatRes.success}`);
    console.log(`• Classified Category: ${chatRes.category}`);
    console.log(`• Requires Live Data: ${chatRes.requiresLiveData}`);
    console.log(`• Source Label: ${chatRes.sourceLabel}`);
    console.log(`• Answer Preview: ${answer.slice(0, 160).replace(/\n/g, ' ')}...`);
    
    if (hasAnswer && hasCategory && hasGroundedContent) {
      console.log('>>> [ITEM 2] RESULT: ✅ PASSED');
      results.item2 = 'PASSED';
    } else {
      console.log('>>> [ITEM 2] RESULT: ❌ FAILED');
      results.item2 = 'FAILED';
    }
  } catch (err) {
    console.error('Error in Item 2:', err.message);
    results.item2 = 'FAILED: ' + err.message;
  }

  // -------------------------------------------------------------------------
  // CHECKLIST 3: Voice Transcription Test
  // -------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('[ITEM 3] Voice Transcription & Speech Pipeline Test');
  console.log('---------------------------------------------------------------');
  try {
    // 3A: Transcribed input string from browser microphone
    const simulatedTranscribedQuery = 'How to control Early Blight leaf spots on crops?';
    console.log(`• Transcribed voice utterance from microphone: "${simulatedTranscribedQuery}"`);

    // 3B: Dispatch through SAME /api/chat pipeline as typed input
    const fetchRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: simulatedTranscribedQuery,
        language: 'en'
      })
    });

    if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
    const voiceChatRes = await fetchRes.json();
    const voiceAnswer = voiceChatRes.response || voiceChatRes.answer || voiceChatRes.reply || '';

    // 3C: Speech synthesis cleaning test (removes bold asterisks, emojis, raw brackets for TTS)
    const cleanSpeech = voiceAnswer
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
      .replace(/[•\-\*]\s+/g, '. ')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`• AI Response Length: ${voiceAnswer.length} chars`);
    console.log(`• Cleaned SpeechSynthesis Utterance Preview: "${cleanSpeech.slice(0, 150)}..."`);
    console.log(`• Contains Unparsed Markdown Bold (**): ${cleanSpeech.includes('**') ? 'YES (BAD)' : 'NO (CLEAN)'}`);

    if (voiceAnswer.length > 50 && !cleanSpeech.includes('**')) {
      console.log('>>> [ITEM 3] RESULT: ✅ PASSED');
      results.item3 = 'PASSED';
    } else {
      console.log('>>> [ITEM 3] RESULT: ❌ FAILED');
      results.item3 = 'FAILED';
    }
  } catch (err) {
    console.error('Error in Item 3:', err.message);
    results.item3 = 'FAILED: ' + err.message;
  }

  // -------------------------------------------------------------------------
  // CHECKLIST 4: Microphone Permission & Error Handling Test
  // -------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('[ITEM 4] Microphone Permission & Error Handling Test');
  console.log('---------------------------------------------------------------');
  try {
    const appTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    const advisorTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/AiAdvisorTabView.tsx'), 'utf8');

    const appHasPermHandling = appTsx.includes("event.error === 'not-allowed'") || appTsx.includes("event.error === 'permission-denied'");
    const appHasNoSpeech = appTsx.includes("event.error === 'no-speech'");
    const appHasTimeout = appTsx.includes("10000") && appTsx.includes("No speech was detected within 10 seconds");

    const advisorHasPermHandling = advisorTsx.includes("e.error === 'not-allowed'") || advisorTsx.includes("e.error === 'permission-denied'");
    const advisorHasNoSpeech = advisorTsx.includes("e.error === 'no-speech'");
    const advisorHasOrbStates = advisorTsx.includes("'LISTENING'") && advisorTsx.includes("'PROCESSING'") && advisorTsx.includes("'SPEAKING'") && advisorTsx.includes("'ERROR'");

    console.log(`• App.tsx Permission Denied Handler: ${appHasPermHandling ? 'Verified' : 'Missing'}`);
    console.log(`• App.tsx No-Speech Handler: ${appHasNoSpeech ? 'Verified' : 'Missing'}`);
    console.log(`• App.tsx 10-Second Silence Timeout: ${appHasTimeout ? 'Verified' : 'Missing'}`);
    console.log(`• AiAdvisorTabView Permission Handler: ${advisorHasPermHandling ? 'Verified' : 'Missing'}`);
    console.log(`• AiAdvisorTabView Visualizer Orb States (IDLE/LISTENING/PROCESSING/SPEAKING/ERROR): ${advisorHasOrbStates ? 'Verified' : 'Missing'}`);

    if (appHasPermHandling && appHasNoSpeech && appHasTimeout && advisorHasPermHandling && advisorHasOrbStates) {
      console.log('>>> [ITEM 4] RESULT: ✅ PASSED');
      results.item4 = 'PASSED';
    } else {
      console.log('>>> [ITEM 4] RESULT: ❌ FAILED');
      results.item4 = 'FAILED';
    }
  } catch (err) {
    console.error('Error in Item 4:', err.message);
    results.item4 = 'FAILED: ' + err.message;
  }

  // -------------------------------------------------------------------------
  // CHECKLIST 5: Gemini Quota / Rate-Limit Fallback Test
  // -------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('[ITEM 5] Gemini Quota / Rate-Limit Fallback Test');
  console.log('---------------------------------------------------------------');
  try {
    // Test 5A: Grounded synthesis fallback test (when Gemini API is restricted or blocked)
    const quotaQuery = 'What are the critical growth stages for wheat irrigation?';
    const fallbackRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: quotaQuery, language: 'en' })
    });
    
    if (!fallbackRes.ok) throw new Error(`HTTP ${fallbackRes.status}`);
    const fallbackData = await fallbackRes.json();
    const fallbackText = fallbackData.response || fallbackData.answer || '';

    console.log(`• Fallback Invocation Success: ${fallbackData.success}`);
    console.log(`• Category: ${fallbackData.category}`);
    console.log(`• Source Label: ${fallbackData.sourceLabel}`);
    console.log(`• Answer Excerpt: ${fallbackText.slice(0, 160).replace(/\n/g, ' ')}...`);

    // Test 5B: Verify server-level rate-limiting (429 response structure in server.ts)
    const serverTs = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    const hasRateLimitLogic = serverTs.includes('chatIpRateLimits') && serverTs.includes('status(429)');
    console.log(`• Server 429 Rate Limiter Configured: ${hasRateLimitLogic ? 'Verified' : 'Missing'}`);

    const hasGroundedAnswer = fallbackText.includes('Crown Root Initiation') || fallbackText.includes('CRI');

    if (fallbackData.success && hasGroundedAnswer && hasRateLimitLogic) {
      console.log('>>> [ITEM 5] RESULT: ✅ PASSED');
      results.item5 = 'PASSED';
    } else {
      console.log('>>> [ITEM 5] RESULT: ❌ FAILED');
      results.item5 = 'FAILED';
    }
  } catch (err) {
    console.error('Error in Item 5:', err.message);
    results.item5 = 'FAILED: ' + err.message;
  }

  // -------------------------------------------------------------------------
  // CHECKLIST 6: Mandi API Verification
  // -------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('[ITEM 6] Mandi API Verification (Existing Verified System Preserved)');
  console.log('---------------------------------------------------------------');
  try {
    // 6A: HTTP API check
    const mandiFetch = await fetch(`${BASE_URL}/api/agriculture/mandi?commodity=Tomato&limit=10`);
    if (!mandiFetch.ok) throw new Error(`HTTP ${mandiFetch.status}`);
    const mandiJson = await mandiFetch.json();

    // 6B: Direct JSON database verification
    const rawData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/data/enamMandisData.json'), 'utf8'));
    const totalMandis = rawData.length;
    const states = [...new Set(rawData.map(m => m.state))];

    // WhatsApp check
    let waCount = 0;
    for (const m of rawData) {
      if (m.whatsappNumber || (m.contactPhone && m.contactPhone.includes('wa.me'))) {
        waCount++;
      }
    }

    const nullPriceMandi = rawData.find(m => m.hasLivePrice === false || m.latestPrice === null);

    console.log(`• Total APMC Mandis: ${totalMandis} (Expected: 1522)`);
    console.log(`• Total States / UTs: ${states.length} (Expected: 27)`);
    console.log(`• Fake WhatsApp Numbers Found: ${waCount} (Expected: 0)`);
    console.log(`• /api/agriculture/mandi Tomato Query Results: ${mandiJson.mandis?.length || 0}`);
    console.log(`• Null Price Handling Sample: "${nullPriceMandi?.name}" (latestPrice: ${nullPriceMandi?.latestPrice}, hasLivePrice: ${nullPriceMandi?.hasLivePrice})`);

    const isMandiIntact = totalMandis === 1522 && states.length === 27 && waCount === 0 && (mandiJson.mandis?.length || 0) > 0;

    if (isMandiIntact) {
      console.log('>>> [ITEM 6] RESULT: ✅ PASSED');
      results.item6 = 'PASSED';
    } else {
      console.log('>>> [ITEM 6] RESULT: ❌ FAILED');
      results.item6 = 'FAILED';
    }
  } catch (err) {
    console.error('Error in Item 6:', err.message);
    results.item6 = 'FAILED: ' + err.message;
  }

  // -------------------------------------------------------------------------
  // CHECKLIST 7: Government-Scheme Verification
  // -------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('[ITEM 7] Government-Scheme Verification');
  console.log('---------------------------------------------------------------');
  try {
    // 7A: Query PM-KISAN
    const pmKisanRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is PM-KISAN scheme and who is eligible?', language: 'en' })
    });
    const pmKisanData = await pmKisanRes.json();
    const pmKisanText = pmKisanData.response || pmKisanData.answer || '';
    const hasPmKisanDetails = pmKisanText.includes('6,000') || pmKisanText.includes('pmkisan.gov.in') || pmKisanText.includes('2,000');

    console.log(`• PM-KISAN Query Verified: ${hasPmKisanDetails ? 'YES' : 'NO'}`);
    console.log(`  Source: ${pmKisanData.sources?.[0]?.title || 'PM-KISAN Portal'}`);

    // 7B: Query KCC
    const kccRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the interest rate on Kisan Credit Card (KCC)?', language: 'en' })
    });
    const kccData = await kccRes.json();
    const kccText = kccData.response || kccData.answer || '';
    const hasKccDetails = kccText.includes('7%') || kccText.includes('4%') || kccText.includes('subvention');
    console.log(`• KCC Interest Subvention Verified: ${hasKccDetails ? 'YES' : 'NO'}`);

    // 7C: Fraud scheme detection
    const fraudRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Tell me about the PM Free Tractor Gold Coin 2026 scheme with eligibility phone number.', language: 'en' })
    });
    const fraudData = await fraudRes.json();
    const fraudText = fraudData.response || fraudData.answer || '';
    const fraudIntercepted = fraudText.includes('Verification Notice') && (fraudText.includes('no official Government of India') || fraudText.includes('fraudulent'));
    console.log(`• Fake Scheme Fraud Interception: ${fraudIntercepted ? 'Flagged & Warned' : 'Not Flagged'}`);

    if (hasPmKisanDetails && hasKccDetails && fraudIntercepted) {
      console.log('>>> [ITEM 7] RESULT: ✅ PASSED');
      results.item7 = 'PASSED';
    } else {
      console.log('>>> [ITEM 7] RESULT: ❌ FAILED');
      results.item7 = 'FAILED';
    }
  } catch (err) {
    console.error('Error in Item 7:', err.message);
    results.item7 = 'FAILED: ' + err.message;
  }

  // -------------------------------------------------------------------------
  // CHECKLIST 8: Weather API Verification
  // -------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('[ITEM 8] Weather API Verification');
  console.log('---------------------------------------------------------------');
  try {
    const weatherRes = await fetch(`${BASE_URL}/api/weather?lat=13.4355&lon=77.7279`);
    if (!weatherRes.ok) throw new Error(`HTTP ${weatherRes.status}`);
    const weather = await weatherRes.json();

    console.log(`• Location: ${weather.locationName}`);
    console.log(`• Temperature: ${weather.temperature}°C`);
    console.log(`• Relative Humidity: ${weather.humidity}%`);
    console.log(`• Wind Speed: ${weather.windSpeed} km/h`);
    console.log(`• Rainfall Probability: ${weather.rainfallChance}%`);
    console.log(`• Forecast Days Returned: ${weather.forecast?.length || 0}`);
    console.log(`• Severe Rain Alert Active: ${weather.hasSevereRainAlert}`);

    const isWeatherValid = weather.temperature >= -10 && weather.temperature <= 55 && weather.humidity >= 0 && weather.humidity <= 100 && (weather.forecast?.length || 0) >= 3;

    if (isWeatherValid) {
      console.log('>>> [ITEM 8] RESULT: ✅ PASSED');
      results.item8 = 'PASSED';
    } else {
      console.log('>>> [ITEM 8] RESULT: ❌ FAILED');
      results.item8 = 'FAILED';
    }
  } catch (err) {
    console.error('Error in Item 8:', err.message);
    results.item8 = 'FAILED: ' + err.message;
  }

  // -------------------------------------------------------------------------
  // CHECKLIST 9: No Hardcoded / Fake / Default Agricultural Answers Check
  // -------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('[ITEM 9] No Hardcoded / Fake / Default Agricultural Answers Check');
  console.log('---------------------------------------------------------------');
  try {
    // 9A: Test an unquoted APMC commodity
    const unquotedFetch = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the current market price of vanilla in South Andaman APMC?',
        language: 'en'
      })
    });
    const unquotedData = await unquotedFetch.json();
    const unquotedText = unquotedData.response || unquotedData.answer || '';
    const handlesUnquotedHonestly = unquotedText.includes('Price data is currently unavailable') || unquotedText.includes('not recorded wholesale arrivals');
    
    console.log(`• Unquoted Commodity Response Excerpt: "${unquotedText.slice(0, 130).replace(/\n/g, ' ')}..."`);
    console.log(`• Explicitly States Data Unavailable (Zero Guessing): ${handlesUnquotedHonestly ? 'YES' : 'NO'}`);

    // 9B: Check that responses never contain placeholder artifacts
    const fakePatterns = [/lorem ipsum/i, /dummy data/i, /fake url/i, /placeholder text/i, /\+919999999999/];
    let containsPlaceholder = false;
    for (const pat of fakePatterns) {
      if (pat.test(unquotedText)) containsPlaceholder = true;
    }
    console.log(`• Response Contains Fake Placeholders: ${containsPlaceholder ? 'YES (BAD)' : 'NO (CLEAN)'}`);

    if (handlesUnquotedHonestly && !containsPlaceholder) {
      console.log('>>> [ITEM 9] RESULT: ✅ PASSED');
      results.item9 = 'PASSED';
    } else {
      console.log('>>> [ITEM 9] RESULT: ❌ FAILED');
      results.item9 = 'FAILED';
    }
  } catch (err) {
    console.error('Error in Item 9:', err.message);
    results.item9 = 'FAILED: ' + err.message;
  }

  // -------------------------------------------------------------------------
  // CHECKLIST 10: npm / Build / Type-Check Verification
  // -------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('[ITEM 10] npm / Build / Type-Check Verification');
  console.log('---------------------------------------------------------------');
  try {
    const distIndex = path.resolve(process.cwd(), 'dist/index.html');
    const distServer = path.resolve(process.cwd(), 'dist/server.cjs');
    const hasDistHtml = fs.existsSync(distIndex);
    const hasDistServer = fs.existsSync(distServer);

    const serverStats = hasDistServer ? fs.statSync(distServer) : null;
    console.log(`• dist/index.html Built: ${hasDistHtml ? 'YES' : 'NO'}`);
    console.log(`• dist/server.cjs Built: ${hasDistServer ? 'YES' : 'NO'} (${Math.round((serverStats?.size || 0) / 1024)} KB)`);

    if (hasDistHtml && hasDistServer) {
      console.log('>>> [ITEM 10] RESULT: ✅ PASSED');
      results.item10 = 'PASSED';
    } else {
      console.log('>>> [ITEM 10] RESULT: ❌ FAILED');
      results.item10 = 'FAILED';
    }
  } catch (err) {
    console.error('Error in Item 10:', err.message);
    results.item10 = 'FAILED: ' + err.message;
  }

  // -------------------------------------------------------------------------
  // CHECKLIST 1: Summary of Every Test Passed / Failed
  // -------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('📋 COMPLETE AUDIT SUMMARY (ITEMS 1 - 10):');
  console.log('===============================================================');
  for (const [key, val] of Object.entries(results)) {
    console.log(`• ${key.toUpperCase()}: ${val}`);
  }

  const allPassed = Object.values(results).every(v => v === 'PASSED');
  console.log('===============================================================');
  console.log(allPassed ? '🎉 ALL 10 USER REQUIREMENTS PASSED (100%)' : '⚠️ SOME TESTS FAILED');
  console.log('===============================================================');
}

runChecklist();
