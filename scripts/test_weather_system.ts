/**
 * Comprehensive Automated Test Suite for AgriVerse Weather Intelligence System
 * 
 * Verifies:
 * 1. Complete data flow: getWeatherForLocation -> weatherRepository -> FreeWeatherProvider -> Open-Meteo
 * 2. 3-tier status: 'REAL DATA', 'CACHED DATA', 'OFFLINE FALLBACK'
 * 3. Cache mechanics: 10-minute TTL and forceRefresh bypass
 * 4. Distinct hourly rain prob vs daily max rain prob
 * 5. Deterministic AgriVerse Agricultural Advisories with rule inputs
 * 6. Fallback safety: ZERO severe alerts generated on fallback
 * 7. Location integrity: Respects custom lat/lon without overriding to default
 */

import { freeWeatherProvider, generateAgriVerseAdvisories, FreeWeatherProvider } from '../src/services/providers/weatherProvider';
import { getWeatherForLocation } from '../src/services/weatherRepository';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING AGRIVERSE WEATHER SYSTEM AUDIT & TEST');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
    }
  }

  // TEST 1: Live Open-Meteo Fetch via FreeWeatherProvider
  console.log('--- TEST GROUP 1: Live Open-Meteo Fetch ---');
  try {
    const live = await freeWeatherProvider.getLiveWeatherData(13.4355, 77.7279, 'Chikkaballapura, Karnataka', true);
    assert(live.dataSourceStatus === 'REAL DATA', `Live data is marked 'REAL DATA' (got: ${live.dataSourceStatus})`);
    assert(!live.isOfflineData, `isOfflineData is false for live data`);
    assert(typeof live.temperature === 'number' && !isNaN(live.temperature), `Temperature is valid number (${live.temperature}°C)`);
    assert(typeof live.currentHourlyRainProb === 'number', `currentHourlyRainProb is present (${live.currentHourlyRainProb}%)`);
    assert(typeof live.dailyMaxRainProb === 'number', `dailyMaxRainProb is present (${live.dailyMaxRainProb}%)`);
    assert(live.hourlyForecast.length >= 24, `24-hour hourly forecast present (count: ${live.hourlyForecast.length})`);
    assert(live.dailyForecast.length >= 7, `7-day daily forecast present (count: ${live.dailyForecast.length})`);
    assert(live.location.name.includes('Chikkaballapura'), `Location name preserved correctly`);
  } catch (err) {
    assert(false, `Live fetch threw error: ${err}`);
  }

  // TEST 2: 10-Minute Local Cache Check
  console.log('\n--- TEST GROUP 2: Local 10-Minute Cache Mechanics ---');
  try {
    const cached = await freeWeatherProvider.getLiveWeatherData(13.4355, 77.7279, 'Chikkaballapura, Karnataka', false);
    assert(cached.dataSourceStatus === 'CACHED DATA', `Repeated request without forceRefresh is marked 'CACHED DATA' (got: ${cached.dataSourceStatus})`);
    assert(typeof cached.cachedAt === 'number' && cached.cachedAt > 0, `cachedAt timestamp exists (${cached.cachedAt})`);
  } catch (err) {
    assert(false, `Cache check threw error: ${err}`);
  }

  // TEST 3: Force Refresh Cache Bypass
  console.log('\n--- TEST GROUP 3: Force Refresh Bypass ---');
  try {
    const refreshed = await freeWeatherProvider.getLiveWeatherData(13.4355, 77.7279, 'Chikkaballapura, Karnataka', true);
    assert(refreshed.dataSourceStatus === 'REAL DATA', `forceRefresh=true returns fresh 'REAL DATA' (got: ${refreshed.dataSourceStatus})`);
  } catch (err) {
    assert(false, `Force refresh threw error: ${err}`);
  }

  // TEST 4: Non-Default Location Request
  console.log('\n--- TEST GROUP 4: Location Coordinate Integrity ---');
  try {
    const mysoreLat = 12.2958;
    const mysoreLon = 76.6394;
    const mysore = await freeWeatherProvider.getLiveWeatherData(mysoreLat, mysoreLon, 'Mysore, Karnataka', true);
    assert(mysore.location.lat === mysoreLat, `Latitude matches requested location (${mysore.location.lat})`);
    assert(mysore.location.lon === mysoreLon, `Longitude matches requested location (${mysore.location.lon})`);
    assert(mysore.location.name === 'Mysore, Karnataka', `Custom location name preserved without defaulting to Chikkaballapura`);
  } catch (err) {
    assert(false, `Custom location fetch threw error: ${err}`);
  }

  // TEST 5: Hourly Rain Probability vs Daily Max Separation
  console.log('\n--- TEST GROUP 5: Rain Probability Separation ---');
  try {
    const live = await freeWeatherProvider.getLiveWeatherData(13.4355, 77.7279, 'Chikkaballapura', false);
    assert(live.currentHourlyRainProb !== undefined, `Hourly rain probability is distinctly available`);
    assert(live.dailyMaxRainProb !== undefined, `Daily max rain probability is distinctly available`);
    console.log(`   ℹ️ Current Hourly Rain Prob: ${live.currentHourlyRainProb}% | Daily Max: ${live.dailyMaxRainProb}%`);
  } catch (err) {
    assert(false, `Rain separation check threw error: ${err}`);
  }

  // TEST 6: Deterministic AgriVerse Advisories & Rule Inputs
  console.log('\n--- TEST GROUP 6: Deterministic AgriVerse Advisories ---');
  const highRainAdvisories = generateAgriVerseAdvisories(28, 85, 88, 15.0, 14, 65, 'Chikkaballapura, Karnataka', false);
  assert(highRainAdvisories.length > 0, `Generates advisory for rainProb=88%, precip=15mm`);
  const rainAlert = highRainAdvisories.find(a => a.type === 'rain');
  assert(rainAlert !== undefined, `Rain advisory generated`);
  assert(rainAlert?.title.includes('Heavy Rain Advisory') ?? false, `Title correctly labeled as Heavy Rain Advisory`);
  assert(!rainAlert?.title.includes('Government Warning'), `Does NOT falsely claim to be an Official Government Warning`);
  assert(rainAlert?.isAgriVerseAdvisory === true, `Marked as isAgriVerseAdvisory`);
  assert(rainAlert?.source === 'Open-Meteo', `Source attribute is 'Open-Meteo'`);
  assert(rainAlert?.ruleInputs?.rainProbability === 88, `Rule inputs contain exact rain probability (88%)`);
  assert(rainAlert?.ruleInputs?.precipitationMm === 15.0, `Rule inputs contain exact precip (15.0 mm)`);
  assert(rainAlert?.ruleInputs?.humidity === 85, `Rule inputs contain exact humidity (85%)`);

  // Low rain check
  const lowRainAdvisories = generateAgriVerseAdvisories(28, 50, 10, 0, 10, 1, 'Chikkaballapura', false);
  const lowRainAlert = lowRainAdvisories.find(a => a.type === 'rain');
  assert(lowRainAlert === undefined, `No heavy rain advisory generated for rainProb=10%`);

  // TEST 7: Offline Fallback Resilience & Safety (No fabricated alerts)
  console.log('\n--- TEST GROUP 7: Offline Fallback Safety ---');
  // Fallback advisories check
  const fallbackAdvisories = generateAgriVerseAdvisories(28, 75, 88, 20.0, 14, 65, 'Chikkaballapura', true);
  assert(fallbackAdvisories.length === 0, `Zero severe weather advisories generated when isOfflineFallback=true`);

  // Instantiate isolated provider to test simulated network failure
  const isolatedProvider = new FreeWeatherProvider();
  // Call non-existent domain / port to force immediate failure
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Simulated Network Offline'); };

  try {
    const fallbackData = await isolatedProvider.getLiveWeatherData(13.4355, 77.7279, 'Fallback Region', true);
    assert(fallbackData.dataSourceStatus === 'OFFLINE FALLBACK', `Failed network returns 'OFFLINE FALLBACK' (got: ${fallbackData.dataSourceStatus})`);
    assert(fallbackData.isOfflineData === true, `isOfflineData is true on fallback`);
    assert(fallbackData.alerts.length === 0, `NO severe alerts generated on offline fallback data`);
    assert(fallbackData.dataSourceStatus !== 'REAL DATA', `Fallback is NEVER marked as REAL DATA`);
  } catch (err) {
    assert(false, `Offline fallback simulation error: ${err}`);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // TEST 8: weatherRepository Integration
  console.log('\n--- TEST GROUP 8: weatherRepository Integration ---');
  try {
    const repoWeather = await getWeatherForLocation(13.4355, 77.7279, 'Repo Test Village', true);
    assert(repoWeather !== null, `getWeatherForLocation returns valid LiveWeatherData`);
    assert(repoWeather.dataSourceStatus === 'REAL DATA', `weatherRepository routes to FreeWeatherProvider with REAL DATA`);
    assert(repoWeather.location.name === 'Repo Test Village', `weatherRepository passes customName correctly`);
  } catch (err) {
    assert(false, `weatherRepository test threw error: ${err}`);
  }

  // TEST 9: Exact Threshold Verification for All 6 Alert Conditions
  console.log('\n--- TEST GROUP 9: Alert Conditions Verification ---');
  
  // 1. Heavy Rain (hourly rain prob >= 80% OR precip >= 10mm OR WMO 63-67, 81, 82)
  const hr1 = generateAgriVerseAdvisories(25, 70, 80, 0, 10, 0, 'Test Location');
  assert(hr1.some(a => a.type === 'rain'), 'Heavy rain triggers at rainProb = 80%');
  assert(hr1.find(a => a.type === 'rain')?.recommendedAction.includes('Postpone spraying and check field drainage.') ?? false, 'Heavy rain has correct recommendation');

  const hr2 = generateAgriVerseAdvisories(25, 70, 50, 10.5, 10, 0, 'Test Location');
  assert(hr2.some(a => a.type === 'rain'), 'Heavy rain triggers at precip = 10.5mm');

  const hr3 = generateAgriVerseAdvisories(25, 70, 30, 2, 10, 65, 'Test Location');
  assert(hr3.some(a => a.type === 'rain'), 'Heavy rain triggers at WMO code 65 (heavy rain)');

  const hrNone = generateAgriVerseAdvisories(25, 70, 75, 5, 10, 2, 'Test Location');
  assert(!hrNone.some(a => a.type === 'rain'), 'Heavy rain does NOT trigger when rainProb=75%, precip=5mm, WMO=2');

  // 2. Thunderstorm (WMO 95-99)
  const t95 = generateAgriVerseAdvisories(25, 70, 20, 0, 10, 95, 'Test Location');
  assert(t95.some(a => a.type === 'thunderstorm'), 'Thunderstorm triggers at WMO 95');
  const t0 = generateAgriVerseAdvisories(25, 70, 20, 0, 10, 0, 'Test Location');
  assert(!t0.some(a => a.type === 'thunderstorm'), 'Thunderstorm does NOT trigger at WMO 0');

  // 3. Strong Wind (wind speed >= 25 km/h)
  const w25 = generateAgriVerseAdvisories(25, 70, 20, 0, 25, 0, 'Test Location');
  assert(w25.some(a => a.type === 'wind'), 'Strong wind triggers at windSpeed = 25 km/h');
  const w24 = generateAgriVerseAdvisories(25, 70, 20, 0, 24, 0, 'Test Location');
  assert(!w24.some(a => a.type === 'wind'), 'Strong wind does NOT trigger at windSpeed = 24 km/h');

  // 4. Extreme Heat (temp >= 35°C)
  const h35 = generateAgriVerseAdvisories(35, 40, 0, 0, 10, 0, 'Test Location');
  assert(h35.some(a => a.type === 'heat'), 'Extreme heat triggers at temp = 35°C');
  const h34 = generateAgriVerseAdvisories(34, 40, 0, 0, 10, 0, 'Test Location');
  assert(!h34.some(a => a.type === 'heat'), 'Extreme heat does NOT trigger at temp = 34°C');

  // 5. Frost/Cold (temp <= 10°C)
  const f10 = generateAgriVerseAdvisories(10, 60, 0, 0, 5, 0, 'Test Location');
  assert(f10.some(a => a.type === 'frost'), 'Frost/cold triggers at temp = 10°C');
  const f11 = generateAgriVerseAdvisories(11, 60, 0, 0, 5, 0, 'Test Location');
  assert(!f11.some(a => a.type === 'frost'), 'Frost/cold does NOT trigger at temp = 11°C');

  // 6. Flood/Risk (precip >= 25mm OR precip >= 15mm with rainProb >= 85 and humidity >= 90)
  const fl25 = generateAgriVerseAdvisories(24, 80, 50, 26, 10, 0, 'Test Location');
  assert(fl25.some(a => a.type === 'flood'), 'Flood risk triggers at precip = 26mm');
  const flSat = generateAgriVerseAdvisories(24, 92, 88, 16, 10, 0, 'Test Location');
  assert(flSat.some(a => a.type === 'flood'), 'Flood risk triggers at precip=16mm with rainProb=88% and humidity=92%');
  const flNone = generateAgriVerseAdvisories(24, 80, 50, 5, 10, 0, 'Test Location');
  assert(!flNone.some(a => a.type === 'flood'), 'Flood risk does NOT trigger under safe precipitation levels');

  // 7. Dynamic Alert Disappearance
  const severeNow = generateAgriVerseAdvisories(28, 85, 90, 15, 28, 95, 'Test Location');
  assert(severeNow.length >= 3, `Multiple alerts active during severe conditions (count: ${severeNow.length})`);
  const clearedNow = generateAgriVerseAdvisories(26, 60, 15, 0, 12, 1, 'Test Location');
  assert(clearedNow.length === 0, 'Alerts immediately clear when weather conditions improve');

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed}/${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('====================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
