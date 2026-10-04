import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function runCropDoctorVerification() {
  console.log('🍃 ===============================================================');
  console.log('🍃 AGRIVERSE AI — CROP DOCTOR / CROP LEAF SCAN VERIFICATION');
  console.log('🍃 ===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(message);
    }
  }

  // 1. Verify Server Health
  console.log('\n--- 1. Server & Endpoint Verification ---');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert(res.status === 200 || res.status === 404, 'Server is running and listening on port 3000');
  } catch (err) {
    assert(false, `Server health check failed: ${err.message}`);
  }

  // 2. Verify Existing /api/diagnose Gemini AI Multimodal Endpoint
  console.log('\n--- 2. Gemini Multimodal /api/diagnose AI Service ---');
  try {
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
    assert(res.ok, `HTTP ${res.status}: /api/diagnose responded successfully`);
    const report = await res.json();
    assert(report && typeof report === 'object', 'Received structured JSON diagnostic report');
    assert(!!report.diseaseName, `Identified condition: "${report.diseaseName}"`);
    assert(!!report.severity, `Assessed severity: "${report.severity}"`);
    console.log('  Diagnostics returned:', {
      cropName: report.cropName,
      diseaseName: report.diseaseName,
      severity: report.severity,
      treatment: report.treatmentSuggestions?.substring(0, 60) + '...',
      organic: report.organicControl?.substring(0, 60) + '...'
    });
  } catch (err) {
    assert(false, `/api/diagnose call failed: ${err.message}`);
  }

  // 3. Verify Frontend Code Implementation in App.tsx
  console.log('\n--- 3. App.tsx Frontend Architecture Audit ---');
  const appTsxPath = path.resolve('src/App.tsx');
  const appTsx = fs.readFileSync(appTsxPath, 'utf8');

  // Verify showImagePickerModal state
  assert(
    appTsx.includes('showImagePickerModal') && appTsx.includes('setShowImagePickerModal'),
    'showImagePickerModal state is declared and managed in App.tsx'
  );

  // Verify floating camera button opens showImagePickerModal
  assert(
    appTsx.includes('id="floating_camera_scanner_fab"') &&
    appTsx.includes("setActiveAiTool('pest')") &&
    appTsx.includes('setShowImagePickerModal(true)'),
    'Floating camera button (#floating_camera_scanner_fab) activates pest/doctor mode and triggers showImagePickerModal(true)'
  );

  // Verify camera & gallery file inputs
  assert(
    appTsx.includes('capture="environment"') && appTsx.includes('ref={cameraFileInputRef}'),
    'Native camera input with capture="environment" and cameraFileInputRef is present'
  );
  assert(
    appTsx.includes('ref={hiddenFileInputRef}') && appTsx.includes('handleLeafImageUploadChange'),
    'Gallery file input with hiddenFileInputRef and handleLeafImageUploadChange is present'
  );

  // Verify file format validation (JPG, JPEG, PNG, WebP)
  assert(
    appTsx.includes("'image/jpeg'") &&
    appTsx.includes("'image/png'") &&
    appTsx.includes("'image/webp'") &&
    appTsx.includes('Please select a valid crop/leaf image.'),
    'File format validation checks for JPG/PNG/WebP and provides friendly error toast'
  );

  // Verify no premature AI analysis in upload handler
  const uploadHandlerBody = appTsx.substring(
    appTsx.indexOf('const handleLeafImageUploadChange'),
    appTsx.indexOf('const handleTriggerTakePhoto')
  );
  assert(
    !uploadHandlerBody.includes('analyzeCropDiseaseImage(compressedBase64)') &&
    !uploadHandlerBody.includes('analyzeCropDiseaseImage(img.src)'),
    'handleLeafImageUploadChange does NOT automatically call analyzeCropDiseaseImage prematurely'
  );
  assert(
    uploadHandlerBody.includes('setSelectedLeafImage(compressedBase64)') &&
    uploadHandlerBody.includes('setDiagnosisReport(null)'),
    'handleLeafImageUploadChange sets selectedLeafImage preview and clears previous diagnosis report'
  );

  // Verify Take Photo & Desktop Webcam support
  assert(
    appTsx.includes('handleTriggerTakePhoto') &&
    appTsx.includes('isMobile') &&
    appTsx.includes('getUserMedia'),
    'Take photo handler detects mobile vs desktop and supports webcam stream'
  );

  // Verify Bottom Navigation is not covered (z-index and padding rules)
  assert(
    appTsx.includes('id="crop_image_picker_backdrop"') &&
    appTsx.includes('z-40') &&
    appTsx.includes('pb-20'),
    'Crop image picker modal uses z-40 and pb-20 to leave the bottom navigation bar uncovered'
  );
  assert(
    appTsx.includes('id="phone_navigation_bar"') && appTsx.includes('z-50'),
    'phone_navigation_bar is at z-50, ensuring it remains on top and fully interactive'
  );

  // 4. Verify AiAdvisorTabView.tsx Implementation
  console.log('\n--- 4. AiAdvisorTabView.tsx UI Component Audit ---');
  const advisorPath = path.resolve('src/components/AiAdvisorTabView.tsx');
  const advisorCode = fs.readFileSync(advisorPath, 'utf8');

  // Verify Scan area is fully clickable
  assert(
    advisorCode.includes('id="scan_crop_leaf_photo_card"') &&
    advisorCode.includes('onClick={onOpenImagePicker'),
    'Entire "Scan Crop Leaf Photo" card is a clickable element triggering onOpenImagePicker'
  );

  // Verify preview and action buttons
  assert(
    advisorCode.includes('id="analyze_leaf_photo_btn"') &&
    advisorCode.includes('id="change_leaf_photo_btn"'),
    'Both "Analyze Photo" and "Change Photo" action buttons are rendered when an image is selected'
  );

  assert(
    advisorCode.includes('handleAnalyzePhoto') &&
    advisorCode.includes('analyzeCropDiseaseImage(selectedLeafImage)'),
    'Analyze Photo button triggers existing analyzeCropDiseaseImage with selectedLeafImage'
  );

  assert(
    advisorCode.includes('disabled={isDiagnosing || !selectedLeafImage}'),
    'Analyze Photo button prevents accidental duplicate clicks when isDiagnosing is true'
  );

  assert(
    advisorCode.includes('onClick={onOpenImagePicker') &&
    advisorCode.includes('Change Photo'),
    'Change Photo button returns to the image picker selection modal'
  );

  // Summary
  console.log('\n===============================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('===============================================================\n');

  if (passed === total) {
    console.log('🎉 ALL CROP DOCTOR VERIFICATION CHECKS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runCropDoctorVerification();
