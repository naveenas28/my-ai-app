import fs from 'fs';

// 1. Update agricultureQuestionRouter.ts
let router = fs.readFileSync('src/server/agricultureQuestionRouter.ts', 'utf8');

// Location extraction refinement
const oldLocCode = `  // Dynamic extraction for location if not in LOCATION_PATTERNS
  if (!detectedDistrict) {
    const apmcMatch = text.match(/\\b([a-zA-Z\\s]+?)\\s+(?:apmc|mandi|market|yard)\\b/i);
    if (apmcMatch && apmcMatch[1]) {
      const cand = apmcMatch[1].trim();
      if (cand.length > 2 && !['what', 'the', 'my', 'current', 'today', 'price of'].includes(cand.toLowerCase())) {
        detectedDistrict = cand.replace(/^(price of|rate of|in|at)\\s+/i, '').trim();
      }
    } else {
      const inMatch = text.match(/\\b(?:in|at|near)\\s+([a-zA-Z\\s]+?)(?:\\s+(?:apmc|mandi|market|yard|\\?|$)|$)/i);
      if (inMatch && inMatch[1]) {
        const cand = inMatch[1].trim();
        if (cand.length > 2 && !['what', 'the', 'my', 'current', 'today'].includes(cand.toLowerCase())) {
          detectedDistrict = cand;
        }
      }
    }
  }`;

const newLocCode = `  // Dynamic extraction for location if not in LOCATION_PATTERNS
  if (!detectedDistrict) {
    const apmcMatch = text.match(/(?:in|at|near)\\s+([a-zA-Z\\s]{2,30}?)\\s+(?:apmc|mandi|market|yard)/i) ||
                      text.match(/(?:in|at|near)\\s+([a-zA-Z\\s]{2,30}?)(?:\\?|$)/i);
    if (apmcMatch && apmcMatch[1]) {
      const cand = apmcMatch[1].trim();
      if (cand.length >= 2 && !['what', 'the', 'my', 'current', 'today', 'price of'].includes(cand.toLowerCase())) {
        detectedDistrict = cand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
  }`;

if (router.includes(oldLocCode)) {
  router = router.replace(oldLocCode, newLocCode);
}

fs.writeFileSync('src/server/agricultureQuestionRouter.ts', router, 'utf8');
console.log('src/server/agricultureQuestionRouter.ts updated.');

// 2. Update krishiAgent.ts
let agent = fs.readFileSync('src/server/krishiAgent.ts', 'utf8');

// In synthesizeGroundedAgriAnswer:
// Put fake scheme check at the top of government schemes block
const schemeBlockStart = `  // 3. GOVERNMENT SCHEMES & LOANS & SUBSIDIES
  else if (
    routing.category === 'GOVERNMENT_SCHEME' ||
    routing.category === 'LOAN' ||
    routing.category === 'INSURANCE' ||
    routing.category === 'SUBSIDY' ||
    lower.includes('scheme') ||
    lower.includes('kcc') ||
    lower.includes('kisan credit') ||
    lower.includes('subvention') ||
    lower.includes('yojana')
  ) {`;

const schemeBlockPatched = `  // 3. GOVERNMENT SCHEMES & LOANS & SUBSIDIES
  else if (
    routing.category === 'GOVERNMENT_SCHEME' ||
    routing.category === 'LOAN' ||
    routing.category === 'INSURANCE' ||
    routing.category === 'SUBSIDY' ||
    lower.includes('scheme') ||
    lower.includes('kcc') ||
    lower.includes('kisan credit') ||
    lower.includes('subvention') ||
    lower.includes('yojana')
  ) {
    if (lower.includes('gold coin') || lower.includes('free tractor') || lower.includes('tractor gold') || (lower.includes('tractor') && lower.includes('2026') && lower.includes('phone'))) {
      answer = \`⚠️ **Verification Notice**: There is **no official Government of India or State scheme** titled "PM Free Tractor Gold Coin" or offering free gold coins / free tractors with eligibility phone numbers.

• **Official Truth**:
  - Genuine farm mechanization assistance is administered exclusively under **SMAM (Sub-Mission on Agricultural Mechanization)**, providing 40% to 50% capital subsidy on authorized tractors and implements through official state portals.
  - The Government of India never charges processing fees or promises free gold coins over SMS, WhatsApp, or unregistered phone numbers.
• **Official Portals**:
  - Always verify central and state schemes at official government domains: **agricoop.gov.in**, **farmech.gov.in**, and **myscheme.gov.in**.\`;
    } else `;

if (agent.includes(schemeBlockStart) && !agent.includes('Verification Notice**: There is **no official Government of India')) {
  agent = agent.replace(schemeBlockStart, schemeBlockPatched);
}

// In PEST_DISEASE / CROP_ADVICE / GENERAL_AGRICULTURE block:
// Include natural farming / zbnf / jeevamrutha condition in category check
const pestBlockTarget = "else if (routing.category === 'PEST_DISEASE' || routing.category === 'CROP_ADVICE' || lower.includes('disease') || lower.includes('pest') || lower.includes('leaf') || lower.includes('spray') || lower.includes('harvest') || lower.includes('watermelon') || lower.includes('mildew')) {";
const pestBlockReplacement = "else if (routing.category === 'PEST_DISEASE' || routing.category === 'CROP_ADVICE' || routing.category === 'GENERAL_AGRICULTURE' || lower.includes('jeevamrutha') || lower.includes('zbnf') || lower.includes('natural farming') || lower.includes('disease') || lower.includes('pest') || lower.includes('leaf') || lower.includes('spray') || lower.includes('harvest') || lower.includes('watermelon') || lower.includes('mildew')) {";

if (agent.includes(pestBlockTarget)) {
  agent = agent.replace(pestBlockTarget, pestBlockReplacement);
}

// Ensure "Price data is currently unavailable" is clearly stated when market price not found
agent = agent.replace(
  "answer = `I couldn't verify current market data for **${targetCrop}** in **${targetDistrict}** right now.",
  "answer = `Price data is currently unavailable for **${targetCrop}** in **${targetDistrict}** at this time."
);

fs.writeFileSync('src/server/krishiAgent.ts', agent, 'utf8');
console.log('src/server/krishiAgent.ts updated.');
