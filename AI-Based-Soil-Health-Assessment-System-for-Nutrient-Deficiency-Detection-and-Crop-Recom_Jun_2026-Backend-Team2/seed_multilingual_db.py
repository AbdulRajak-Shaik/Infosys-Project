"""Master DB Seed script for Database-Driven Multilingual System supporting all 23 Indian & regional languages."""

import os
import sys

# Ensure backend root is on Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import Language, TranslationKey, Translation, Multilingual
from app.services.sarvam_service import translate_text_by_code, transliterate_text

# 23 Supported Languages
LANGUAGES_DATA = [
    {"language_code": "en", "language_name": "English", "is_default": True},
    {"language_code": "hi", "language_name": "Hindi", "is_default": False},
    {"language_code": "te", "language_name": "Telugu", "is_default": False},
    {"language_code": "ta", "language_name": "Tamil", "is_default": False},
    {"language_code": "kn", "language_name": "Kannada", "is_default": False},
    {"language_code": "ml", "language_name": "Malayalam", "is_default": False},
    {"language_code": "mr", "language_name": "Marathi", "is_default": False},
    {"language_code": "gu", "language_name": "Gujarati", "is_default": False},
    {"language_code": "bn", "language_name": "Bengali", "is_default": False},
    {"language_code": "pa", "language_name": "Punjabi", "is_default": False},
    {"language_code": "or", "language_name": "Odia", "is_default": False},
    {"language_code": "as", "language_name": "Assamese", "is_default": False},
    {"language_code": "ur", "language_name": "Urdu", "is_default": False},
    {"language_code": "mai", "language_name": "Maithili", "is_default": False},
    {"language_code": "mni", "language_name": "Manipuri", "is_default": False},
    {"language_code": "sat", "language_name": "Santali", "is_default": False},
    {"language_code": "brx", "language_name": "Bodo", "is_default": False},
    {"language_code": "doi", "language_name": "Dogri", "is_default": False},
    {"language_code": "ks", "language_name": "Kashmiri", "is_default": False},
    {"language_code": "kok", "language_name": "Konkani", "is_default": False},
    {"language_code": "ne", "language_name": "Nepali", "is_default": False},
    {"language_code": "sa", "language_name": "Sanskrit", "is_default": False},
    {"language_code": "sd", "language_name": "Sindhi", "is_default": False},
]

