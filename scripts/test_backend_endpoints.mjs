import assert from 'assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
console.log(`\n======================================================`);
console.log(`🧪 TESTING BACKEND API ENDPOINTS ON: ${BASE_URL}`);
console.log(`======================================================\n`);

async function runTests() {
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      console.log(`[TEST ${total}] ${name}...`);
      await fn();
      passed++;
      console.log(`  ✅ PASSED\n`);
    } catch (err) {
      console.error(`  ❌ FAILED: ${err.message}\n`);
    }
  }

  // Test 1: GET /api/health
  await test('GET /api/health returns ok status and JSON response', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok', 'Expected status: "ok"');
    console.log(`   Health response:`, JSON.stringify(data));
  });

  // Test 2: POST /api/chat with agricultural query
  await test('POST /api/chat with "What is the current weather in Bengaluru?"', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the current weather in Bengaluru?',
        language: 'en'
      })
    });
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    const data = await res.json();
    assert(data.response || data.reply || data.text, 'Expected response/reply text in chat response');
    assert(Array.isArray(data.sources), 'Expected sources array');
    console.log(`   Chat response preview: "${(data.response || data.reply || '').slice(0, 120)}..."`);
    console.log(`   Source Label: ${data.sourceLabel}, Confidence: ${data.confidence}`);
  });

  // Test 3: GET /api/weather with valid coordinates
  await test('GET /api/weather with valid coordinates (Bengaluru: 12.9716, 77.5946)', async () => {
    const res = await fetch(`${BASE_URL}/api/weather?lat=12.9716&lon=77.5946`);
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert(typeof data.temperature === 'number', 'Expected numeric temperature');
    assert(typeof data.humidity === 'number', 'Expected numeric humidity');
    assert(data.condition, 'Expected weather condition string');
    assert(Array.isArray(data.forecast), 'Expected forecast array');
    console.log(`   Weather: ${data.temperature}°C, ${data.condition}, Humidity: ${data.humidity}%, Rainfall chance: ${data.rainfallChance}%`);
  });

  // Test 4: GET /api/mandi
  await test('GET /api/mandi returns official APMC records', async () => {
    const res = await fetch(`${BASE_URL}/api/mandi`);
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected success: true');
    assert(Array.isArray(data.mandis), 'Expected mandis array');
    assert(data.mandis.length > 0, 'Expected non-empty mandi records');
    console.log(`   Retrieved ${data.mandis.length} official mandi records. Sample market: ${data.mandis[0].market}, ${data.mandis[0].district} (${data.mandis[0].state})`);
  });

  // Test 5: GET /api/agriculture/mandi
  await test('GET /api/agriculture/mandi returns official APMC records', async () => {
    const res = await fetch(`${BASE_URL}/api/agriculture/mandi?commodity=Tomato`);
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected success: true');
    assert(Array.isArray(data.mandis), 'Expected mandis array');
    console.log(`   Retrieved ${data.mandis.length} Tomato mandi records.`);
  });

  // Test 6: POST /api/diagnose (Crop Doctor)
  await test('POST /api/diagnose accepts leaf image and returns JSON (not HTML)', async () => {
    const res = await fetch(`${BASE_URL}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
        cropType: 'Tomato',
        language: 'en'
      })
    });
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    const data = await res.json();
    // Must be a valid JSON response (either successful diagnosis or clean 503 error, never HTML 404)
    console.log(`   Crop Doctor status: ${res.status}, response keys:`, Object.keys(data));
    if (res.status === 200) {
      assert(data.cropName, 'Expected cropName in diagnosis');
      assert(data.diseaseName, 'Expected diseaseName in diagnosis');
    } else {
      assert(data.error, 'Expected error explanation in failure JSON');
    }
  });

  // Test 7: Verify 404 returns JSON and NEVER HTML
  await test('GET /api/nonexistent-route returns JSON 404 (NEVER HTML)', async () => {
    const res = await fetch(`${BASE_URL}/api/nonexistent-route`);
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type on 404, got: ${contentType}`);
    assert.strictEqual(res.status, 404, `Expected status 404, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, false, 'Expected success: false on 404');
    assert(data.error, 'Expected error message in 404 JSON');
    console.log(`   JSON 404 correctly returned:`, JSON.stringify(data));
  });

  // Test 8: Verify route alias /health (without /api prefix)
  await test('GET /health route alias returns JSON', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok', 'Expected status: "ok"');
  });

  // Test 9: POST /api/chat/translate returns JSON response
  await test('POST /api/chat/translate returns JSON response', async () => {
    const res = await fetch(`${BASE_URL}/api/chat/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Water the plants early morning',
        targetLang: 'kn'
      })
    });
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    const data = await res.json();
    console.log(`   Translate status: ${res.status}, response keys:`, Object.keys(data));
    assert(data.translatedText || data.error, 'Expected translatedText or error in JSON response');
  });

  // Test 10: POST /api/voice/caption returns JSON response
  await test('POST /api/voice/caption returns JSON response', async () => {
    const res = await fetch(`${BASE_URL}/api/voice/caption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: 'dGVzdGF1ZGlv',
        language: 'kn'
      })
    });
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    const data = await res.json();
    console.log(`   Voice caption status: ${res.status}, response keys:`, Object.keys(data));
    assert(data.transcription || data.error, 'Expected transcription or error in JSON response');
  });

  console.log(`======================================================`);
  console.log(`🏁 RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log(`======================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
