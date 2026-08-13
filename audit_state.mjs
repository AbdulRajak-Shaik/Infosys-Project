/**
 * Comprehensive audit script - checks current state of translations
 * 1. What keys exist in adminTranslations.ts for EN
 * 2. What t() calls are in App.tsx, AdminDashboard.tsx, MorePages.tsx, Sidebar.tsx
 * 3. Which t() keys are missing from adminTranslations.ts
 */
import { readFileSync } from 'fs';

const adminTransFile = readFileSync('./AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts', 'utf8');
const indexTransFile = readFileSync('./AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/index.ts', 'utf8');

// Extract all keys from English section of adminTranslations
const enStart = adminTransFile.indexOf('"en": {');
const enEnd = adminTransFile.indexOf('"hi": {', enStart);
const enSection = adminTransFile.slice(enStart, enEnd);
const adminEnKeys = new Set();
const keyPat = /"([^"]+)":\s*"[^"]*"/g;
let m;
while ((m = keyPat.exec(enSection)) !== null) {
  if (m[1] !== 'en') adminEnKeys.add(m[1]);
}

// Extract all keys from English section of index.ts
const indexEnStart = indexTransFile.indexOf('"en": {');
const indexEnEnd = indexTransFile.indexOf('"hi": {', indexEnStart);
const indexEnSection = indexTransFile.slice(indexEnStart, indexEnEnd);
const indexEnKeys = new Set();
const keyPat2 = /"([^"]+)":\s*"[^"]*"/g;
while ((m = keyPat2.exec(indexEnSection)) !== null) {
  if (m[1] !== 'en') indexEnKeys.add(m[1]);
}

console.log(`adminTranslations.ts EN keys: ${adminEnKeys.size}`);
console.log(`index.ts EN keys: ${indexEnKeys.size}`);

// Now scan Admin component files for t() calls
const files = [
  './AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/App.tsx',
  './AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/pages/AdminDashboard.tsx',
  './AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/pages/MorePages.tsx',
  './AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/components/Sidebar.tsx',
];

const usedKeys = new Set();
const tCallPat = /\bt\('([^']+)'\)/g;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  while ((m = tCallPat.exec(src)) !== null) {
    usedKeys.add(m[1]);
  }
}

console.log(`\nTotal t() keys used in admin files: ${usedKeys.size}`);

// Find keys that are used but NOT in any translation
const missingFromBoth = [];
const inAdminOnly = [];
const inIndexOnly = [];
for (const key of usedKeys) {
  const inAdmin = adminEnKeys.has(key);
  const inIndex = indexEnKeys.has(key);
  if (!inAdmin && !inIndex) {
    missingFromBoth.push(key);
  } else if (inAdmin && !inIndex) {
    inAdminOnly.push(key);
  } else if (!inAdmin && inIndex) {
    inIndexOnly.push(key);
  }
}

console.log(`\n=== MISSING FROM BOTH (need to add): ${missingFromBoth.length} ===`);
missingFromBoth.forEach(k => console.log(' -', k));

// Check Hindi stubs in index.ts
const hiStart = indexTransFile.indexOf('"hi": {');
const hiEnd = indexTransFile.indexOf('"te": {', hiStart);
const hiSection = indexTransFile.slice(hiStart, hiEnd);
const stubsInHindi = [];
const stubPat = /"([^"]+)":\s*"([^"]*?)"/g;
while ((m = stubPat.exec(hiSection)) !== null) {
  if (m[1] === m[2]) {
    stubsInHindi.push(m[1]);
  }
}
console.log(`\n=== STUB KEYS in Hindi (index.ts value === key): ${stubsInHindi.length} ===`);
// Only show ones used in admin files
const adminStubs = stubsInHindi.filter(k => usedKeys.has(k));
console.log(`Of those, ${adminStubs.length} are actually used in admin UI:`);
adminStubs.forEach(k => console.log(' -', k));