# Comprehensive translations dictionary for Indian languages
INDIAN_TRANSLATIONS = {
    "HOME_TITLE": {
        "en": "AI Soil Health Assessment System",
        "hi": "AI मृदा स्वास्थ्य मूल्यांकन प्रणाली",
        "te": "AI నేల ఆరోగ్య అంచనా వ్యవస్థ",
        "ta": "AI மண் சுகாதார மதிப்பீட்டு முறை",
        "kn": "AI ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಮೌಲ್ಯಮಾಪನ ವ್ಯವಸ್ಥೆ",
        "ml": "AI മണ്ണ് ആരോഗ്യ വിലയിരുത്തൽ സംവിധാനം",
        "mr": "AI माती आरोग्य मूल्यांकन प्रणाली",
        "gu": "AI જમીન આરોગ્ય મૂલ્યાંકન સિસ્ટમ",
        "bn": "AI মাটি স্বাস্থ্য মূল্যায়ন ব্যবস্থা",
        "pa": "AI ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਦਾ ਮੁਲਾਂਕਣ ਪ੍ਰਣਾਲੀ",
        "or": "AI ମାଟି ସ୍ୱାସ୍ଥ୍ୟ ଆକଳନ ପ୍ରଣାଳୀ",
        "as": "AI মাটি স্বাস্থ্য মূল্যায়ন ব্যৱস্থা",
        "ur": "AI مٹی کی صحت کی تشخیص کا نظام",
        "mai": "AI माटि स्वास्थ्य मूल्यांकन प्रणाली",
        "mni": "AI লৈবাক অনা-লাইফং পরিং",
        "sat": "AI ᱦᱟᱥᱟ ᱥᱚᱛᱮᱭᱟᱡᱩ ᱥᱚᱢᱵᱟᱭ",
        "brx": "AI हाबांसानि साहायारि राहा",
        "doi": "AI मिट्‍टी दी सेहत दा मुल्यांकन प्रणाली",
        "ks": "AI زمیٖن ہِنز صحت یَچھنُک نظام",
        "kok": "AI मातयेची भलायकी पारखप वेवस्था",
        "ne": "AI माटो स्वास्थ्य मूल्याङ्कन प्रणाली",
        "sa": "AI मृत्तिका स्वास्थ्य मूल्यांकन प्रणाली",
        "sd": "AI مٽي جي صحت جو اندازو سسٽم"
    },
    "LOGIN": {
        "en": "Login",
        "hi": "लॉग इन करें",
        "te": "లాగిన్ చేయండి",
        "ta": "உள்நுழையவும்",
        "kn": "ಲಾಗಿನ್ ಮಾಡಿ",
        "ml": "ലോഗിൻ ചെയ്യുക",
        "mr": "लॉगिन करा",
        "gu": "લૉગિન કરો",
        "bn": "লগইন করুন",
        "pa": "ਲੌਗਇਨ ਕਰੋ",
        "or": "ଲଗଇନ୍ କରନ୍ତୁ",
        "as": "লগইন কৰক",
        "ur": "لاگ ان کریں",
        "mai": "लॉग इन करू",
        "mni": "লোগইন তৌবীয়ু",
        "sat": "ᱞᱚᱜᱤᱱ",
        "brx": "ल'गइन खालाम",
        "doi": "लॉग इन करो",
        "ks": "لاگ اِن کرو",
        "kok": "लॉगिन करा",
        "ne": "लगइन गर्नुहोस्",
        "sa": "प्रवेशं करोतु",
        "sd": "لاگ ان ڪريو"
    },
    "REGISTER": {
        "en": "Register",
        "hi": "पंजीकरण करें",
        "te": "నమోదు చేసుకోండి",
        "ta": "பதிவு செய்யவும்",
        "kn": "ನೋಂದಾಯಿಸಿ",
        "ml": "രജിസ്റ്റർ ചെയ്യുക",
        "mr": "नोंदणी करा",
        "gu": "નોંધણી કરો",
        "bn": "নিবন্ধন করুন",
        "pa": "ਰਜਿਸਟਰ ਕਰੋ",
        "or": "ପଞ୍ଜୀକରଣ କରନ୍ତୁ",
        "as": "পঞ্জীয়ন কৰক",
        "ur": "رجسٹر کریں",
        "mai": "नोंदणी करू",
        "mni": "রেজিষ্টার তৌবীয়ু",
        "sat": "ᱨᱮᱡᱤᱥᱴᱟᱨ",
        "brx": "रजिस्टार खालाम",
        "doi": "पंजीकरण करो",
        "ks": "رجسٹر کرو",
        "kok": "नोंदणी करा",
        "ne": "दर्ता गर्नुहोस्",
        "sa": "पञ्जीकरणं करोतु",
        "sd": "رجسٽر ڪريو"
    },
    "PROFILE": {
        "en": "Profile",
        "hi": "प्रोफ़ाइल",
        "te": "ప్రొఫైల్",
        "ta": "சுயவிவரம்",
        "kn": "ಪ್ರೊಫೈಲ್",
        "ml": "പ്രൊഫൈൽ",
        "mr": "प्रोफाईल",
        "gu": "પ્રોફાઇલ",
        "bn": "প্রোফাইল",
        "pa": "ਪ੍ਰੋਫਾਈਲ",
        "or": "ପ୍ରୋଫାଇଲ୍",
        "as": "প্ৰফাইল",
        "ur": "پروفائل",
        "mai": "प्रोफ़ाइल",
        "mni": "প্রোফাইল",
        "sat": "ᱯᱨᱳᱯᱷᱟᱭᱤᱞ",
        "brx": "प्रोफाइल",
        "doi": "प्रोफाइल",
        "ks": "پروفائل",
        "kok": "प्रोफाईल",
        "ne": "प्रोफाइल",
        "sa": "विवरणम्",
        "sd": "پروفائل"
    },
    "SOIL_ANALYSIS": {
        "en": "Soil Health Analysis",
        "hi": "मृदा स्वास्थ्य विश्लेषण",
        "te": "నేల ఆరోగ్య విశ్లేషణ",
        "ta": "மண் சுகாதார பகுப்பாய்வு",
        "kn": "ಮಣ್ಣಿನ ಆರೋಗ್ಯ ವಿಶ್ಲೇಷಣೆ",
        "ml": "മണ്ണ് ആരോഗ്യ വിശകലനം",
        "mr": "माती आरोग्य विश्लेषण",
        "gu": "જમીન આરોગ્ય વિશ્લેષણ",
        "bn": "মাটি স্বাস্থ্য বিশ্লেষণ",
        "pa": "ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ",
        "or": "ମାଟି ସ୍ୱାସ୍ଥ୍ୟ ବିଶ୍ଳେଷଣ",
        "as": "মাটি স্বাস্থ্য বিশ্লেষণ",
        "ur": "مٹی کی صحت کا تجزیہ",
        "mai": "माटि स्वास्थ्य विश्लेषण",
        "mni": "লৈবাক অনা-লাইফং ঙাকশেন",
        "sat": "ᱦᱟᱥᱟ ᱥᱚᱛᱮᱭᱟᱡᱩ ᱵᱤᱪᱟᱹᱨ",
        "brx": "हाबांसा साहायारि नायबिजिरनाय",
        "doi": "मिट्‍टी दी सेहत दा विश्लेषण",
        "ks": "زمیٖن ہِنز صحت تجزِیہہ",
        "kok": "मातयेची भलायकी तपासणी",
        "ne": "माटो स्वास्थ्य विश्लेषण",
        "sa": "मृत्तिका स्वास्थ्य विश्लेषणम्",
        "sd": "مٽي جي صحت جو تجزيو"
    },
    "CROP_RECOMMENDATION": {
        "en": "Crop Recommendation",
        "hi": "फसल सिफारिश",
        "te": "పంట సిఫార్సు",
        "ta": "பயிர் பரிந்துரை",
        "kn": "ಬೆಳೆ ಶಿಫಾರಸು",
        "ml": "വിള ശുപാർശ",
        "mr": "पीक शिफारस",
        "gu": "પાક ભલામણ",
        "bn": "ফসল সুপারিশ",
        "pa": "ਫਸਲ ਦੀ ਸਿਫਾਰਸ਼",
        "or": "ଫସଲ ସୁପାରିଶ",
        "as": "শস্য পৰামৰ্শ",
        "ur": "فصل کی سفارش",
        "mai": "फसल सिफारिश",
        "mni": "পাম্বী অফবা মচা",
        "sat": "ᱪᱟᱥ ᱥᱟᱞᱟ",
        "brx": "फसलनि सुफारिस",
        "doi": "फसल दी सिफारिश",
        "ks": "فصل ہِنز سِفارش",
        "kok": "पीक शिफारस",
        "ne": "बाली सिफारिस",
        "sa": "सस्य अनुशंसा",
        "sd": "فصل جي سفارش"
    },
    "FERTILIZER": {
        "en": "Fertilizer Recommendation",
        "hi": "उर्वरक सिफारिश",
        "te": "ఎరువుల సిఫార్సు",
        "ta": "உரம் பரிந்துரை",
        "kn": "ಗೊಬ್ಬರ ಶಿಫಾರಸು",
        "ml": "വളം ശുപാർശ",
        "mr": "खत शिफारस",
        "gu": "ખાતર ભલામણ",
        "bn": "সার সুপারিশ",
        "pa": "ਖਾਦ ਦੀ ਸਿਫਾਰਸ਼",
        "or": "ଖତ ସୁପାରିଶ",
        "as": "সাৰ পৰামৰ্শ",
        "ur": "کھاد کی سفارش",
        "mai": "उर्वरक सिफारिश",
        "mni": "મહীক অফবা মচা",
        "sat": "ᱨᱟᱱ ᱪᱟᱥ ᱥᱟᱞᱟ",
        "brx": "खाथार सुफारिस",
        "doi": "खाद दी सिफारिश",
        "ks": "کھاد ہِنز سِفارش",
        "kok": "खात शिफारस",
        "ne": "मल सिफारिस",
        "sa": "उर्वरक अनुशंसा",
        "sd": "ڀاڻ جي سفارش"
    },
    "LOGOUT": {
        "en": "Logout",
        "hi": "लॉग आउट करें",
        "te": "లాగ్ అవుట్ చేయండి",
        "ta": "வெளியேறவும்",
        "kn": "ಲಾಗ್ ಔಟ್ ಮಾಡಿ",
        "ml": "ലോഗ് ഔട്ട് ചെയ്യുക",
        "mr": "लॉग आउट करा",
        "gu": "લૉગ આઉટ કરો",
        "bn": "লগআউট করুন",
        "pa": "ਲੌਗ ਆਉਟ ਕਰੋ",
        "or": "ଲଗଆଉଟ୍ କରନ୍ତୁ",
        "as": "লগআউট কৰক",
        "ur": "لاگ آؤٹ کریں",
        "mai": "लॉग आउट करू",
        "mni": "লোগআউট তৌবীয়ু",
        "sat": "ᱞᱚᱜᱽ ᱟᱣᱩᱴ",
        "brx": "ल'गआउट खालाम",
        "doi": "लॉग आउट करो",
        "ks": "لاگ آؤٹ کرو",
        "kok": "लॉग आउट करा",
        "ne": "लगआउट गर्नुहोस्",
        "sa": "निर्गमनं करोतु",
        "sd": "لاگ آئوٽ ڪريو"
    },
    "ACCOUNT_DETAILS": {
        "en": "Account Details",
        "hi": "खाता विवरण",
        "te": "ఖాతా వివరాలు",
        "ta": "கணக்கு விவரங்கள்",
        "kn": "ಖಾತೆ ವಿವರಗಳು",
        "ml": "അക്കൗണ്ട് വിവരങ്ങൾ",
        "mr": "खाते तपशील",
        "gu": "ખાતાની વિગતો",
        "bn": "অ্যাকাউন্টের বিবরণ",
        "pa": "ਖਾਤੇ ਦੇ ਵੇਰਵੇ",
        "or": "ଖାତା ବିବରଣୀ",
        "as": "একাউণ্টৰ বিৱৰণ",
        "ur": "اکاؤنٹ کی تفصیلات",
        "mai": "खाता विवरण",
        "mni": "একাউন্ত পরিং",
        "sat": "ᱠᱷᱟᱛᱟ ᱵᱤᱵᱚᱨᱚᱱ",
        "brx": "खाता रादाब",
        "doi": "खाता विवरण",
        "ks": "اکاؤنٹُک تفصیٖل",
        "kok": "खात्याची म्हायती",
        "ne": "खाता विवरण",
        "sa": "लेखा विवरणम्",
        "sd": "ائڪائونٽ جون تفصيلون"
    },
    "USER_NAME": {
        "en": "Rahul Ramayanam",
        "hi": "राहुल रामायणम",
        "te": "రాహుల్ రామాయణం",
        "ta": "ராகுல் இராமாயணம்",
        "kn": "ರಾಹುಲ್ ರಾಮಾಯಣಂ",
        "ml": "രാഹുൽ രാമായണം",
        "mr": "राहुल रामायणम",
        "gu": "રાહુલ રામાયણમ",
        "bn": "রাহুল রামায়ণম",
        "pa": "ਰਾਹੁਲ ਰਾਮਾਇਣਮ",
        "or": "ରାହୁଲ ରାମାୟଣମ",
        "as": "ৰাহুল ৰামায়ণম",
        "ur": "راہول راماینم",
        "mai": "राहुल रामायणम",
        "mni": "রাহুল রামায়ণম",
        "sat": "ᱨᱟᱦᱩᱞ ᱨᱟᱢᱟᱭᱚᱱᱚᱢ",
        "brx": "राहुल रामायणम",
        "doi": "राहुल रामायणम",
        "ks": "راہُل رامایَنَم",
        "kok": "राहुल रामायणम",
        "ne": "राहुल रामायणम",
        "sa": "राहुलो रामायणम्",
        "sd": "راهول رامائڻم"
    },
    "BANK_NAME": {
        "en": "State Bank of India",
        "hi": "भारतीय स्टेट बैंक",
        "te": "స్టేట్ బ్యాంక్ ఆఫ్ ఇండియా",
        "ta": "ஸ்டேட் பாங்க் ஆஃப் இந்தியா",
        "kn": "ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ",
        "ml": "സ്റ്റേറ്റ് ബാങ്ക് ഓഫ് ഇന്ത്യ",
        "mr": "स्टेट बँक ऑफ इंडिया",
        "gu": "સ્ટેટ બેંક ઓફ ઈન્ડિયા",
        "bn": "স্টেট ব্যাঙ্ক অফ ইন্ডিয়া",
        "pa": "ਸਟੇਟ ਬੈਂਕ ਆਫ਼ ਇੰਡੀਆ",
        "or": "ଷ୍ଟେଟ୍ ବ୍ୟାଙ୍କ ଅଫ୍ ଇଣ୍ଡିଆ",
        "as": "ষ্টেট বেংক অৱ ইণ্ডিয়া",
        "ur": "سٹیٹ بینک آف انڈیا",
        "mai": "भारतीय स्टेट बैंक",
        "mni": "স্টেট ব্যাংক ওফ ইন্ডিয়া",
        "sat": "ᱥᱴᱮᱴ ᱵᱮᱝᱠ ᱚᱯᱷ ᱤᱱᱰᱤᱭᱟ",
        "brx": "स्टेट बैंक अफ इन्डिया",
        "doi": "भारतीय स्टेट बैंक",
        "ks": "سَٹیٹ بَیَنک آف اِنڈِیا",
        "kok": "स्टेट बँक ऑफ इंडिया",
        "ne": "स्टेट बैंक अफ इन्डिया",
        "sa": "भारतीय स्टेट बैंक",
        "sd": "سٽيٽ بئنڪ آف انڊيا"
    },
    "ACCOUNT_NUMBER": {
        "en": "Account Number",
        "hi": "खाता संख्या",
        "te": "ఖాతా సంఖ్య",
        "ta": "கணக்கு எண்",
        "kn": "ಖಾತೆ ಸಂಖ್ಯೆ",
        "ml": "അക്കൗണ്ട് നമ്പർ",
        "mr": "खाते क्रमांक",
        "gu": "ખાતા નંબર",
        "bn": "অ্যাকাউন্ট নম্বর",
        "pa": "ਖਾਤਾ ਨੰਬਰ",
        "or": "ଖାତା ନମ୍ବର",
        "as": "একাউণ্ট নম্বৰ",
        "ur": "اکاؤنٹ نمبر",
        "mai": "खाता संख्या",
        "mni": "একাউন্ত নম্বর",
        "sat": "ᱠᱷᱟᱛᱟ ᱱᱚᱢᱵᱚᱨ",
        "brx": "खाता नम्बर",
        "doi": "खाता नंबर",
        "ks": "اکاؤنٹ نمبر",
        "kok": "खाते क्रमांक",
        "ne": "खाता नम्बर",
        "sa": "लेखा सङ्ख्या",
        "sd": "ائڪائونٽ نمبر"
    },
    "IFSC": {
        "en": "IFSC Code",
        "hi": "आईएफएससी कोड",
        "te": "IFSC కోడ్",
        "ta": "IFSC குறியீடு",
        "kn": "IFSC ಕೋಡ್",
        "ml": "IFSC കോഡ്",
        "mr": "आयएफएससी कोड",
        "gu": "IFSC કોડ",
        "bn": "আইএফএসসি কোড",
        "pa": "IFSC ਕੋਡ",
        "or": "IFSC କୋଡ୍",
        "as": "IFSC ক'ড",
        "ur": "آئی ایف ایس سی کوڈ",
        "mai": "आईएफएससी कोड",
        "mni": "IFSC কোড",
        "sat": "IFSC ᱠᱳᱰ",
        "brx": "IFSC कोड",
        "doi": "आईएफएससी कोड",
        "ks": "آئی ایف ایس سی کوڈ",
        "kok": "आयएफएससी कोड",
        "ne": "IFSC कोड",
        "sa": "IFSC कूटः",
        "sd": "IFSC ڪوڊ"
    },
    "ADDRESS": {
        "en": "Village & District Address",
        "hi": "गांव और जिला पता",
        "te": "గ్రామం & జిల్లా చిరునామా",
        "ta": "கிராமம் & மாவட்ட முகவரி",
        "kn": "ಗ್ರಾಮ ಮತ್ತು ಜಿಲ್ಲೆಯ ವಿಳಾಸ",
        "ml": "ഗ്രാമവും ജില്ലയും വിലാസം",
        "mr": "गाव आणि जिल्हा पत्ता",
        "gu": "ગામ અને જિલ્લાનું સરનામું",
        "bn": "গ্রাম ও জেলার ঠিকানা",
        "pa": "ਪਿੰਡ ਅਤੇ ਜ਼ਿਲ੍ਹੇ ਦਾ ਪਤਾ",
        "or": "ଗ୍ରାମ ଏବଂ ଜିଲ୍ଲା ଠିକଣା",
        "as": "গাঁৱৰ আৰু জিলাৰ ঠিকনা",
        "ur": "گاؤں اور ضلع کا پتہ",
        "mai": "गाम आ जिलाक पता",
        "mni": "খুল অমসুং জিলা লৈফম",
        "sat": "ᱟᱹᱛᱩ ᱟᱨ ᱡᱤᱞᱟᱹ ᱴᱷᱤᱠᱟᱹᱱᱟ",
        "brx": "गामि आरो जिखा ठिकाना",
        "doi": "ग्राम ते जिला पता",
        "ks": "گام تہٕ زِلہٕ پَتا",
        "kok": "गांव आनी जिल्हा पत्तो",
        "ne": "गाउँ र जिल्ला ठेगाना",
        "sa": "ग्रामस्य मण्डलस्य च सङ्केतः",
        "sd": "ڳوٺ ۽ ضلعي جو پتو"
    },
    "DISEASE_DETECTION": {
        "en": "Crop Disease Detection",
        "hi": "फसल रोग पहचान",
        "te": "పంట వ్యాధి నివారణ & గుర్తింపు",
        "ta": "பயிர் நோய் கண்டறிதல்",
        "kn": "ಬೆಳೆ ರೋಗ ಪತ್ತೆ",
        "ml": "വിള രോഗ നിരീക്ഷണം",
        "mr": "पीक रोग ओळख",
        "gu": "પાક રોગ ઓળખ",
        "bn": "ফসল রোগ নির্ণয়",
        "pa": "ਫਸਲ ਦੇ ਰੋਗ ਦੀ ਪਛਾਣ",
        "or": "ଫସଲ ରୋଗ ଚିହ୍ନଟ",
        "as": "শস্য ৰোগ চিনাক্তকৰণ",
        "ur": "فصل کی بیماری کا پتہ لگانا",
        "mai": "फसल रोग पहचान",
        "mni": "পাম্বী লাইনা খংদোকপা",
        "sat": "ᱪᱟᱥ ᱨᱩᱣᱟᱹ ᱧᱟᱢ",
        "brx": "फसल बेमार सिनायनाय",
        "doi": "फसल बीमारी दी पहचान",
        "ks": "فصل ہِنز بِیماری کَڈُن",
        "kok": "पीक रोग वळखप",
        "ne": "बाली रोग पहिचान",
        "sa": "सस्यरोगज्ञानम्",
        "sd": "فصل جي بيماري جو پتو لڳائڻ"
    },
    "WEATHER_FORECAST": {
        "en": "Weather Intelligence & Forecast",
        "hi": "मौसम पूर्वानुमान एवं जानकारी",
        "te": "వాతావరణ సమాచారం & అంచనా",
        "ta": "வானிலை முன்னறிவிப்பு",
        "kn": "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
        "ml": "കാലാവസ്ഥ പ്രവചനം",
        "mr": "हवामान अंदाज",
        "gu": "હવામાન દર્શન અને અંદાજ",
        "bn": "আবহাওয়া পূর্বাভাস",
        "pa": "ਮੌਸਮ ਦਾ ਪੂਰਵ-ਅਨੁਮਾਨ",
        "or": "ପାଣିପାଗ ପୂର୍ବାନୁମାନ",
        "as": "বতাহ-পানীৰ পূৰ্বাভাস",
        "ur": "موسم کی پیشگوئی",
        "mai": "मौसम पूर्वानुमान",
        "mni": "נוংશા-নুংশিত পরিং",
        "sat": "ᱥᱮᱨᱢᱟ ᱫᱟ cross ᱟᱸᱫᱟᱡᱽ",
        "brx": "बोथोरनि रादाब",
        "doi": "मौसम दा पूर्वानुमान",
        "ks": "موسمُک حالات",
        "kok": "हवामान अंदाज",
        "ne": "मौसम पूर्वानुमान",
        "sa": "ऋतुमान भविष्यवाणी",
        "sd": "موسم جي اڳڪٿي"
    },
    "SUBMIT": {
        "en": "Submit",
        "hi": "जमा करें",
        "te": "సమర్పించు",
        "ta": "சமர்ப்பிக்கவும்",
        "kn": "ಸಲ್ಲಿಸಿ",
        "ml": "സമർപ്പിക്കുക",
        "mr": "सबमिट करा",
        "gu": "સબમિટ કરો",
        "bn": "জমা দিন",
        "pa": "ਜਮ੍ਹਾਂ ਕਰੋ",
        "or": "ଦାଖଲ କରନ୍ତୁ",
        "as": "জমা দিয়ক",
        "ur": "جمع کریں",
        "mai": "जमा करू",
        "mni": "সবমিট তৌবীয়ু",
        "sat": "ᱥᱟᱵᱽᱢᱤᱴ",
        "brx": "सबमिट खालाम",
        "doi": "जमा करो",
        "ks": "جمع کرو",
        "kok": "सबमिट करा",
        "ne": "बुझाउनुहोस्",
        "sa": "प्रेषयतु",
        "sd": "جمع ڪريو"
    },
    "CANCEL": {
        "en": "Cancel",
        "hi": "रद्द करें",
        "te": "రద్దు చేయండి",
        "ta": "ரத்து செய்யுபவும்",
        "kn": "ರದ್ದುಗೊಳಿಸಿ",
        "ml": "റദ്ദാക്കുക",
        "mr": "रद्द करा",
        "gu": "રદ કરો",
        "bn": "বাতিল করুন",
        "pa": "ਰੱਦ ਕਰੋ",
        "or": "ବାତିଲ୍ କରନ୍ତୁ",
        "as": "বাতিল কৰক",
        "ur": "منسوخ کریں",
        "mai": "रद्द करू",
        "mni": "કેન્સેલ তৌবীয়ু",
        "sat": "ᱠᱮᱱᱥᱚᱞ",
        "brx": "केन्सेल खालाम",
        "doi": "रद्द करो",
        "ks": "منسوخ کرو",
        "kok": "रद्द करा",
        "ne": "रद्ध गर्नुहोस्",
        "sa": "निरस्यतु",
        "sd": "منسوخ ڪريو"
    },
    "DOWNLOAD_PDF": {
        "en": "Download Multilingual PDF Report",
        "hi": "बहुभाषी पीडीएफ रिपोर्ट डाउनलोड करें",
        "te": "బహుభాషా PDF నివేదికను డౌన్‌లోడ్ చేయండి",
        "ta": "பன்மொழி PDF அறிக்கையைப் பதிவிறக்கவும்",
        "kn": "ಬಹುಭಾಷಾ PDF ವರದಿಯನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
        "ml": "ബഹുഭാഷാ PDF റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യുക",
        "mr": "बहुभाषिक पीडीएफ अहवाल डाउनलोड करा",
        "gu": "બહુભાષી PDF રિપોર્ટ ડાઉનલોડ કરો",
        "bn": "বহুভাষিক পিডিএফ রিপোর্ট ডাউনলোড করুন",
        "pa": "ਬਹੁ-ਭਾਸ਼ਾਈ PDF ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ",
        "or": "ବହୁଭାଷୀ PDF ରିପୋର୍ଟ ଡାଉନଲୋଡ୍ କରନ୍ତୁ",
        "as": "বহুভাষিক PDF ৰিপোৰ্ট ডাউনলোড কৰক",
        "ur": "کثیر لسانی PDF رپورٹ ڈاؤن لوڈ کریں",
        "mai": "बहुभाषी पीडीएफ रिपोर्ट डाउनलोड करू",
        "mni": "PDF রিফোর্ট দাউনলোড তৌবীয়ু",
        "sat": "PDF ᱨᱤᱯᱳᱨᱴ ᱰᱟᱣᱩᱱᱞᱳᱰ",
        "brx": "PDF रिपोर्ट डाउनलोड खालाम",
        "doi": "बहुभाषी पीडीएफ रिपोर्ट डाउनलोड करो",
        "ks": "پی ڈی ایف رِپورٹ ڈاؤن لوڈ کرو",
        "kok": "बहुभाशीक PDF अहवाल डाऊनलोड करा",
        "ne": "बहुभाषी PDF रिपोर्ट डाउनलोड गर्नुहोस्",
        "sa": "बहुभाषीयं PDF वृत्तान्तं अधोभारयतु",
        "sd": "ملٽي لينگويج PDF رپورٽ ڊائون لوڊ ڪريو"
    }
}

