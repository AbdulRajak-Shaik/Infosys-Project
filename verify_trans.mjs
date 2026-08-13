import { readFileSync } from 'fs';
const t = readFileSync('./AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts', 'utf8');
console.log('File size:', t.length, 'bytes');
const langs = [...t.matchAll(/^\s{2}"([a-z]{2,3})"\s*:\s*\{/gm)].map(m => m[1]);
console.log('Languages found:', langs.join(', '));
console.log('Total:', langs.length);

// Check a few key values for hi
const hiIdx = t.indexOf('"hi": {');
const hiSection = t.slice(hiIdx, t.indexOf('"te": {', hiIdx));
const cancelMatch = hiSection.match(/"cancel":\s*"([^"]+)"/);
const deleteMatch = hiSection.match(/"deleteUser":\s*"([^"]+)"/);
const notifMatch = hiSection.match(/"notifications":\s*"([^"]+)"/);
console.log('\nHindi samples:');
console.log('cancel:', cancelMatch?.[1]);
console.log('deleteUser:', deleteMatch?.[1]);
console.log('notifications:', notifMatch?.[1]);
