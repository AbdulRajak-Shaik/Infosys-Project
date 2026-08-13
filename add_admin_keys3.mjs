/**
 * Script to add the final batch of missing keys to all language sections in adminTranslations.ts
 * Keys: userDeletedSuccessfully, userUpdatedSuccessfully, userPromotedAdmin, userAccountDeactivated
 */
import { readFileSync, writeFileSync } from 'fs';

const filePath = './AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts';
let content = readFileSync(filePath, 'utf8');

const additions3 = {
  en: { userDeletedSuccessfully: 'User deleted successfully.', userUpdatedSuccessfully: 'User updated successfully.', userPromotedAdmin: 'User promoted to Admin.', userAccountDeactivated: 'User account deactivated.' },
  hi: { userDeletedSuccessfully: 'उपयोगकर्ता सफलतापूर्वक हटाया गया।', userUpdatedSuccessfully: 'उपयोगकर्ता सफलतापूर्वक अपडेट किया गया।', userPromotedAdmin: 'उपयोगकर्ता को एडमिन के रूप में पदोन्नत किया गया।', userAccountDeactivated: 'उपयोगकर्ता खाता निष्क्रिय कर दिया गया।' },
  te: { userDeletedSuccessfully: 'వినియోగదారు విజయవంతంగా తొలగించబడ్డారు.', userUpdatedSuccessfully: 'వినియోగదారు విజయవంతంగా అప్‌డేట్ చేయబడ్డారు.', userPromotedAdmin: 'వినియోగదారు అడ్మిన్‌గా పదోన్నతి చేయబడ్డారు.', userAccountDeactivated: 'వినియోగదారు ఖాతా నిష్క్రియం చేయబడింది.' },
  ta: { userDeletedSuccessfully: 'பயனர் வெற்றிகரமாக நீக்கப்பட்டார்.', userUpdatedSuccessfully: 'பயனர் வெற்றிகரமாக புதுப்பிக்கப்பட்டார்.', userPromotedAdmin: 'பயனர் நிர்வாகியாக பதவி உயர்வு பெற்றார்.', userAccountDeactivated: 'பயனர் கணக்கு செயலற்றதாக்கப்பட்டது.' },
  kn: { userDeletedSuccessfully: 'ಬಳಕೆದಾರರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.', userUpdatedSuccessfully: 'ಬಳಕೆದಾರರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.', userPromotedAdmin: 'ಬಳಕೆದಾರರನ್ನು ನಿರ್ವಾಹಕರಾಗಿ ಬಡ್ತಿ ಮಾಡಲಾಗಿದೆ.', userAccountDeactivated: 'ಬಳಕೆದಾರ ಖಾತೆ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ.' },
  ml: { userDeletedSuccessfully: 'ഉപയോക്താവ് വിജയകരമായി ഇല്ലാതാക്കി.', userUpdatedSuccessfully: 'ഉപയോക്താവ് വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു.', userPromotedAdmin: 'ഉപയോക്താവ് അഡ്‌മിൻ ആയി ഉയർന്നു.', userAccountDeactivated: 'ഉപയോക്തൃ അക്കൗണ്ട് നിർജ്ജീവമാക്കി.' },
  mr: { userDeletedSuccessfully: 'वापरकर्ता यशस्वीरित्या हटवला.', userUpdatedSuccessfully: 'वापरकर्ता यशस्वीरित्या अद्यतनित केला.', userPromotedAdmin: 'वापरकर्त्याला प्रशासक म्हणून पदोन्नती दिली.', userAccountDeactivated: 'वापरकर्ता खाते निष्क्रिय केले.' },
  gu: { userDeletedSuccessfully: 'વપરાશકર્તા સફળતાપૂર્વક કાઢી નાખ્યો.', userUpdatedSuccessfully: 'વпporashaкarta safaltapurvak update karyo.', userPromotedAdmin: 'Vpporashakarta admin tarke promote karya.', userAccountDeactivated: 'Vporashakarta khatu nishkriya karyu.' },
  bn: { userDeletedSuccessfully: 'ব্যবহারকারী সফলভাবে মুছে ফেলা হয়েছে।', userUpdatedSuccessfully: 'ব্যবহারকারী সফলভাবে আপডেট হয়েছে।', userPromotedAdmin: 'ব্যবহারকারীকে অ্যাডমিন হিসেবে পদোন্নতি দেওয়া হয়েছে।', userAccountDeactivated: 'ব্যবহারকারীর অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে।' },
  pa: { userDeletedSuccessfully: 'ਉਪਭੋਗਤਾ ਨੂੰ ਸਫਲਤਾਪੂਰਵਕ ਮਿਟਾਇਆ ਗਿਆ।', userUpdatedSuccessfully: 'ਉਪਭੋਗਤਾ ਨੂੰ ਸਫਲਤਾਪੂਰਵਕ ਅਪਡੇਟ ਕੀਤਾ ਗਿਆ।', userPromotedAdmin: 'ਉਪਭੋਗਤਾ ਨੂੰ ਐਡਮਿਨ ਵਜੋਂ ਤਰੱਕੀ ਦਿੱਤੀ।', userAccountDeactivated: 'ਉਪਭੋਗਤਾ ਖਾਤਾ ਅਕਿਰਿਆਸ਼ੀਲ ਕੀਤਾ।' },
  or: { userDeletedSuccessfully: 'ଉପଭୋକ୍ତା ସଫଳ ଭାବେ ଡିଲିଟ ହୋଇଛନ୍ତି।', userUpdatedSuccessfully: 'ଉପଭୋକ୍ତା ସଫଳ ଭାବେ ଅଦ୍ୟତନ ହୋଇଛନ୍ତି।', userPromotedAdmin: 'ଉପଭୋକ୍ତାଙ୍କୁ ଆଡ୍‌ମିନ ଭାବେ ପ୍ରୋମୋଟ ହୋଇଛି।', userAccountDeactivated: 'ଉପଭୋକ୍ତା ଖାତା ନିଷ୍କ୍ରିୟ ହୋଇଛି।' },
  as: { userDeletedSuccessfully: 'ব্যৱহাৰকাৰী সফলতাৰে মচা হৈছে।', userUpdatedSuccessfully: 'ব্যৱহাৰকাৰী সফলতাৰে আপডেট হৈছে।', userPromotedAdmin: 'ব্যৱহাৰকাৰীক এডমিন হিচাপে পদোন্নতি দিয়া হৈছে।', userAccountDeactivated: 'ব্যৱহাৰকাৰী একাউণ্ট নিষ্ক্রিয় কৰা হৈছে।' },
  ur: { userDeletedSuccessfully: 'صارف کو کامیابی سے حذف کر دیا گیا۔', userUpdatedSuccessfully: 'صارف کو کامیابی سے اپ ڈیٹ کر دیا گیا۔', userPromotedAdmin: 'صارف کو ایڈمن کے طور پر ترقی دی گئی۔', userAccountDeactivated: 'صارف اکاؤنٹ غیر فعال کر دیا گیا۔' },
  mai: { userDeletedSuccessfully: 'उपयोगकर्ता सफलतापूर्वक हटाबल गेल।', userUpdatedSuccessfully: 'उपयोगकर्ता सफलतापूर्वक अद्यतन कयल गेल।', userPromotedAdmin: 'उपयोगकर्ताकें एडमिन पदोन्नत कयल।', userAccountDeactivated: 'उपयोगकर्ता खाता निष्क्रिय भेल।' },
  mni: { userDeletedSuccessfully: 'ইউজর মপান ফোংদোক্‌লে।', userUpdatedSuccessfully: 'ইউজর থৌনা আপ্‌ডেট তৌবিযে।', userPromotedAdmin: 'ইউজর এডমিন ওইনা প্রমোট তৌবিযে।', userAccountDeactivated: 'ইউজর একাউন্ট ডিএক্টিভেট তৌবিযে।' },
  sat: { userDeletedSuccessfully: 'ᱵᱮᱵᱷᱟᱨᱤᱭᱟᱹ ᱮᱢᱟᱱ ᱫᱩᱲ ᱟᱠᱟᱱ।', userUpdatedSuccessfully: 'ᱵᱮᱵᱷᱟᱨᱤᱭᱟᱹ ᱮᱢᱟᱱ ᱫᱟᱜ ᱟᱠᱟᱱ।', userPromotedAdmin: 'ᱵᱮᱵᱷᱟᱨᱤᱭᱟᱹ ᱟᱰᱢᱤᱱ ᱛᱟᱞᱮ ᱯᱽᱨᱚᱢᱚᱴ।', userAccountDeactivated: 'ᱵᱮᱵᱷᱟᱨᱤᱭᱟᱹ ᱠᱷᱟᱹᱛᱟ ᱵᱚᱸᱫ।' },
  brx: { userDeletedSuccessfully: 'बिबां सानजोव डिलिट जादों।', userUpdatedSuccessfully: 'बिबां सानजोव अपडेट जादों।', userPromotedAdmin: 'बिबां एडमिन थाव जादों।', userAccountDeactivated: 'बिबां खाता बंद जादों।' },
  doi: { userDeletedSuccessfully: 'बरतनौआ कामयाबी नाल मिटाया गिया।', userUpdatedSuccessfully: 'बरतनौआ कामयाबी नाल अपडेट कीता गिया।', userPromotedAdmin: 'बरतनौआनूं एडमिन बनाया गिया।', userAccountDeactivated: 'बरतनौआ खाता बंद कीता गिया।' },
  ks: { userDeletedSuccessfully: 'یوٗزَر کامیابی سیٖتھ مِٹایوو گوو۔', userUpdatedSuccessfully: 'یوٗزَر کامیابی سیٖتھ اَپ ڈیٹ کَرٕوو گوو۔', userPromotedAdmin: 'یوٗزَرَس ایٖڈمِن بَنایوو گوو۔', userAccountDeactivated: 'یوٗزَر اکاؤنٹ بَند کَرٕوو گوو۔' },
  kok: { userDeletedSuccessfully: 'उपयोगकर्तो यशस्वीपणान काडलो।', userUpdatedSuccessfully: 'उपयोगकर्तो यशस्वीपणान अद्यतन केलो।', userPromotedAdmin: 'उपयोगकर्तो एडमिन जाल्लो।', userAccountDeactivated: 'उपयोगकर्त्याचें खातें बंद केलें।' },
  ne: { userDeletedSuccessfully: 'प्रयोगकर्ता सफलतापूर्वक मेटाइयो।', userUpdatedSuccessfully: 'प्रयोगकर्ता सफलतापूर्वक अपडेट भयो।', userPromotedAdmin: 'प्रयोगकर्तालाई एडमिन बनाइयो।', userAccountDeactivated: 'प्रयोगकर्ता खाता निष्क्रिय गरियो।' },
  sa: { userDeletedSuccessfully: 'उपयोक्ता सफलतया नाशितः।', userUpdatedSuccessfully: 'उपयोक्ता सफलतया अद्यतनितः।', userPromotedAdmin: 'उपयोक्ता प्रशासके पदोन्नतः।', userAccountDeactivated: 'उपयोक्तृ-खातं निष्क्रियम्।' },
  sd: { userDeletedSuccessfully: 'استعمالڪار ڪاميابيءَ سان ختم ڪيو ويو.', userUpdatedSuccessfully: 'استعمالڪار ڪاميابيءَ سان اپڊيٽ ڪيو ويو.', userPromotedAdmin: 'استعمالڪار کي ايڊمن بڻايو ويو.', userAccountDeactivated: 'استعمالڪار کاتو غير فعال ڪيو ويو.' },
};

