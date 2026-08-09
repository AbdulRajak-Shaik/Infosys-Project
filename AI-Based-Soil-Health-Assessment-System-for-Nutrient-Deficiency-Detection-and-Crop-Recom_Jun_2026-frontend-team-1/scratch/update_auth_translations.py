import json, re

AUTH_TRANSLATIONS = {
    "hi": {
        "welcomeBack": "वापसी पर स्वागत है!",
        "farmerLogin": "किसान लॉगिन",
        "farmerLoginDesc": "अपने फार्म डैशबोर्ड, मृदा स्वास्थ्य रिपोर्ट और फसल सिफारिशों तक पहुँचने के लिए साइन इन करें",
        "adminLogin": "एडमिन लॉगिन",
        "adminLoginDesc": "सिस्टम प्रशासन, उपयोगकर्ता प्रबंधन और AI विश्लेषण तक पहुँचने के लिए साइन इन करें",
        "signInAsFarmer": "किसान के रूप में साइन इन करें",
        "signInAsAdmin": "एडमिन के रूप में साइन इन करें"
    },
    "te": {
        "welcomeBack": "తిరిగి స్వాగతం!",
        "farmerLogin": "రైతు లాగిన్",
        "farmerLoginDesc": "మీ ఫారమ్ డాష్‌బోర్డ్, నేల ఆరోగ్య నివేదికలు మరియు పంట సిఫార్సులను పొందడానికి సైన్ ఇన్ చేయండి",
        "adminLogin": "అడ్మిన్ లాగిన్",
        "adminLoginDesc": "సిస్టమ్ అడ్మినిస్ట్రేషన్, యూజర్ మేనేజ్‌మెంట్ మరియు AI అనలిటిక్స్‌ని పొందడానికి సైన్ ఇన్ చేయండి",
        "signInAsFarmer": "రైతుగా సైన్ ఇన్ చేయండి",
        "signInAsAdmin": "అడ్మిన్‌గా సైన్ ఇన్ చేయండి"
    },
    "ta": {
        "welcomeBack": "மீண்டும் வருக!",
        "farmerLogin": "விவசாயி உள்நுழைவு",
        "farmerLoginDesc": "உங்கள் பண்ணை டாஷ்போர்டு, மண் சுகாதார அறிக்கைகள் மற்றும் பயிர் பரிந்துரைகளை அணுக உள்நுழையவும்",
        "adminLogin": "நிர்வாகி உள்நுழைவு",
        "adminLoginDesc": "அமைப்பின் நிர்வாகம் மற்றும் AI பகுப்பாய்வுகளை அணுக உள்நுழையவும்",
        "signInAsFarmer": "விவசாயியாக உள்நுழைக",
        "signInAsAdmin": "நிர்வாகியாக உள்நுழைக"
    },
    "kn": {
        "welcomeBack": "ಮತ್ತೆ ಸುಸ್ವಾಗತ!",
        "farmerLogin": "ರೈತರ ಲಾಗಿನ್",
        "farmerLoginDesc": "ನಿಮ್ಮ ಫಾರ್ಮ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, ಮಣ್ಣಿನ ಆರೋಗ್ಯ ವರದಿಗಳು ಮತ್ತು ಬೆಳೆ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಲು ಲಾಗಿನ್ ಮಾಡಿ",
        "adminLogin": "ಅಡ್ಮಿನ್ ಲಾಗಿನ್",
        "adminLoginDesc": "ಸಿಸ್ಟಮ್ ಆಡಳಿತ, ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ ಮತ್ತು AI ವಿಶ್ಲೇಷಣೆಗಳನ್ನು ಪಡೆಯಲು ಲಾಗಿನ್ ಮಾಡಿ",
        "signInAsFarmer": "ರೈತರಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ",
        "signInAsAdmin": "ಅಡ್ಮಿನ್ ಆಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ"
    },
    "ml": {
        "welcomeBack": "വീണ്ടും സ്വാഗതം!",
        "farmerLogin": "കർഷക ലോഗിൻ",
        "farmerLoginDesc": "നിങ്ങളുടെ ഫാം ഡാഷ്‌ബോർഡ്, മണ്ണ് ആരോഗ്യ റിപ്പോർട്ടുകൾ, വിള ശുപാർശകൾ എന്നിവ ലഭ്യമാക്കാൻ ലോഗിൻ ചെയ്യുക",
        "adminLogin": "അഡ്മിൻ ലോഗിൻ",
        "adminLoginDesc": "സിസ്റ്റം അഡ്മിനിസ്ട്രേഷൻ, ഉപയോക്തൃ മാനേജ്മെന്റ് എന്നിവ ലഭ്യമാക്കാൻ ലോഗിൻ ചെയ്യുക",
        "signInAsFarmer": "കർഷകനായി സൈൻ ഇൻ ചെയ്യുക",
        "signInAsAdmin": "അഡ്മിനായി സൈൻ ഇൻ ചെയ്യുക"
    },
    "mr": {
        "welcomeBack": "पुन्हा स्वागत आहे!",
        "farmerLogin": "शेतकरी लॉगिन",
        "farmerLoginDesc": "तुमचा शेती डॅशबोर्ड, माती आरोग्य अहवाल आणि पीक शिफारसी मिळवण्यासाठी साइन इन करा",
        "adminLogin": "अ‍ॅडमिन लॉगिन",
        "adminLoginDesc": "सिस्टम प्रशासन, वापरकर्ता व्यवस्थापन आणि AI विश्लेषण मिळवण्यासाठी साइन इन करा",
        "signInAsFarmer": "शेतकरी म्हणून साइन इन करा",
        "signInAsAdmin": "अ‍ॅडमिन म्हणून साइन इन करा"
    },
    "bn": {
        "welcomeBack": "আবারও স্বাগতম!",
        "farmerLogin": "কৃষক লগইন",
        "farmerLoginDesc": "আপনার খামার ড্যাশবোর্ড, মাটির স্বাস্থ্য প্রতিবেদন এবং ফসল সুপারিশ অ্যাক্সেস করতে সাইন ইন করুন",
        "adminLogin": "এডমিন লগইন",
        "adminLoginDesc": "সিস্টেম প্রশাসন, ব্যবহারকারী ব্যবস্থাপনা এবং AI বিশ্লেষণ অ্যাক্সেস করতে সাইন ইন করুন",
        "signInAsFarmer": "কৃষক হিসেবে সাইন ইন করুন",
        "signInAsAdmin": "এডমিন হিসেবে সাইন ইন করুন"
    },
    "gu": {
        "welcomeBack": "પાછા આવવા બદલ સ્વાગત છે!",
        "farmerLogin": "ખેડૂત લોગિન",
        "farmerLoginDesc": "તમારા ફાર્મ ડેશબોર્ડ, જમીન સ્વાસ્થ્ય અહેવાલો અને પાક ભલામણો મેળવવા સાઇન ઇન કરો",
        "adminLogin": "એડમિન લોગિન",
        "adminLoginDesc": "સિસ્ટમ વહીવટ, વપરાશકર્તા સંચાલન અને AI પૃથક્કરણ મેળવવા સાઇન ઇન કરો",
        "signInAsFarmer": "ખેડૂત તરીકે સાઇન ઇન કરો",
        "signInAsAdmin": "એડમિન તરીકે સાઇન ઇન કરો"
    },
    "pa": {
        "welcomeBack": "ਜੀ ਆਇਆਂ ਨੂੰ!",
        "farmerLogin": "ਕਿਸਾਨ ਲੌਗਇਨ",
        "farmerLoginDesc": "ਆਪਣੇ ਫਾਰਮ ਡੈਸ਼ਬੋਰਡ, ਮਿੱਟੀ ਸਿਹਤ ਰਿਪੋਰਟਾਂ ਅਤੇ ਫਸਲ ਸਿਫਾਰਸ਼ਾਂ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ",
        "adminLogin": "ਐਡਮਿਨ ਲੌਗਇਨ",
        "adminLoginDesc": "ਸਿਸਟਮ ਪ੍ਰਬੰਧਨ, ਵਰਤੋਂਕਾਰ ਸੰਭਾਲ ਅਤੇ AI ਵਿਸ਼ਲੇਸ਼ਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ",
        "signInAsFarmer": "ਕਿਸਾਨ ਵਜੋਂ ਸਾਈਨ ਇਨ ਕਰੋ",
        "signInAsAdmin": "ਐਡਮਿਨ ਵਜੋਂ ਸਾਈਨ ਇਨ ਕਰੋ"
    },
    "or": {
        "welcomeBack": "ପୁନର୍ବାର ସ୍ୱାଗତ!",
        "farmerLogin": "କୃଷକ ଲଗଇନ୍",
        "farmerLoginDesc": "ଆପଣଙ୍କ ଫାର୍ମ ଡ୍ୟାସବୋର୍ଡ, ମାଟି ସ୍ୱାସ୍ଥ୍ୟ ରିପୋର୍ଟ ଏବଂ ଫସଲ ସୁପାରିଶ ପାଇବା ପାଇଁ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ",
        "adminLogin": "ଆଡମିନ୍ ଲଗଇନ୍",
        "adminLoginDesc": "ସିଷ୍ଟମ୍ ପ୍ରଶାସନ, ବ୍ୟବହାରକାରୀ ପରିଚାଳନା ଏବଂ AI ବିଶ୍ଳେଷଣ ପାଇଁ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ",
        "signInAsFarmer": "କୃଷକ ଭାବରେ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ",
        "signInAsAdmin": "ଆଡମିନ୍ ଭାବରେ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ"
    },
    "as": {
        "welcomeBack": "পুনৰ স্বাগতম!",
        "farmerLogin": "কৃষক লগইন",
        "farmerLoginDesc": "আপোনাৰ ফাৰ্ম ড্যাশবৰ্ড, মাটিৰ স্বাস্থ্য ৰিপোৰ্ট আৰু শস্য পৰামৰ্শসমূহ চাবলৈ ছাইন ইন কৰক",
        "adminLogin": "এডমিন লগইন",
        "adminLoginDesc": "ছিষ্টেম প্ৰশাসন, ব্যৱহাৰকাৰী ব্যৱস্থাপনা আৰু AI বিশ্লেষণৰ বাবে ছাইন ইন কৰক",
        "signInAsFarmer": "কৃষক হিচাপে ছাইন ইন কৰক",
        "signInAsAdmin": "এডমিন হিচাপে ছাইন ইন কৰক"
    },
    "ur": {
        "welcomeBack": "دوبارہ خوش آمدید!",
        "farmerLogin": "کسان لاگ ان",
        "farmerLoginDesc": "اپنے فارم ڈیش بورڈ، مٹی کی صحت کی رپورٹس اور فصل کی سفارشات کے لیے سائن ان کریں",
        "adminLogin": "ایڈمن لاگ ان",
        "adminLoginDesc": "سسٹم ایڈمنسٹریشن، صارف کی منتقلی اور AI تجزیات کے لیے سائن ان کریں",
        "signInAsFarmer": "بطور کسان سائن ان کریں",
        "signInAsAdmin": "بطور ایڈمن سائن ان کریں"
    },
    "mai": {
        "welcomeBack": "पुनः स्वागत अछि!",
        "farmerLogin": "किसान लॉगिन",
        "farmerLoginDesc": "अहाँक फार्म डैशबोर्ड, माटि स्वास्थ्य रिपोर्ट आ फसल सिफारिश देखबा लेल साइन इन करू",
        "adminLogin": "एडमिन लॉगिन",
        "adminLoginDesc": "सिस्टम प्रशासन, उपयोगकर्ता प्रबंधन आ AI विश्लेषण लेल साइन इन करू",
        "signInAsFarmer": "किसानक रूप मे साइन इन करू",
        "signInAsAdmin": "एडमिनक रूप मे साइन इन करू"
    },
    "mni": {
        "welcomeBack": "અમુક હন্না তরাম্না ওকচরী!",
        "farmerLogin": "লৌমী লগইন",
        "farmerLoginDesc": "নাকোগী লৌবুক দেসবোর্দ অমসুং লৈমাই নৈনবগী রিপোর্তশিং য়েংনবগীদমক সাইন ইন তৌবিয়ু",
        "adminLogin": "এদমিন লগইন",
        "adminLoginDesc": "সিস্তেম মেনেজমেন্ত অমসুং AI এনেলাইতিস য়েংনবগীদমক সাইন ইন তৌবিয়ু",
        "signInAsFarmer": "লৌমী ওইনা সাইন ইন তৌবিয়ু",
        "signInAsAdmin": "এদমিন ওইনা সাইন ইন তৌবিয়ু"
    },
    "sat": {
        "welcomeBack": "ᱫᱚᱦᱲᱟ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ",
        "farmerLogin": "ᱪᱟᱥᱤ ᱞᱚᱜᱤᱱ",
        "farmerLoginDesc": "ᱟᱢᱟᱜ ᱪᱟᱥ ᱰᱮᱥᱵᱚᱨᱰ ᱟᱨ ᱦᱟᱥᱟ ᱨᱤᱯᱚᱨᱴ ᱞᱟᱹᱜᱤᱫ login ᱢᱮ",
        "adminLogin": "ᱮᱰᱢᱤᱱ ᱞᱚᱜᱤᱱ",
        "adminLoginDesc": " System administration ᱞᱟᱹᱜᱤᱫ login ᱢᱮ",
        "signInAsFarmer": "ᱪᱟᱥᱤ ᱞᱮᱠᱟᱛᱮ Sign In ᱢᱮ",
        "signInAsAdmin": "ᱮᱰᱢᱤᱱ ᱞᱮᱠᱟᱛᱮ Sign In ᱢᱮ"
    },
    "brx": {
        "welcomeBack": "फिन बरायबाय!",
        "farmerLogin": "आबादफारि लगइन",
        "farmerLoginDesc": "नोंनि आबादफारि डैशबर्ड आरो हा बिजिरनाय रिपर्टफोरखौ नायनो थाखाय साइन इन खालाम",
        "adminLogin": "एडमिन लगइन",
        "adminLoginDesc": "सिस्टेम सामलायनाय आरो AI बिजिरनायखौ नायनो थाखाय साइन इन खालाम",
        "signInAsFarmer": "आबादफारि हिसाबै साइन इन खालाम",
        "signInAsAdmin": "एडमिन हिसाबै साइन इन खालाम"
    },
    "doi": {
        "welcomeBack": "परतियै स्वागत ऐ!",
        "farmerLogin": "किसान लॉगिन",
        "farmerLoginDesc": "अपने फ़ार्म डैशबोर्ड ते मिट्टी सेहत रिपोर्टां देखने लेई साइन इन करो",
        "adminLogin": "एडमिन लॉगिन",
        "adminLoginDesc": "सिस्टम प्रशासन ते AI विश्लेषण देखने लेई साइन इन करो",
        "signInAsFarmer": "किसान दे रूप च साइन इन करो",
        "signInAsAdmin": "एडमिन दे रूप च साइन इन करो"
    },
    "ks": {
        "welcomeBack": "دوٚبارٕ سوات!",
        "farmerLogin": "زمیندار لاگ اِن",
        "farmerLoginDesc": "پنُن فام ڈیش بورڈ تہٕ زمینِ ہنٛز رپورٹ وُچھنہٕ خٲطرٕ کٔریو سائن اِن",
        "adminLogin": "ایڈمن لاگ اِن",
        "adminLoginDesc": "سسٹم مینیجمنٹ تہٕ AI تجزئیہٕ خٲطرٕ کٔریو سائن اِن",
        "signInAsFarmer": "زمیندارس پٲٹھہِ کٔریو سائن اِن",
        "signInAsAdmin": "ایڈمنس پٲٹھہِ کٔریو سائن اِن"
    },
    "kok": {
        "welcomeBack": "परतून येवकार!",
        "farmerLogin": "शेतकार लॉगिन",
        "farmerLoginDesc": "तुमचो शेतकी डॅशबोर्ड आनी माती तपासणी अहवाल पळोवपाक साइन इन करात",
        "adminLogin": "ॲडमिन लॉगिन",
        "adminLoginDesc": "सिस्टम व्यवस्थापन आनी AI विश्लेषण पळोवपाक साइन इन करात",
        "signInAsFarmer": "शेतकार म्हणून साइन इन करात",
        "signInAsAdmin": "ॲडमिन म्हणून साइन इन करात"
    },
    "ne": {
        "welcomeBack": "पुनः स्वागत छ!",
        "farmerLogin": "किसान लगइन",
        "farmerLoginDesc": "तपाईंको फार्म ड्यासबोर्ड र माटो स्वास्थ्य रिपोर्टहरू हेर्नका लागि साइन इन गर्नुहोस्",
        "adminLogin": "एडमिन लगइन",
        "adminLoginDesc": "सिस्टम प्रशासन र AI विश्लेषणहरू हेर्नका लागि साइन इन गर्नुहोस्",
        "signInAsFarmer": "किसानको रूपमा साइन इन गर्नुहोस्",
        "signInAsAdmin": "एडमिनको रूपमा साइन इन गर्नुहोस्"
    },
    "sa": {
        "welcomeBack": "पुनः स्वागतम्!",
        "farmerLogin": "कृषकप्रवेशः",
        "farmerLoginDesc": "भवतः कृषिपुटं मृत्तिकास्वास्थ्यविवरणं च द्रष्टुं प्रविशतु",
        "adminLogin": "प्रशासकप्रवेशः",
        "adminLoginDesc": "तन्त्रप्रशासनं AI-विश्लेषणं च प्राप्तुं प्रविशतु",
        "signInAsFarmer": "कृषकरूपेण प्रविशतु",
        "signInAsAdmin": "प्रशासकरूपेण प्रविशतु"
    },
    "sd": {
        "welcomeBack": "ٻيهر ڀليڪار!",
        "farmerLogin": "هاري لاگ ان",
        "farmerLoginDesc": "پنهنجو فارم ڊيش بورڊ ۽ زمين جي صحت رپورٽون ڏسڻ لاءِ سائن ان ڪريو",
        "adminLogin": "ايڊمن لاگ ان",
        "adminLoginDesc": "سسٽم انتظاميا ۽ AI تجزيي لاءِ سائن ان ڪريو",
        "signInAsFarmer": "هاري طور سائن ان ڪريو",
        "signInAsAdmin": "ايڊمن طور سائن ان ڪريو"
    }
}

file_path = 'src/translations/index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

json_str = re.sub(r'^export const TRANSLATIONS:[^{]*', '', content).strip()
if json_str.endswith(';'): json_str = json_str[:-1].strip()

data = json.loads(json_str)

updated_count = 0
for lang, trans_dict in AUTH_TRANSLATIONS.items():
    if lang in data:
        for k, v in trans_dict.items():
            data[lang][k] = v
            updated_count += 1

new_json_str = json.dumps(data, ensure_ascii=False, indent=2)
new_content = f"export const TRANSLATIONS: Record<string, Record<string, string>> = {new_json_str};\n"

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully updated {updated_count} auth keys across {len(AUTH_TRANSLATIONS)} languages!")
