import json, re

DISTRICT_TRANSLATIONS = {
    "hi": {
        "District": "जिला",
        "district": "जिला",
        "Tirupati District": "तिरुपति जिला",
        "exactDistrictName": "सटीक जिले का नाम",
        "popularVillagesDistricts": "लोकप्रिय कृषि गांव और जिले",
        "setExactDistrict": "सटीक जिला सेट करें",
        "fetchingDistrictData": "जिला डेटा प्राप्त किया जा रहा है..."
    },
    "te": {
        "District": "జిల్లా",
        "district": "జిల్లా",
        "Tirupati District": "తిరుపతి జిల్లా",
        "exactDistrictName": "ఖచ్చితమైన జిల్లా పేరు",
        "popularVillagesDistricts": "ప్రసిద్ధ వ్యవసాయ గ్రామాలు & జిల్లాలు",
        "setExactDistrict": "ఖచ్చితమైన జిల్లాను సెట్ చేయండి",
        "fetchingDistrictData": "జిల్లా డేటాను పొందుతోంది..."
    },
    "ta": {
        "District": "மாவட்டம்",
        "district": "மாவட்டம்",
        "Tirupati District": "திருப்பதி மாவட்டம்",
        "exactDistrictName": "துல்லியமான மாவட்டத்தின் பெயர்",
        "popularVillagesDistricts": "பிரபலமான விவசாய கிராமங்கள் & மாவட்டங்கள்",
        "setExactDistrict": "துல்லியமான மாவட்டத்தை அமைக்கவும்",
        "fetchingDistrictData": "மாவட்ட தரவு பெறப்படுகிறது..."
    },
    "kn": {
        "District": "ಜಿಲ್ಲೆ",
        "district": "ಜಿಲ್ಲೆ",
        "Tirupati District": "ತಿರುಪತಿ ಜಿಲ್ಲೆ",
        "exactDistrictName": "ನಿಖರವಾದ ಜಿಲ್ಲೆಯ ಹೆಸರು",
        "popularVillagesDistricts": "ಜನಪ್ರಿಯ ಕೃಷಿ ಹಳ್ಳಿಗಳು ಮತ್ತು ಜಿಲ್ಲೆಗಳು",
        "setExactDistrict": "ನಿಖರವಾದ ಜಿಲ್ಲೆಯನ್ನು ಹೊಂದಿಸಿ",
        "fetchingDistrictData": "ಜಿಲ್ಲೆಯ ಡೇಟಾವನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ..."
    },
    "ml": {
        "District": "ജില്ല",
        "district": "ജില്ല",
        "Tirupati District": "തിരുപ്പതി ജില്ല",
        "exactDistrictName": "കൃത്യമായ ജില്ലയുടെ പേര്",
        "popularVillagesDistricts": "ജനപ്രിയ കാർഷിക ഗ്രാമങ്ങളും ജില്ലകളും",
        "setExactDistrict": "കൃത്യമായ ജില്ല നൽകുക",
        "fetchingDistrictData": "ജില്ലാ വിവരങ്ങൾ ശേഖരിക്കുന്നു..."
    },
    "mr": {
        "District": "जिल्हा",
        "district": "जिल्हा",
        "Tirupati District": "तिरुपती जिल्हा",
        "exactDistrictName": "अचूक जिल्ह्याचे नाव",
        "popularVillagesDistricts": "लोकप्रिय कृषी गावे आणि जिल्हे",
        "setExactDistrict": "अचूक जिल्हा सेट करा",
        "fetchingDistrictData": "जिल्हा डेटा मिळवत आहे..."
    },
    "bn": {
        "District": "জেলা",
        "district": "জেলা",
        "Tirupati District": "তিরুপতি জেলা",
        "exactDistrictName": "সঠিক জেলার নাম",
        "popularVillagesDistricts": "জনপ্রিয় কৃষি গ্রাম ও জেলা",
        "setExactDistrict": "সঠিক জেলা সেট করুন",
        "fetchingDistrictData": "জেলার তথ্য আনা হচ্ছে..."
    },
    "gu": {
        "District": "જિલ્લો",
        "district": "જિલ્લો",
        "Tirupati District": "તિરુપતિ જિલ્લો",
        "exactDistrictName": "ચોક્કસ જિલ્લાનું નામ",
        "popularVillagesDistricts": "લોકપ્રિય કૃષિ ગામો અને જિલ્લાઓ",
        "setExactDistrict": "ચોક્કસ જિલ્લો સેટ કરો",
        "fetchingDistrictData": "જિલ્લાનો ડેટા મેળવી રહ્યા છીએ..."
    },
    "pa": {
        "District": "ਜ਼ਿਲ੍ਹਾ",
        "district": "ਜ਼ਿਲ੍ਹਾ",
        "Tirupati District": "ਤਿਰੁਪਤੀ ਜ਼ਿਲ੍ਹਾ",
        "exactDistrictName": "ਸਟੀਕ ਜ਼ਿਲ੍ਹੇ ਦਾ ਨਾਂ",
        "popularVillagesDistricts": "ਮਸ਼ਹੂਰ ਖੇਤੀਬਾੜੀ ਪਿੰਡ ਅਤੇ ਜ਼ਿਲ੍ਹੇ",
        "setExactDistrict": "ਸਟੀਕ ਜ਼ਿਲ੍ਹਾ ਸੈੱਟ ਕਰੋ",
        "fetchingDistrictData": "ਜ਼ਿਲ੍ਹਾ ਡੇਟਾ ਪ੍ਰਾਪਤ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ..."
    },
    "or": {
        "District": "ଜିଲ୍ଲା",
        "district": "ଜିଲ୍ଲା",
        "Tirupati District": "ତିରୁପତି ଜିଲ୍ଲା",
        "exactDistrictName": "ସଠିକ୍ ଜିଲ୍ଲାର ନାମ",
        "popularVillagesDistricts": "ଲୋକପ୍ରିୟ କୃଷି ଗ୍ରାମ ଏବଂ ଜିଲ୍ଲା",
        "setExactDistrict": "ସଠିକ୍ ଜିଲ୍ଲା ସେଟ୍ କରନ୍ତୁ",
        "fetchingDistrictData": "ଜିଲ୍ଲା ତଥ୍ୟ ଅଣାଯାଉଛି..."
    },
    "as": {
        "District": "জিলা",
        "district": "জিলা",
        "Tirupati District": "তিৰুপতি জিলা",
        "exactDistrictName": "সঠিক জিলাৰ নাম",
        "popularVillagesDistricts": "জনপ্ৰিয় কৃষি গাঁও আৰু জিলাসমূহ",
        "setExactDistrict": "সঠিক জিলা ছেট কৰক",
        "fetchingDistrictData": "জিলাৰ তথ্য অনা হৈছে..."
    },
    "ur": {
        "District": "ضلع",
        "district": "ضلع",
        "Tirupati District": "تیرپتی ضلع",
        "exactDistrictName": "صحیح ضلع کا نام",
        "popularVillagesDistricts": "مشہور زرعی گاؤں اور اضلاع",
        "setExactDistrict": "صحیح ضلع قائم کریں",
        "fetchingDistrictData": "ضلع کا ڈیٹا حاصل کیا جا رہا ہے..."
    },
    "mai": {
        "District": "जिला",
        "district": "जिला",
        "Tirupati District": "तिरुपति जिला",
        "exactDistrictName": "सटीक जिलाक नाम",
        "popularVillagesDistricts": "लोकप्रिय कृषि गाम आ जिला",
        "setExactDistrict": "सटीक जिला सेट करू",
        "fetchingDistrictData": "जिला डेटा प्राप्त कएल जा रहल अछि..."
    },
    "mni": {
        "District": "জিল্লা",
        "district": "জিল্লা",
        "Tirupati District": "તિરુપતિ જિલ્લો",
        "exactDistrictName": "অচুম্বা জিল্লাগী মমিং",
        "popularVillagesDistricts": "মমিং চৎপা লৌউ-শিংউ খুঙ্গুল অমসুং জিল্লাশিং",
        "setExactDistrict": "অચুম্বা জিল্লা সেৎ তৌবীয়ু",
        "fetchingDistrictData": "জিল্লাগী দেতা লৌখৎলীবনি..."
    },
    "sat": {
        "District": " district",
        "district": " district",
        "Tirupati District": " ᱛ ᱤ ᱨ ᱩ ᱯ ᱟ ᱴ ᱤ   district",
        "exactDistrictName": "District Name",
        "popularVillagesDistricts": "Popular Villages & Districts",
        "setExactDistrict": "Set District",
        "fetchingDistrictData": "Fetching district data..."
    },
    "brx": {
        "District": "जिल्ला",
        "district": "जिल्ला",
        "Tirupati District": "तिरुपति जिल्ला",
        "exactDistrictName": "गेबें जिल्लानि मुं",
        "popularVillagesDistricts": "मुंथिंखानाय आबादफारि गामि आरो जिल्लाफोर",
        "setExactDistrict": "गेबें जिल्ला फज'",
        "fetchingDistrictData": "जिल्लानि तथिखौ लाबोनाय जाबाय दं..."
    },
    "doi": {
        "District": "जिला",
        "district": "जिला",
        "Tirupati District": "तिरुपति जिला",
        "exactDistrictName": "सटीक जिले दा नां",
        "popularVillagesDistricts": "मशहूर खेतीबाड़ी गरां ते जिले",
        "setExactDistrict": "सटीक जिला सेट करो",
        "fetchingDistrictData": "जिला डेटा हासल कीता जा करदा ऐ..."
    },
    "ks": {
        "District": "ضلع",
        "district": "ضلع",
        "Tirupati District": "تیرپتی ضلع",
        "exactDistrictName": "جان ضلعہٕ ناو",
        "popularVillagesDistricts": "مقبول کھیتی باڑی گام تہٕ ضلعہٕ",
        "setExactDistrict": "جان ضلعہٕ سیٹ کٔریو",
        "fetchingDistrictData": "ضلعہٕ ڈیٹا اننہٕ یوان..."
    },
    "kok": {
        "District": "जिल्हो",
        "district": "जिल्हो",
        "Tirupati District": "तिरुपतीिल्हो",
        "exactDistrictName": "सारको जिल्ह्याचें नांव",
        "popularVillagesDistricts": "फामाद शेतकी गांवा आनी जिल्हे",
        "setExactDistrict": "सारको जिल्हो थारायात",
        "fetchingDistrictData": "जिल्ह्याची बातमी मेळटा..."
    },
    "ne": {
        "District": "जिल्ला",
        "district": "जिल्ला",
        "Tirupati District": "तिरुपति जिल्ला",
        "exactDistrictName": "सही जिल्लाको नाम",
        "popularVillagesDistricts": "लोकप्रिय कृषि गाउँ र जिल्लाहरू",
        "setExactDistrict": "सही जिल्ला सेट गर्नुहोस्",
        "fetchingDistrictData": "जिल्ला डेटा प्राप्त गरिँदैछ..."
    },
    "sa": {
        "District": "मण्डलम्",
        "district": "मण्डलम्",
        "Tirupati District": "तिरुपति-मण्डलम्",
        "exactDistrictName": "यथार्थमण्डलनाम",
        "popularVillagesDistricts": "प्रसिद्धाः कृषिपल्लीः मण्डलानि च",
        "setExactDistrict": "यथार्थमण्डलं निर्धारयतु",
        "fetchingDistrictData": "मण्डलदत्तांशः आनीयते..."
    },
    "sd": {
        "District": "ضلعو",
        "district": "ضلعو",
        "Tirupati District": "تيرپتي ضلعو",
        "exactDistrictName": "صحيح ضلعي جو نالو",
        "popularVillagesDistricts": "مشهور زرعي ڳوٺ ۽ اضلاع",
        "setExactDistrict": "صحيح ضلعو مقرر ڪريو",
        "fetchingDistrictData": "ضلعي جو ڊيٽا حاصل ٿي رهيو آهي..."
    }
}

file_path = 'src/translations/index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

json_str = re.sub(r'^export const TRANSLATIONS:[^{]*', '', content).strip()
if json_str.endswith(';'): json_str = json_str[:-1].strip()

data = json.loads(json_str)

updated_count = 0
for lang, trans_dict in DISTRICT_TRANSLATIONS.items():
    if lang in data:
        for k, v in trans_dict.items():
            data[lang][k] = v
            updated_count += 1

new_json_str = json.dumps(data, ensure_ascii=False, indent=2)
new_content = f"export const TRANSLATIONS: Record<string, Record<string, string>> = {new_json_str};\n"

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully updated {updated_count} District translation keys across {len(DISTRICT_TRANSLATIONS)} languages!")