KEYS_DATA = [
    {"key": "HOME_TITLE", "english": "AI Soil Health Assessment System", "category": "Navigation"},
    {"key": "LOGIN", "english": "Login", "category": "Auth"},
    {"key": "REGISTER", "english": "Register", "category": "Auth"},
    {"key": "PROFILE", "english": "Profile", "category": "User"},
    {"key": "SOIL_ANALYSIS", "english": "Soil Health Analysis", "category": "Features"},
    {"key": "CROP_RECOMMENDATION", "english": "Crop Recommendation", "category": "Features"},
    {"key": "FERTILIZER", "english": "Fertilizer Recommendation", "category": "Features"},
    {"key": "LOGOUT", "english": "Logout", "category": "Auth"},
    {"key": "ACCOUNT_DETAILS", "english": "Account Details", "category": "User"},
    {"key": "USER_NAME", "english": "Rahul Ramayanam", "category": "PersonalDetails"},
    {"key": "BANK_NAME", "english": "State Bank of India", "category": "Financial"},
    {"key": "ACCOUNT_NUMBER", "english": "Account Number", "category": "Financial"},
    {"key": "IFSC", "english": "IFSC Code", "category": "Financial"},
    {"key": "ADDRESS", "english": "Village & District Address", "category": "PersonalDetails"},
    {"key": "DISEASE_DETECTION", "english": "Crop Disease Detection", "category": "Features"},
    {"key": "WEATHER_FORECAST", "english": "Weather Intelligence & Forecast", "category": "Features"},
    {"key": "SUBMIT", "english": "Submit", "category": "Actions"},
    {"key": "CANCEL", "english": "Cancel", "category": "Actions"},
    {"key": "DOWNLOAD_PDF", "english": "Download Multilingual PDF Report", "category": "Reports"},
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("[*] Seeding Languages table...")
        lang_obj_map = {}
        for l_data in LANGUAGES_DATA:
            existing = db.query(Language).filter(Language.language_code == l_data["language_code"]).first()
            if not existing:
                existing = Language(
                    language_code=l_data["language_code"],
                    language_name=l_data["language_name"],
                    is_default=l_data["is_default"],
                    is_active=True
                )
                db.add(existing)
                db.commit()
                db.refresh(existing)
            lang_obj_map[l_data["language_code"]] = existing

        print("[*] Seeding Translation Keys...")
        key_obj_map = {}
        for k_data in KEYS_DATA:
            existing_k = db.query(TranslationKey).filter(TranslationKey.key == k_data["key"]).first()
            if not existing_k:
                existing_k = TranslationKey(
                    key=k_data["key"],
                    english=k_data["english"],
                    category=k_data["category"]
                )
                db.add(existing_k)
                db.commit()
                db.refresh(existing_k)
            key_obj_map[k_data["key"]] = existing_k

        print("[*] Generating Translation Values across all 23 languages...")
        total_translations = 0
        for code, l_obj in lang_obj_map.items():
            for k_str, k_obj in key_obj_map.items():
                existing_t = db.query(Translation).filter(
                    Translation.translation_key_id == k_obj.id,
                    Translation.language_id == l_obj.id
                ).first()

                # Get translation from dictionary or fallback function
                t_dict = INDIAN_TRANSLATIONS.get(k_str, {})
                t_text = t_dict.get(code)
                if not t_text:
                    if code == "en":
                        t_text = k_obj.english
                    elif k_obj.category == "PersonalDetails":
                        t_text = transliterate_text(k_obj.english, code)
                    else:
                        t_text = translate_text_by_code(k_obj.english, code)

                if not existing_t:
                    new_t = Translation(
                        translation_key_id=k_obj.id,
                        language_id=l_obj.id,
                        translated_text=t_text
                    )
                    db.add(new_t)
                    total_translations += 1
                else:
                    existing_t.translated_text = t_text
                    total_translations += 1

        print("[*] Seeding flat Multilingual table with all 23 language columns...")
        col_map = {
            'hi': 'hindi', 'te': 'telugu', 'ta': 'tamil', 'kn': 'kannada',
            'ml': 'malayalam', 'mr': 'marathi', 'gu': 'gujarati', 'bn': 'bengali',
            'pa': 'punjabi', 'or': 'odia', 'as': 'assamese', 'ur': 'urdu',
            'mai': 'maithili', 'mni': 'manipuri', 'sat': 'santali', 'brx': 'bodo',
            'doi': 'dogri', 'ks': 'kashmiri', 'kok': 'konkani', 'ne': 'nepali',
            'sa': 'sanskrit', 'sd': 'sindhi'
        }
        for k_data in KEYS_DATA:
            k_key = k_data["key"]
            existing_m = db.query(Multilingual).filter(Multilingual.key == k_key).first()
            t_dict = INDIAN_TRANSLATIONS.get(k_key, {})

            m_kwargs = {"key": k_key, "english": k_data["english"]}
            for l_data in LANGUAGES_DATA:
                c_code = l_data["language_code"]
                if c_code == "en":
                    continue
                col_name = col_map.get(c_code, c_code)
                val = t_dict.get(c_code)
                if not val:
                    if k_data["category"] == "PersonalDetails":
                        val = transliterate_text(k_data["english"], c_code)
                    else:
                        val = translate_text_by_code(k_data["english"], c_code)
                m_kwargs[col_name] = val

            if not existing_m:
                db.add(Multilingual(**m_kwargs))
            else:
                for c_col, c_val in m_kwargs.items():
                    if c_col != "key" and hasattr(existing_m, c_col):
                        setattr(existing_m, c_col, c_val)

        db.commit()
        print(f"[SUCCESS] Database seeding completed successfully! Seeded {len(lang_obj_map)} languages, {len(key_obj_map)} keys, and {total_translations} translations across all 23 Indian languages.")

    except Exception as exc:
        db.rollback()
        print(f"[X] Database seeding error: {exc}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