// For each language, find the "dashboard" key we added last, and insert after it
for (const [lang, keys] of Object.entries(additions3)) {
  const dashboardKey = `    "dashboard": `;
  const langMarker = `  "${lang}": {`;
  
  const langStart = content.indexOf(langMarker);
  if (langStart === -1) {
    console.log(`WARNING: Language section '${lang}' not found!`);
    continue;
  }
  
  // Find the dashboard key within this section
  const searchFrom = langStart;
  const dashIdx = content.indexOf(dashboardKey, searchFrom);
  if (dashIdx === -1) {
    // For en, add at the noFeedbackMatches line area
    if (lang === 'en') {
      const noFeedbackEn = content.indexOf('    "noFeedbackMatches": "No feedback matches your search."');
      if (noFeedbackEn === -1) { console.log('Could not find English anchor'); continue; }
      const lineEnd = content.indexOf('\n', noFeedbackEn);
      const insertLines = Object.entries(keys).map(([k, v]) => `    "${k}": "${v.replace(/"/g, '\\"')}",`).join('\n');
      content = content.slice(0, lineEnd + 1) + insertLines + '\n' + content.slice(lineEnd + 1);
      console.log(`Added ${Object.keys(keys).length} keys to '${lang}' section (batch 3)`);
    } else {
      console.log(`WARNING: Could not find 'dashboard' key in '${lang}' section!`);
    }
    continue;
  }
  
  const lineEnd = content.indexOf('\n', dashIdx);
  if (lineEnd === -1) continue;
  
  const insertLines = Object.entries(keys).map(([k, v]) => `    "${k}": "${v.replace(/"/g, '\\"')}",`).join('\n');
  content = content.slice(0, lineEnd + 1) + insertLines + '\n' + content.slice(lineEnd + 1);
  console.log(`Added ${Object.keys(keys).length} keys to '${lang}' section (batch 3)`);
}

writeFileSync(filePath, content, 'utf8');
console.log('\nDone! adminTranslations.ts updated with batch 3 keys.');
