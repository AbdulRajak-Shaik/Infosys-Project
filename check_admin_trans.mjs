import { readFileSync } from 'fs';

const text = readFileSync('./AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts', 'utf8');

// Find top-level language keys by looking for pattern: "xx": {
const topLevelLangs = [];
const langKeyPattern = /^\s{2}"([a-z]{2,3})"\s*:\s*\{/gm;
let match;
while ((match = langKeyPattern.exec(text)) !== null) {
  topLevelLangs.push(match[1]);
}
console.log('Languages in adminTranslations.ts:', topLevelLangs.join(', '));
console.log('Total languages:', topLevelLangs.length);

// Check for English keys
const enSection = text.match(/"en"\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
if (enSection) {
  const enKeys = [];
  const keyPattern = /"([^"]+)"\s*:/g;
  let km;
  while ((km = keyPattern.exec(enSection[1])) !== null) {
    enKeys.push(km[1]);
  }
  console.log('\nTotal English admin keys:', enKeys.length);
}
