import {
  getAllKarnatakaFpos,
  filterKarnatakaFpos,
  getUniqueDistricts,
  getUniqueMajorCrops,
  getUniqueLegalForms,
  getFpoById,
  isValidFpoRecord
} from '../src/services/fpoService';
import rawData from '../src/data/karnatakaFposData.json';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

async function runAllFpoTests() {
  console.log('====================================================');
  console.log('RUNNING KARNATAKA FPO DIRECTORY VERIFICATION TESTS');
  console.log('====================================================\n');

  // Test 1: Complete Official Data Loading
  console.log('--- Test 1: Data Loading & Record Count ---');
  const allFpos = getAllKarnatakaFpos();
  assert(allFpos.length === 125, `Expected exactly 125 official SFAC Karnataka FPO records, got ${allFpos.length}`);
  assert(Array.isArray(rawData) && rawData.length === 125, `Raw JSON must have 125 records`);

  // Test 2: Validation of Required Fields
  console.log('\n--- Test 2: Required Fields Validation ---');
  allFpos.forEach((fpo, index) => {
    assert(isValidFpoRecord(fpo), `Record #${index + 1} (${fpo.fpoName}) failed validation`);
    assert(fpo.state === 'Karnataka', `Record #${index + 1} state must be Karnataka`);
    assert(!!fpo.fpoName && fpo.fpoName !== 'Not available', `Record #${index + 1} must have a real FPO name`);
    assert(!!fpo.district && fpo.district !== 'Not available', `Record #${index + 1} must have a valid district`);
    assert(!!fpo.registrationNumber && fpo.registrationNumber !== 'Not available', `Record #${index + 1} must have a CIN/Registration number`);
    assert(fpo.sourceUrl.includes('sfacindia.com'), `Record #${index + 1} must link to official SFAC source`);
    assert(fpo.verificationStatus === 'Government Listed', `Record #${index + 1} verification status must be 'Government Listed'`);
  });

  // Test 3: Status Rule - No Fake "Live" or "Active Now" Claims
  console.log('\n--- Test 3: Status Integrity & Online Status Separation ---');
  allFpos.forEach((fpo, index) => {
    assert(fpo.onlineStatus === 'Unknown' || fpo.onlineStatus === 'Offline' || fpo.onlineStatus === 'Online',
      `Record #${index + 1} onlineStatus must be controlled, got ${fpo.onlineStatus}`);
    assert((fpo as any).live !== true && (fpo as any).activeNow !== true,
      `Record #${index + 1} must NEVER be labeled as live or active without proof`);
    assert(fpo.communityStatus === 'NOT CONNECTED',
      `Record #${index + 1} community status must default to 'NOT CONNECTED'`);
  });

  // Test 4: All 30 Districts Represented
  console.log('\n--- Test 4: Karnataka Districts Coverage ---');
  const districts = getUniqueDistricts();
  console.log(`Unique districts count: ${districts.length}`);
  assert(districts.length === 30, `Expected all 30 Karnataka districts, found ${districts.length}`);
  assert(districts.includes('Chikkaballapura'), 'Chikkaballapura must be present in districts');
  assert(districts.includes('Kolar'), 'Kolar must be present in districts');
  assert(districts.includes('Bidar'), 'Bidar must be present in districts');
  assert(districts.includes('Tumakuru'), 'Tumakuru must be present in districts');

  // Test 5: Major Crops Coverage
  console.log('\n--- Test 5: Major Crops Extracted ---');
  const crops = getUniqueMajorCrops();
  console.log(`Unique crop categories: ${crops.length}`);
  assert(crops.length > 20, `Expected wide variety of crops, got ${crops.length}`);
  assert(crops.some(c => c.toLowerCase().includes('tomato')), 'Tomato crop must be present');
  assert(crops.some(c => c.toLowerCase().includes('ragi')), 'Ragi crop must be present');
  assert(crops.some(c => c.toLowerCase().includes('chilli')), 'Chilli crop must be present');
  assert(crops.some(c => c.toLowerCase().includes('paddy') || c.toLowerCase().includes('rice')), 'Paddy/Rice must be present');

  // Test 6: Legal Forms
  console.log('\n--- Test 6: Legal Forms ---');
  const legalForms = getUniqueLegalForms();
  assert(legalForms.includes('Producer Company'), 'Producer Company must be in legal forms');
  assert(legalForms.includes('Cooperative Society'), 'Cooperative Society must be in legal forms');

  // Test 7: Search by Name, District, Taluk/Address, Crops, Reg No
  console.log('\n--- Test 7: Multi-Field Search Capabilities ---');
  
  // 7a: District search
  const chikkaResults = filterKarnatakaFpos({ searchQuery: 'Chikkaballapura' });
  assert(chikkaResults.length > 0, `Search for 'Chikkaballapura' should return results, got ${chikkaResults.length}`);
  assert(chikkaResults.every(r => r.district.toLowerCase().includes('chikkaballapura') || r.address.toLowerCase().includes('chikkaballapura')), 
    'All Chikkaballapura search results must match district or address');

  // 7b: Crop search - Tomato
  const tomatoResults = filterKarnatakaFpos({ searchQuery: 'Tomato' });
  assert(tomatoResults.length > 0, `Search for 'Tomato' should return results, got ${tomatoResults.length}`);

  // 7c: Crop search - Ragi
  const ragiResults = filterKarnatakaFpos({ searchQuery: 'Ragi' });
  assert(ragiResults.length > 0, `Search for 'Ragi' should return results, got ${ragiResults.length}`);

  // 7d: Crop search - Millets
  const milletResults = filterKarnatakaFpos({ searchQuery: 'Millets' });
  assert(milletResults.length > 0, `Search for 'Millets' should return results, got ${milletResults.length}`);

  // 7e: Registration number / CIN search
  const testRegNo = allFpos[0].registrationNumber;
  const regResults = filterKarnatakaFpos({ searchQuery: testRegNo });
  assert(regResults.length >= 1, `Search by exact CIN/Registration number '${testRegNo}' should match`);

  // 7f: FPO query term
  const fpoResults = filterKarnatakaFpos({ searchQuery: 'Cooperative' });
  assert(fpoResults.length > 0, `Search for 'Cooperative' should return cooperative organizations`);

  // Test 8: Filter Dropdowns
  console.log('\n--- Test 8: District, Crop, and Legal Form Filters ---');
  const kolarFilter = filterKarnatakaFpos({ district: 'Kolar' });
  assert(kolarFilter.length > 0 && kolarFilter.every(f => f.district === 'Kolar'), 'Kolar district filter must only return Kolar FPOs');

  const pcFilter = filterKarnatakaFpos({ legalForm: 'Producer Company' });
  assert(pcFilter.length > 0 && pcFilter.every(f => f.legalForm.includes('Producer Company')), 'Producer Company filter must only return Producer Companies');

  // Test 9: District Priority
  console.log('\n--- Test 9: User District Prioritization ---');
  const prioritized = filterKarnatakaFpos({ userDistrict: 'Chikkaballapura' });
  assert(prioritized.length === 125, 'District priority must preserve all 125 records');
  assert(prioritized[0].district === 'Chikkaballapura', 'Top record must be from user district Chikkaballapura');

  // Test 10: Missing Data Handling & Contact Safety
  console.log('\n--- Test 10: Missing Data Handling & Contact Safety ---');
  // 10a: Test contact safety on live records
  allFpos.forEach(fpo => {
    if (fpo.contact) {
      assert(!fpo.contact.includes('whatsapp') && !fpo.contact.includes('chat'), 'No fake whatsapp or chat links should be in contact');
    }
  });

  // 10b: Test fallback to 'Not available' when optional/required fields are missing in raw records
  const incompleteRecord = {
    fpoName: 'Test Incomplete FPO',
    district: 'Kolar',
    registrationNumber: 'TEST-123',
    sourceUrl: 'https://sfacindia.com/PDFs/test.pdf'
    // contact, email, address, crops omitted
  };
  assert(isValidFpoRecord(incompleteRecord), 'Incomplete record with minimum required fields must still be valid');
  
  const invalidRecord = {
    fpoName: '', // empty name
    district: 'Kolar'
  };
  assert(!isValidFpoRecord(invalidRecord), 'Record missing required fields must be rejected');

  // Test 11: Empty Search Results
  console.log('\n--- Test 11: Empty Search State ---');
  const emptyResults = filterKarnatakaFpos({ searchQuery: 'NonExistentCropOrFpo123xyz' });
  assert(emptyResults.length === 0, 'Non-matching query must return 0 results');

  // Test 12: Source Transparency & Verification Links
  console.log('\n--- Test 12: Source Transparency & Verification Links ---');
  const fpo1 = getFpoById('sfac-ka-1');
  assert(!!fpo1, 'FPO sfac-ka-1 must be retrievable by ID');
  assert(fpo1!.sourceName.includes('SFAC'), 'Source name must credit SFAC');
  assert(fpo1!.sourceUrl.endsWith('.pdf'), 'Source URL must point to the official PDF');
  assert(fpo1!.portalUrl === 'https://sfacindia.com/FPOS.aspx', 'Portal URL must point to SFAC FPO portal');

  console.log('\n====================================================');
  console.log('🎉 ALL 12 FPO DIRECTORY TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runAllFpoTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
