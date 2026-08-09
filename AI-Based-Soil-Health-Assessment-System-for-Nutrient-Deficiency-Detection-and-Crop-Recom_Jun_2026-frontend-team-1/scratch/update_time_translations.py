import json, re

TIME_TRANSLATIONS = {
    "hi": {
        "justNow": "अभी-अभी",
        "minsAgo": "मिनट पहले",
        "hourAgo": "घंटे पहले",
        "hoursAgo": "घंटे पहले",
        "dayAgo": "दिन पहले",
        "daysAgo": "दिन पहले"
    },
    "te": {
        "justNow": "ఇప్పుడే",
        "minsAgo": "నిమిషాల క్రితం",
        "hourAgo": "గంట క్రితం",
        "hoursAgo": "గంటల క్రితం",
        "dayAgo": "రోజు క్రితం",
        "daysAgo": "రోజుల క్రితం"
    },
    "ta": {
        "justNow": "இப்போதுதான்",
        "minsAgo": "நிமிடங்களுக்கு முன்",
        "hourAgo": "மணிநேரத்திற்கு முன்",
        "hoursAgo": "மணிநேரங்களுக்கு முன்",
        "dayAgo": "நாளைக்கு முன்",
        "daysAgo": "நாட்களுக்கு முன்"
    },
    "kn": {
        "justNow": "ಈಗಷ್ಟೇ",
        "minsAgo": "ನಿಮಿಷಗಳ ಹಿಂದೆ",
        "hourAgo": "ಗಂಟೆಯ ಹಿಂದೆ",
        "hoursAgo": "ಗಂಟೆಗಳ ಹಿಂದೆ",
        "dayAgo": "ದಿನದ ಹಿಂದೆ",
        "daysAgo": "ದಿನಗಳ ಹಿಂದೆ"
    },
    "ml": {
        "justNow": "ഇപ്പോൾ തന്നെ",
        "minsAgo": "മിനിറ്റുകൾക്ക് മുൻപ്",
        "hourAgo": "മണിക്കൂറിന് മുൻപ്",
        "hoursAgo": "മണിക്കൂറുകൾക്ക് മുൻപ്",
        "dayAgo": "ദിവസത്തിന് മുൻപ്",
        "daysAgo": "ദിവസങ്ങൾക്ക് മുൻപ്"
    },
    "mr": {
        "justNow": "आत्ताच",
        "minsAgo": "मिनिटांपूर्वी",
        "hourAgo": "तासापूर्वी",
        "hoursAgo": "तासांपूर्वी",
        "dayAgo": "दिवसापूर्वी",
        "daysAgo": "दिवसांपूर्वी"
    },
    "bn": {
        "justNow": "এইমাত্র",
        "minsAgo": "মিনিট আগে",
        "hourAgo": "ঘন্টা আগে",
        "hoursAgo": "ঘন্টা আগে",
        "dayAgo": "দিন আগে",
        "daysAgo": "দিন আগে"
    },
    "gu": {
        "justNow": "હમણાં જ",
        "minsAgo": "મિનિટ પહેલાં",
        "hourAgo": "કલાક પહેલાં",
        "hoursAgo": "કલાકો પહેલાં",
        "dayAgo": "દિવસ પહેલાં",
        "daysAgo": "દિવસો પહેલાં"
    },
    "pa": {
        "justNow": "ਹੁਣੇ ਹੀ",
        "minsAgo": "ਮਿੰਟ ਪਹਿਲਾਂ",
        "hourAgo": "ਘੰਟਾ ਪਹਿਲਾਂ",
        "hoursAgo": "ਘੰਟੇ ਪਹਿਲਾਂ",
        "dayAgo": "ਦਿਨ ਪਹਿਲਾਂ",
        "daysAgo": "ਦਿਨ ਪਹਿਲਾਂ"
    },
    "or": {
        "justNow": "ଏବେ",
        "minsAgo": "ମିନିଟ୍ ପୂର୍ବରୁ",
        "hourAgo": "ଘଣ୍ଟା ପୂର୍ବରୁ",
        "hoursAgo": "ଘଣ୍ଟା ପୂର୍ବରୁ",
        "dayAgo": "ଦିନ ପୂର୍ବରୁ",
        "daysAgo": "ଦିନ ପୂର୍ବରୁ"
    },
    "as": {
        "justNow": "এইমাত্ৰ",
        "minsAgo": "মিনিট পূৰ্বে",
        "hourAgo": "ঘণ্টা পূৰ্বে",
        "hoursAgo": "ঘণ্টা পূৰ্বে",
        "dayAgo": "দিন পূৰ্বে",
        "daysAgo": "দিন পূৰ্বে"
    },
    "ur": {
        "justNow": "ابھی ابھی",
        "minsAgo": "منٹ پہلے",
        "hourAgo": "گھنٹہ پہلے",
        "hoursAgo": "گھنٹے پہلے",
        "dayAgo": "دن پہلے",
        "daysAgo": "دن پہلے"
    },
    "mai": {
        "justNow": "एखने",
        "minsAgo": "मिनट पहिने",
        "hourAgo": "घंटा पहिने",
        "hoursAgo": "घंटा पहिने",
        "dayAgo": "दिन पहिने",
        "daysAgo": "दिन पहिने"
    },
    "mni": {
        "justNow": "হৌjikতমা",
        "minsAgo": "মিনিতকী মমাংদা",
        "hourAgo": "পুংগী মমাংদা",
        "hoursAgo": "পুংগী মমাংদা",
        "dayAgo": "নুমিৎগী মমাংদা",
        "daysAgo": "নুমিৎগী মমাংদা"
    },
    "sat": {
        "justNow": "ᱱᱤᱛ standard ᱜ standard ᱮ",
        "minsAgo": " standard ᱢ standard ᱤ standard ᱱ standard ᱤ standard ᱴ standard  ᱢ standard ᱟ standard ᱲ standard ᱟ standard ᱝ",
        "hourAgo": " standard ᱴ standard ᱟ standard ᱲ standard ᱟ standard ᱝ ᱢ standard ᱟ standard ᱲ standard ᱟ standard ᱝ",
        "hoursAgo": " standard ᱴ standard ᱟ standard ᱲ standard ᱟ standard ᱝ ᱢ standard ᱟ standard ᱲ standard ᱟ standard ᱝ",
        "dayAgo": " standard ᱢ standard ᱟ standard ᱦ standard ᱟ standard  ᱢ standard ᱟ standard ᱲ standard ᱟ standard ᱝ",
        "daysAgo": " standard ᱢ standard ᱟ standard ᱦ standard ᱟ standard  ᱢ standard ᱟ standard ᱲ standard ᱟ standard ᱝ"
    },
    "brx": {
        "justNow": "दानोलो",
        "minsAgo": "मिनिट सिगां",
        "hourAgo": "घन्टा सिगां",
        "hoursAgo": "घन्टा सिगां",
        "dayAgo": "सान सिगां",
        "daysAgo": "सान सिगां"
    },
    "doi": {
        "justNow": "अज्जै गै",
        "minsAgo": "मिनट पैहले",
        "hourAgo": "घंटे पैहले",
        "hoursAgo": "घंटे पैहले",
        "dayAgo": "दिन पैहले",
        "daysAgo": "दिन पैहले"
    },
    "ks": {
        "justNow": "وینسئے",
        "minsAgo": "منٹ برونہہ",
        "hourAgo": "گینٹہہ برونہہ",
        "hoursAgo": "گینٹہہ برونہہ",
        "dayAgo": "دۄہ برونہہ",
        "daysAgo": "دۄہ برونہہ"
    },
    "kok": {
        "justNow": "आताच",
        "minsAgo": "मिनाटां आदीं",
        "hourAgo": "वरा आदीं",
        "hoursAgo": "वरां आदीं",
        "dayAgo": "दिसा आदीं",
        "daysAgo": "दिस आदीं"
    },
    "ne": {
        "justNow": "भर्खरै",
        "minsAgo": "मिनेट अघि",
        "hourAgo": "घण्टा अघि",
        "hoursAgo": "घण्टा अघि",
        "dayAgo": "दिन अघि",
        "daysAgo": "दिन अघि"
    },
    "sa": {
        "justNow": "अधुना एव",
        "minsAgo": "निमेषेभ्यः पूर्वम्",
        "hourAgo": "होरायाः पूर्वम्",
        "hoursAgo": "होराभ्यः पूर्वम्",
        "dayAgo": "दिनात् पूर्वम्",
        "daysAgo": "दिनेभ्यः पूर्वम्"
    },
    "sd": {
        "justNow": "هاڻي ئي",
        "minsAgo": "منٽ اڳ",
        "hourAgo": "ڪلاڪ اڳ",
        "hoursAgo": "ڪلاڪ اڳ",
        "dayAgo": "ڏينهن اڳ",
        "daysAgo": "ڏينهن اڳ"
    }
}

file_path = 'src/translations/index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

json_str = re.sub(r'^export const TRANSLATIONS:[^{]*', '', content).strip()
if json_str.endswith(';'): json_str = json_str[:-1].strip()

data = json.loads(json_str)

updated_count = 0
for lang, trans_dict in TIME_TRANSLATIONS.items():
    if lang in data:
        for k, v in trans_dict.items():
            data[lang][k] = v
            updated_count += 1

new_json_str = json.dumps(data, ensure_ascii=False, indent=2)
new_content = f"export const TRANSLATIONS: Record<string, Record<string, string>> = {new_json_str};\n"

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully updated {updated_count} time translation keys across {len(TIME_TRANSLATIONS)} languages!")
