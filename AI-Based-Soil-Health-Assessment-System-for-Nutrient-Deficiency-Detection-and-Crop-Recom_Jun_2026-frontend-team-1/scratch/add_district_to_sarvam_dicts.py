import json, re

DISTRICT_MAP = {
    "hi": "जिला",
    "te": "జిల్లా",
    "ta": "மாவட்டம்",
    "kn": "ಜಿಲ್ಲೆ",
    "ml": "ജില്ല",
    "mr": "जिल्हा",
    "bn": "জেলা",
    "gu": "જિલ્લો",
    "pa": "ਜ਼ਿਲ੍ਹਾ",
    "or": "ଜିଲ୍ଲା",
    "as": "জিলা",
    "ur": "ضلع",
    "mai": "जिला",
    "mni": "জিল্লা",
    "sat": " district",
    "brx": "जिल्ला",
    "doi": "जिला",
    "ks": "ضلع",
    "kok": "जिल्हो",
    "ne": "जिल्ला",
    "sa": "मण्डलम्",
    "sd": "ضلعو"
}

with open("scratch/generate_sarvam_dicts.py", "r", encoding="utf-8") as f:
    content = f.read()

# Read NAME_LOCATION_DICTIONARY from file
match = re.search(r'NAME_LOCATION_DICTIONARY = (\{.*?\n\})', content, re.DOTALL)
if match:
    dict_str = match.group(1)
    # Simple parse
    dict_obj = eval(dict_str)
    for lang, dist_word in DISTRICT_MAP.items():
        if lang in dict_obj:
            dict_obj[lang]["District"] = dist_word
            dict_obj[lang]["district"] = dist_word
            dict_obj[lang]["Tirupati District"] = f"{dict_obj[lang].get('Tirupati', 'Tirupati')} {dist_word}"
    
    # Re-write dictionary into python script
    new_dict_str = f"NAME_LOCATION_DICTIONARY = {json.dumps(dict_obj, ensure_ascii=False, indent=4)}"
    new_content = content[:match.start()] + new_dict_str + content[match.end():]
    with open("scratch/generate_sarvam_dicts.py", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully updated generate_sarvam_dicts.py with District mappings!")
