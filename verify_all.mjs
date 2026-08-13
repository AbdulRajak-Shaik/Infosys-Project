import { TRANSLATIONS } from './Frontend/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/src/translations/index.ts';
import { ADMIN_TRANSLATIONS } from './AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts';

const scripts = {
  hi: { name: 'Hindi', regex: /[\u0900-\u097F]/ },
  te: { name: 'Telugu', regex: /[\u0C00-\u0C7F]/ },
  ta: { name: 'Tamil', regex: /[\u0B80-\u0BFF]/ },
  kn: { name: 'Kannada', regex: /[\u0C80-\u0CFF]/ },
  ml: { name: 'Malayalam', regex: /[\u0D00-\u0D7F]/ },
  mr: { name: 'Marathi', regex: /[\u0900-\u097F]/ },
  bn: { name: 'Bengali', regex: /[\u0980-\u09FF]/ },
  gu: { name: 'Gujarati', regex: /[\u0A80-\u0AFF]/ },
  pa: { name: 'Punjabi', regex: /[\u0A00-\u0A7F]/ },
  or: { name: 'Odia', regex: /[\u0B00-\u0B7F]/ },
  as: { name: 'Assamese', regex: /[\u0980-\u09FF]/ },
  ur: { name: 'Urdu', regex: /[\u0600-\u06FF\uFE70-\uFEFF]/ },
};

const targetLangs = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'or', 'as', 'ur'];

console.log('=== CHECKING TRANSLATIONS (index.ts) ===');
targetLangs.forEach(lang => {
  const dict = TRANSLATIONS[lang];
  if (!dict) {
    console.error(`❌ Missing language code '${lang}' in index.ts!`);
    return;
  }
  const keyCount = Object.keys(dict).length;
  console.log(`Lang '${lang}': ${keyCount} keys`);
});

console.log('\n=== CHECKING ADMIN_TRANSLATIONS (adminTranslations.ts) ===');
targetLangs.forEach(lang => {
  const dict = ADMIN_TRANSLATIONS[lang];
  if (!dict) {
    console.error(`❌ Missing language code '${lang}' in adminTranslations.ts!`);
    return;
  }
  const keyCount = Object.keys(dict).length;
  console.log(`Lang '${lang}': ${keyCount} keys`);
});

console.log('\n=== SCRIPT MISMATCH CHECK FOR ADMIN_TRANSLATIONS ===');
targetLangs.forEach(lang => {
  if (lang === 'en') return;
  const dict = ADMIN_TRANSLATIONS[lang];
  if (!dict) return;
  const expected = scripts[lang];
  let mismatches = 0;
  Object.entries(dict).forEach(([k, val]) => {
    if (!val || typeof val !== 'string') return;
    if (!/[^\x00-\x7F]/.test(val)) return; // ascii/numbers/symbols
    if (expected && !expected.regex.test(val)) {
      if (['hi', 'mr'].includes(lang) && /[\u0900-\u097F]/.test(val)) return;
      mismatches++;
      console.log(`❌ Admin '${lang}' key '${k}': "${val}" does not match ${expected.name} script`);
    }
  });
  if (mismatches === 0) {
    console.log(`✅ Admin '${lang}' script matches ${expected ? expected.name : 'ok'}`);
  }
});
