/**
 * This script identifies all keys in index.ts where value equals key (untranslated stubs)
 * and reports which admin pages are affected.
 */
import { readFileSync } from 'fs';

const text = readFileSync('./AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/index.ts', 'utf8');
const adminText = readFileSync('./AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts', 'utf8');

// Find stub values in Hindi (hi) section -- pattern: "key": "key",
// Find the hi section
const hiStart = text.indexOf('"hi": {');
const hiEnd = text.indexOf('"te": {', hiStart);
if (hiStart === -1 || hiEnd === -1) {
  console.log('Could not find hi section');
  process.exit(1);
}
const hiSection = text.slice(hiStart, hiEnd);

// Find all "key": "same_value" stubs
const stubPattern = /"([^"]+)": "([^"]+)"/g;
let match;
const stubs = [];
while ((match = stubPattern.exec(hiSection)) !== null) {
  const key = match[1];
  const val = match[2];
  if (key === val) {
    stubs.push(key);
  }
}

console.log(`Found ${stubs.length} stub keys in Hindi section:\n`);
stubs.forEach(k => console.log(' -', k));

// Check which stubs are covered by adminTranslations
const hiAdminStart = adminText.indexOf('"hi": {');
const hiAdminEnd = adminText.indexOf('"te": {', hiAdminStart);
const hiAdminSection = adminText.slice(hiAdminStart, hiAdminEnd);

let coveredByAdmin = 0;
let notCovered = [];
stubs.forEach(key => {
  if (hiAdminSection.includes(`"${key}"`)) {
    coveredByAdmin++;
  } else {
    notCovered.push(key);
  }
});

console.log(`\n${coveredByAdmin} stubs are already in adminTranslations.ts (but still being overridden by index.ts stubs!)`);
console.log(`\n${notCovered.length} stubs NOT in adminTranslations.ts:`);
notCovered.forEach(k => console.log(' -', k));
