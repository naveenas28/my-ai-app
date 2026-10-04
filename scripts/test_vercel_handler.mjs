import http from 'http';
import assert from 'assert';

console.log(`\n======================================================`);
console.log(`🧪 TESTING VERCEL SERVERLESS HANDLER DIRECTLY (api/index.ts)`);
console.log(`======================================================\n`);

async function testVercelHandler() {
  // Set VERCEL env to simulate Vercel serverless environment
  process.env.VERCEL = '1';
  process.env.NODE_ENV = 'production';

  // Import the exported Express app as Vercel does
  const { default: handler } = await import('../api/index.js');
  assert(typeof handler === 'function', 'api/index.js must export a handler function');

  // Helper to simulate Vercel serverless invocation using node's http server for precise testing
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Serverless handler mounted on ephemeral test port ${port}`);

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
  await test('Vercel Handler: GET /api/health', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: {
        'x-vercel-matched-path': '/api/health'
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.serverless, true);
    console.log(`   Response:`, JSON.stringify(data));
  });

  // Test 2: GET /api/mandi
  await test('Vercel Handler: GET /api/mandi', async () => {
    const res = await fetch(`${baseUrl}/api/mandi`, {
      headers: {
        'x-vercel-matched-path': '/api/mandi'
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.success === true);
    assert(data.mandis.length > 0);
    console.log(`   Found ${data.mandis.length} mandis.`);
  });

  // Test 3: GET /api/weather
  await test('Vercel Handler: GET /api/weather?lat=12.9716&lon=77.5946', async () => {
    const res = await fetch(`${baseUrl}/api/weather?lat=12.9716&lon=77.5946`, {
      headers: {
        'x-vercel-matched-path': '/api/weather'
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(typeof data.temperature === 'number');
    console.log(`   Weather: ${data.temperature}°C, ${data.condition}`);
  });

  // Test 4: POST /api/chat
  await test('Vercel Handler: POST /api/chat', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-matched-path': '/api/chat'
      },
      body: JSON.stringify({
        message: 'What is the current weather in Bengaluru?',
        language: 'en'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.response || data.reply);
    console.log(`   Chat response preview: "${(data.response || data.reply).slice(0, 100)}..."`);
  });

  // Test 5: POST /api/diagnose
  await test('Vercel Handler: POST /api/diagnose', async () => {
    const res = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-matched-path': '/api/diagnose'
      },
      body: JSON.stringify({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
        cropType: 'Tomato',
        language: 'en'
      })
    });
    const data = await res.json();
    assert(res.status === 200 || res.status === 503, `Unexpected status ${res.status}`);
    assert(typeof data === 'object');
    console.log(`   Diagnose status: ${res.status}`);
  });

  // Test 6: Unknown API route returns JSON 404 (NEVER HTML)
  await test('Vercel Handler: GET /api/unknown-endpoint returns JSON 404', async () => {
    const res = await fetch(`${baseUrl}/api/unknown-endpoint`, {
      headers: {
        'x-vercel-matched-path': '/api/unknown-endpoint'
      }
    });
    assert.strictEqual(res.status, 404);
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/json'), `Expected JSON 404, got: ${contentType}`);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    console.log(`   JSON 404:`, JSON.stringify(data));
  });

  server.close();

  console.log(`======================================================`);
  console.log(`🏁 VERCEL HANDLER RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log(`======================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

testVercelHandler().catch(err => {
  console.error('Vercel handler test error:', err);
  process.exit(1);
});
