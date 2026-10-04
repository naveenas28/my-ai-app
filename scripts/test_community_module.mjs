import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 RUNNING AGRIVERSE AI COMMUNITY MODULE VERIFICATION SUITE\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Verify firestore.rules
console.log('1. Checking firestore.rules for Community & Chat security...');
const rulesContent = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');

assert(rulesContent.includes('match /posts/{postId}'), 'Rules contain /posts/{postId} match');
assert(rulesContent.includes('allow create: if isAuthenticated() && request.resource.data.authorUid == request.auth.uid'), 'Rules enforce authenticated UID match on post creation');
assert(rulesContent.includes('allow read: if true'), 'Rules allow reading community posts');
assert(rulesContent.includes('match /chats/{chatId}'), 'Rules contain /chats/{chatId} match');
assert(!rulesContent.includes('match /chats/{chatId} {\n      allow read, write: if true;'), 'Chat rooms are NOT globally open');
assert(rulesContent.includes('request.auth.uid in resource.data.members') || rulesContent.includes('type == \'group\''), 'Private chats restricted to authorized room members');

// 2. Verify VoicePostsSystem.tsx
console.log('\n2. Checking VoicePostsSystem.tsx implementation...');
const voicePostsContent = fs.readFileSync(path.join(rootDir, 'src', 'components', 'VoicePostsSystem.tsx'), 'utf8');

assert(!voicePostsContent.includes('WhatsApp Simple'), 'No "WhatsApp Simple" badge remains');
assert(!voicePostsContent.includes('WHATSAPP SIMPLE'), 'No "WHATSAPP SIMPLE" remains');
assert(voicePostsContent.includes('VOICE COMMUNITY'), 'Uses professional "VOICE COMMUNITY" badge');
assert(voicePostsContent.includes('Voice update published successfully.'), 'Dispatches required success message');
assert(voicePostsContent.includes('selectedCropTag'), 'Includes crop selection tag');
assert(voicePostsContent.includes('selectedPostDistrict'), 'Includes district selection');
assert(voicePostsContent.includes('selectedPostVillage'), 'Includes village selection');
assert(voicePostsContent.includes('authorUid:'), 'Associates author UID with voice post');
assert(voicePostsContent.includes('auth.currentUser'), 'Uses authenticated Firebase user');

// 3. Verify FarmerChatSystem.tsx
console.log('\n3. Checking FarmerChatSystem.tsx implementation...');
const chatContent = fs.readFileSync(path.join(rootDir, 'src', 'components', 'FarmerChatSystem.tsx'), 'utf8');

assert(!chatContent.includes('title="Online Member"'), 'Removed fake online member status dot');
assert(!chatContent.includes('w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse'), 'Removed fake pulsating realtime dot');
assert(chatContent.includes('where(\'type\', \'==\', \'group\')'), 'Queries authorized group rooms cleanly');
assert(chatContent.includes('where(\'members\', \'array-contains\''), 'Queries authorized private chats for member isolation');
assert(chatContent.includes('members: [currentUid, farmer.uid]'), 'Direct chats create authorized room with participant UIDs');

// 4. Verify Server /api/posts Endpoint
console.log('\n4. Testing /api/posts endpoint on localhost:3000...');

async function testServerApi() {
  const getPosts = () => new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/posts', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });

  const postVoice = (payload) => new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = http.request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  try {
    const getRes = await getPosts();
    assert(getRes.status === 200, `GET /api/posts returned HTTP ${getRes.status}`);
    assert(Array.isArray(getRes.body), `GET /api/posts returned array with ${getRes.body?.length} posts`);

    // Test posting a voice update
    const testPost = {
      id: `test_voice_${Date.now()}`,
      author: 'Ramesh Gowda',
      authorUid: 'farmer_ramesh_123',
      title: 'Tomato Pest Alert Kolar',
      content: 'Tomato Pest Alert Kolar — "Noticed leaf curling in field"',
      transcript: 'Noticed leaf curling in field',
      voiceCaption: 'Noticed leaf curling in field',
      district: 'Kolar',
      village: 'Bangarapet',
      crop: 'Tomato',
      category: 'tomato',
      postType: 'voice',
      voiceUrl: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      voiceDuration: 6
    };

    const postRes = await postVoice(testPost);
    assert(postRes.status === 200 || postRes.status === 201, `POST /api/posts returned HTTP ${postRes.status}`);
    assert(postRes.body?.id === testPost.id || postRes.body?.post?.id === testPost.id || postRes.body?.success, 'POST /api/posts successfully recorded voice post');

    // Verify it appears in GET /api/posts
    const getAfter = await getPosts();
    const found = getAfter.body?.find(p => p.id === testPost.id || p.title === testPost.title);
    assert(!!found, 'New voice update is retrieved in /api/posts feed');
    if (found) {
      assert(found.postType === 'voice', 'Voice post has postType == "voice"');
      assert(found.crop === 'Tomato', 'Voice post has crop == "Tomato"');
      assert(found.district === 'Kolar', 'Voice post has district == "Kolar"');
    }
  } catch (err) {
    console.error('API test error:', err);
    assert(false, `API communication failed: ${err.message}`);
  }

  // 5. Verification of Unrelated Modules
  console.log('\n5. Verifying unrelated modules remain untouched...');
  const weatherFile = fs.readFileSync(path.join(rootDir, 'src', 'components', 'WeatherIntelligence.tsx'), 'utf8');
  assert(weatherFile.includes('Open-Meteo'), 'Weather Intelligence still uses Open-Meteo');

  const irrigationFile = fs.readFileSync(path.join(rootDir, 'src', 'components', 'SmartIrrigationAdvisor.tsx'), 'utf8');
  assert(!irrigationFile.includes('SENSORS ACTIVE'), 'Smart Irrigation clean without fake sensor claims');

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passCount + failCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: ${failCount}`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

testServerApi();
