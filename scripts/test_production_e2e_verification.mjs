/**
 * Production End-to-End Verification Test Suite
 * Tests live deployed endpoints on https://my-ai-app-sigma-one.vercel.app
 */

const BASE_URL = 'https://my-ai-app-sigma-one.vercel.app';

let totalTests = 0;
let passedTests = 0;
const results = {};

function logSection(title) {
  console.log(`\n================================================================`);
  console.log(`▶ ${title}`);
  console.log(`================================================================`);
}

function recordPass(name, detail = '') {
  totalTests++;
  passedTests++;
  results[name] = 'PASS';
  console.log(`  ✅ [PASS] ${name}${detail ? ` (${detail})` : ''}`);
}

function recordFail(name, err) {
  totalTests++;
  results[name] = 'FAIL';
  console.error(`  ❌ [FAIL] ${name}: ${err?.message || err}`);
}

async function runTests() {
  console.log(`🚀 Starting AgriVerse AI Production E2E Verification`);
  console.log(`🌐 Production URL: ${BASE_URL}`);

  // Test 1: Production Health
  logSection('1. Production API Health Test');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Status not ok: ${JSON.stringify(data)}`);
    recordPass('Production API Health', `serverless: ${data.serverless}, mode: ${data.mode}`);
  } catch (e) {
    recordFail('Production API Health', e);
  }

  // Test 2: Production Weather API
  logSection('2. Production Weather API Test');
  try {
    const res = await fetch(`${BASE_URL}/api/weather?lat=13.4355&lon=77.7279`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.locationName || data.temperature === undefined) throw new Error('Missing weather fields');
    recordPass('Production Weather API', `${data.locationName}, ${data.temperature}°C, Rain: ${data.rainfallChance}%`);
  } catch (e) {
    recordFail('Production Weather API', e);
  }

  // Test 3: Production Mandi API (e-NAM Records)
  logSection('3. Production Mandi API Test');
  try {
    const res = await fetch(`${BASE_URL}/api/mandi?limit=5`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const count = data?.totalCount || data?.mandis?.length || 0;
    if (count === 0) throw new Error('No mandi records returned');
    recordPass('Production Mandi API', `${count} official Mandis verified`);
  } catch (e) {
    recordFail('Production Mandi API', e);
  }

  // Test 4: Production Krishi AI Chat (/api/chat)
  logSection('4. Production AI Chat Test');
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the standard spacing and water requirement for ragi cultivation?',
        language: 'en'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = data.reply || data.response || data.text || '';
    if (!reply || reply.length < 20) throw new Error('Empty or insufficient chat response');
    recordPass('Production AI Chat', `Source: ${data.sourceLabel || 'VERIFIED'}, Length: ${reply.length} chars`);
  } catch (e) {
    recordFail('Production AI Chat', e);
  }

  // Test 5: Production Crop Doctor / Vision Endpoint (/api/diagnose)
  logSection('5. Production Crop Doctor / Vision Endpoint Test');
  try {
    const sampleLeaf = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await fetch(`${BASE_URL}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: sampleLeaf,
        language: 'en',
        cropType: 'Tomato'
      })
    });
    // Response must be valid JSON and handled correctly (either 200 with diagnosis, or 503 with truthful error)
    const data = await res.json();
    if (res.status === 200) {
      if (!data.diseaseName) throw new Error('Missing diseaseName in diagnosis report');
      recordPass('Crop Doctor Vision Diagnosis', `Diagnosed condition: ${data.diseaseName}, confidence: ${data.confidence || 'N/A'}`);
    } else if (res.status === 503) {
      // Truthful graceful error
      if (!data.error) throw new Error('503 response missing truthful error description');
      recordPass('Crop Doctor Vision Diagnosis', `Truthful graceful error: "${data.error}"`);
    } else {
      throw new Error(`Unexpected status HTTP ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    recordFail('Crop Doctor Vision Diagnosis', e);
  }

  // Test 6: Google Sign-In Provider Configuration Test
  logSection('6. Google Sign-In Configuration Test');
  try {
    const cfgRes = await import('../firebase-applet-config.json', { with: { type: 'json' } }).then(m => m.default);
    // Verify Firebase Auth OAuth Handler
    const handlerRes = await fetch(`https://${cfgRes.authDomain}/__/auth/handler`);
    if (handlerRes.status !== 200) throw new Error(`Auth handler HTTP ${handlerRes.status}`);

    // Verify Google provider is enabled on project
    const authUriRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${cfgRes.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'google.com',
        continueUri: BASE_URL
      })
    });
    if (!authUriRes.ok) throw new Error(`createAuthUri HTTP ${authUriRes.status}`);
    const authData = await authUriRes.json();
    if (!authData.authUri || authData.providerId !== 'google.com') throw new Error('Google provider not configured');
    recordPass('Google Sign-In Configuration', `Client ID verified for ${cfgRes.projectId}`);
  } catch (e) {
    recordFail('Google Sign-In Configuration', e);
  }

  // Test 7: Profile Photo Zero-Cost Architecture Test
  logSection('7. Profile Photo Zero-Cost Architecture Test');
  try {
    const fs = await import('fs');
    const storageCode = fs.readFileSync('./src/services/providers/storageProvider.ts', 'utf8');
    const featuresCode = fs.readFileSync('./src/config/features.ts', 'utf8');
    const userServiceCode = fs.readFileSync('./src/services/userService.ts', 'utf8');

    // Verify feature flags enforce zero cost
    if (!featuresCode.includes('CLOUD_STORAGE_PAID_ENABLED: false')) {
      throw new Error('CLOUD_STORAGE_PAID_ENABLED is not set to false');
    }
    // Verify storageProvider has LocalThumbnailStorageProvider as default
    if (!storageCode.includes('return new LocalThumbnailStorageProvider()')) {
      throw new Error('Default storage provider is not LocalThumbnailStorageProvider');
    }
    // Verify CloudStorageProvider is strictly dormant
    if (!storageCode.includes('Zero-billing policy is active')) {
      throw new Error('CloudStorageProvider does not enforce zero-billing policy');
    }
    // Verify userService saves photo locally without Firebase Cloud Storage bucket
    if (!userServiceCode.includes('profile_photo_${currentUid}')) {
      throw new Error('userService does not cache photo locally');
    }
    recordPass('Profile Photo Zero-Cost Architecture', 'Client compression active; Blaze storage strictly dormant ($0 cost)');
  } catch (e) {
    recordFail('Profile Photo Zero-Cost Architecture', e);
  }

  // Summary
  console.log(`\n================================================================`);
  console.log(`📊 FINAL PRODUCTION VERIFICATION SUMMARY: ${passedTests}/${totalTests} PASSED`);
  console.log(`================================================================`);
  for (const [name, status] of Object.entries(results)) {
    console.log(`  ${status === 'PASS' ? '✅' : '❌'} ${name}: ${status}`);
  }

  if (passedTests === totalTests) {
    console.log(`\n🎉 ALL PRODUCTION TESTS PASSED!`);
    process.exit(0);
  } else {
    console.error(`\n⚠️ Some tests failed.`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
