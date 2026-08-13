"""Sarvam AI translation helper with built-in regional language caching and fallback dictionary."""

import json
import logging
from urllib.request import Request, urlopen
from typing import Optional

from app.config import settings

_LOGGER = logging.getLogger(__name__)

# Global translation cache: (text, lang_code) -> translated_text
_TRANSLATION_CACHE: dict[tuple[str, str], str] = {}

# Canonical language mapping matching DB table
_LANGUAGE_CODES = {
    1: "en-IN",
    2: "hi-IN",
    3: "te-IN",
    4: "ta-IN",
    5: "kn-IN",
    6: "ml-IN",
    7: "mr-IN",
    8: "gu-IN",
    9: "bn-IN",
    10: "pa-IN",
    11: "or-IN",
    12: "as-IN",
    13: "ur-IN",
    14: "mai-IN",
    15: "mni-IN",
    16: "sat-IN",
    17: "brx-IN",
    18: "doi-IN",
    19: "ks-IN",
    20: "kok-IN",
    21: "ne-IN",
    22: "sa-IN",
    23: "sd-IN",
}

_TRANSLATION_MAP = {
    "sat-IN": {
        "Hyderabad": "ᱦᱟᱭᱫᱽᱨᱟᱵᱟᱫᱽ",
        "Delhi": "ᱫᱤᱞᱞᱤ",
        "Chennai": "ᱪᱮᱱᱱᱟᱭ",
        "Mumbai": "ᱢᱩᱢᱵᱟᱭ",
        "Bangalore": "ᱵᱮᱝᱜᱟᱞᱩᱨᱩ",
        "Clear Sky": "ᱥᱟᱯᱷᱟ ᱥᱮᱨᱢᱟ",
        "Partly Cloudy": "ᱵᱟᱹᱭ-ᱵᱟᱹᱭ ᱨᱤᱢᱤᱞ",
        "Scattered Clouds": "ᱯᱟᱥᱱᱟᱣ ᱨᱤᱢᱤᱞ",
        "Overcast Clouds": "ᱜᱟ deep ᱨᱤᱢᱤᱞ",
        "Broken Clouds": "ᱨᱟᱹᱯᱩᱫ ᱨᱤᱢᱤᱞ",
        "Light Rain": "ᱨᱟᱣᱟᱞ ᱫᱟᱜ",
        "Moderate Rain": "ᱛᱟᱞᱟ ᱫᱟᱜ",
        "Heavy Rain": "ᱡᱚᱨ ᱫᱟᱜ",
        "Sunny": "ᱥᱤᱛᱩᱝ",
        "Rainy": "ᱫᱟᱜ ᱨᱤᱢᱤᱞ",
        "Cloudy": "ᱨᱤᱢᱤᱞ",
        "Monday": "ᱚᱛᱮ ᱢᱟᱦᱟ",
        "Tuesday": "ᱵᱟᱞᱮ ᱢᱟᱦᱟ",
        "Wednesday": "ᱥᱟᱹᱜᱩᱱ ᱢᱟᱦᱟ",
        "Thursday": "ᱥᱟᱹᱨᱫᱤ ᱢᱟᱦᱟ",
        "Friday": "ᱡᱟᱹᱨᱩᱢ ᱢᱟᱦᱟ",
        "Saturday": "ᱧᱩᱦᱩᱢ ᱢᱟᱦᱟ",
        "Sunday": "ᱥᱤᱸᱜᱮ ᱢᱟᱦᱟ",
        "Black Soil": "ᱦᱮᱸᱫᱮ ᱦᱟᱥᱟ",
        "Red Soil": "ᱟᱨᱟᱜ ᱦᱟᱥᱟ",
        "Alluvial Soil": "ᱯᱚᱴᱟ linen ᱦᱟᱥᱟ",
        "Clayey Soil": "ᱪᱤᱴᱠᱤ ᱦᱟᱥᱟ",
        "Clay Soil": "ᱪᱤᱴᱠᱤ ᱦᱟᱥᱟ",
        "Sandy Soil": "ᱜᱤᱛᱤᱞ ᱦᱟᱥᱟ",
        "Silt Soil": "ᱞᱟ abstract ᱦᱟᱥᱟ",
        "Loamy Soil": "ᱫᱩ-ᱦᱟᱥᱟ",
        "Rice": "ᱦᱩᱲᱩ",
        "Wheat": "ᱜᱩᱦᱩᱢ",
        "Maize": "ᱡᱚ plan",
        "Cotton": "ᱠᱟᱥᱠᱳᱢ",
        "Fertile": "ᱥᱚᱛᱮᱭᱟᱡᱽ",
        "Infertile": "ᱵᱟᱝ ᱥᱚᱛᱮᱭᱟᱡᱽ",
        "Moderately Fertile": "ᱛᱟᱞᱟ ᱥᱚᱛᱮᱭᱟᱡᱽ",
        "Good": "ᱵᱷᱟᱹᱜᱤ",
        "Moderate": "ᱛᱟᱞᱟ",
        "Poor": "ᱵᱟᱹᱲᱤᱡ",
        "Optimal": "ᱥᱚᱨᱮᱥ",
        "Nitrogen": "ᱱᱟᱭᱴᱨᱳᱡᱮᱱ",
        "Phosphorus": "ᱯᱷᱳᱥᱯᱷᱳᱨᱚᱥ",
        "Potassium": "ᱯᱳᱴᱟᱥᱤᱭᱚᱢ",
        "Nitrogen deficiency detected": "ᱱᱟᱭᱴᱨᱳᱡᱮᱱ ᱠᱚᱢ ᱧᱟᱢ ᱮᱱᱟ",
        "Apply nitrogen-rich fertilizer": "ᱱᱟᱭᱴᱨᱳᱡᱮᱱ ᱨᱟᱱ ᱞᱟᱜᱟᱣ ᱢᱮ",
        "Soil health is moderate": "ᱦᱟᱥᱟ ᱦᱟᱞᱚᱛ ᱛᱟᱞᱟ ᱜᱮᱭᱟ",
        "Soil health is good": "ᱦᱟᱥᱟ ᱦᱟᱞᱚᱛ ᱵᱷᱟᱹᱜᱤ ᱜᱮᱭᱟ",
        "Urea (46% N)": "ᱭᱩᱨᱤᱭᱟ (᱔᱖% N)",
        "DAP (Di-Ammonium Phosphate)": "ᱰᱤ.ᱮ.ᱯᱤ (DAP)",
        "Muriate of Potash (MOP)": "ᱮᱢ.ᱳ.ᱯᱤ (MOP)",
    },
    "hi-IN": {
        "Hyderabad": "हैदराबाद",
        "Delhi": "दिल्ली",
        "Chennai": "चेन्नई",
        "Mumbai": "मुंबई",
        "Bangalore": "बेंगलुरु",
        "Clear Sky": "साफ़ आसमान",
        "Partly Cloudy": "आंशिक रूप से बादल छाए हुए हैं",
        "Scattered Clouds": "छिटपुट बादल",
        "Overcast Clouds": "घने बादल",
        "Broken Clouds": "टूटे हुए बादल",
        "Light Rain": "हल्की बारिश",
        "Moderate Rain": "मध्यम बारिश",
        "Heavy Rain": "भारी बारिश",
        "Sunny": "धूप",
        "Rainy": "बरसात",
        "Cloudy": "बादल छाए हुए हैं",
        "Monday": "सोमवार",
        "Tuesday": "मंगलवार",
        "Wednesday": "बुधवार",
        "Thursday": "गुरुवार",
        "Friday": "शुक्रवार",
        "Saturday": "शनिवार",
        "Sunday": "रविवार",
        "Black Soil": "काली मिट्टी",
        "Red Soil": "लाल मिट्टी",
        "Alluvial Soil": "जलोढ़ मिट्टी",
        "Clayey Soil": "चिकनी मिट्टी",
        "Sandy Soil": "रेतीली मिट्टी",
        "Rice": "चावल",
        "Wheat": "गेहूँ",
        "Maize": "मक्का",
        "Cotton": "कपास",
        "Nitrogen deficiency detected": "नाइट्रोजन की कमी पाई गई",
        "Apply nitrogen-rich fertilizer": "नाइट्रोजन समृद्ध उर्वरक का प्रयोग करें",
        "Soil health is moderate": "मृदा स्वास्थ्य मध्यम है",
        "Soil health is good": "मृदा स्वास्थ्य अच्छा है",
    },
    "te-IN": {
        "Hyderabad": "హైదరాబాద్",
        "Delhi": "ఢిల్లీ",
        "Chennai": "చెన్నై",
        "Mumbai": "ముంబై",
        "Bangalore": "బెంగళూరు",
        "Clear Sky": "నిర్మలమైన ఆకాశం",
        "Partly Cloudy": "పాక్షికంగా మేఘావృతమై ఉంది",
        "Scattered Clouds": "చెదిరిన మేఘాలు",
        "Overcast Clouds": "విస్తారమైన మేఘాలు",
        "Broken Clouds": "విరిగిపోయిన మేఘాలు",
        "Light Rain": "తేలికపాటి వర్షం",
        "Moderate Rain": "మితమైన వర్షం",
        "Heavy Rain": "భారీ వర్షం",
        "Sunny": "ఎండగా ఉంది",
        "Rainy": "వర్షపాతం",
        "Cloudy": "మేఘావృతమై ఉంది",
        "Monday": "సోమవారం",
        "Tuesday": "మంగళవారం",
        "Wednesday": "బుధవారం",
        "Thursday": "గురువారం",
        "Friday": "శుక్రవారం",
        "Saturday": "శనివారం",
        "Sunday": "ఆదివారం",
        "Black Soil": "నల్ల నేల",
        "Red Soil": "ఎర్ర నేల",
        "Alluvial Soil": "ఒండ్రు నేల",
        "Clayey Soil": "జిగురు నేల",
        "Sandy Soil": "ఇసుక నేల",
        "Rice": "వరి",
        "Wheat": "గోధుమ",
        "Maize": "మొక్కజొన్న",
        "Cotton": "పత్తి",
        "Nitrogen deficiency detected": "నత్రజని లోపం కనుగొనబడింది",
        "Apply nitrogen-rich fertilizer": "నత్రజని సమృద్ధిగా ఉన్న ఎరువును వాడండి",
        "Soil health is moderate": "నేల ఆరోగ్యం సాధారణంగా ఉంది",
        "Soil health is good": "నేల ఆరోగ్యం బాగుంది",
    },
    "ta-IN": {
        "Hyderabad": "ஹைதராபாத்",
        "Delhi": "டெல்லி",
        "Chennai": "சென்னை",
        "Mumbai": "மும்பை",
        "Bangalore": "பெங்களூரு",
        "Clear Sky": "தெளிவான வானம்",
        "Partly Cloudy": "பகுதியளவு மேகமூட்டம்",
        "Scattered Clouds": "சிதறிய மேகங்கள்",
        "Overcast Clouds": "அடர்ந்த மேகமூட்டம்",
        "Broken Clouds": "உடைந்த மேகங்கள்",
        "Light Rain": "லேசான மழை",
        "Moderate Rain": "மிதமான மழை",
        "Heavy Rain": "கனமழை",
        "Sunny": "வெயில்",
        "Rainy": "மழை",
        "Cloudy": "மேகமூட்டம்",
        "Monday": "திங்கட்கிழமை",
        "Tuesday": "செவ்வாய்க்கிழமை",
        "Wednesday": "புதன்கிழமை",
        "Thursday": "வியாழக்கிழமை",
        "Friday": "வெள்ளிக்கிழமை",
        "Saturday": "சனிக்கிழமை",
        "Sunday": "ஞாயிற்றுக்கிழமை",
        "Black Soil": "கரிசல் மண்",
        "Red Soil": "செம்மண்",
        "Alluvial Soil": "வண்டல் மண்",
        "Clayey Soil": "களிமண்",
        "Sandy Soil": "மணல் மண்",
        "Rice": "அரிசி",
        "Wheat": "கோதுமை",
        "Maize": "சோளம்",
        "Cotton": "பருத்தி",
    }
}


def translate_text_by_code(text: str, target_lang_code: str) -> str:
    """Translate text to target language by ISO/Sarvam language code (e.g., 'hi', 'hi-IN', 'te', 'ta')."""
    if not isinstance(text, str) or not text.strip():
        return text

    clean_text = text.strip()
    code = target_lang_code.split("-")[0].lower() if target_lang_code else "en"
    if code == "en":
        return clean_text

    sarvam_lang_code = f"{code}-IN"
    cache_key = (clean_text, sarvam_lang_code)

    # Return cached translation if available
    if cache_key in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[cache_key]

    # 1. Sarvam API call if API key available
    api_key = settings.SARVAM_API_KEY.strip()
    if api_key:
        try:
            payload = json.dumps({
                "input": clean_text,
                "source_language_code": "en-IN",
                "target_language_code": sarvam_lang_code,
            }).encode("utf-8")
            
            base_url = settings.SARVAM_API_URL.strip() if settings.SARVAM_API_URL else "https://api.sarvam.ai"
            url = base_url if base_url.endswith("/translate") else f"{base_url.rstrip('/')}/translate"
            
            request = Request(
                url,
                data=payload,
                headers={
                    "api-subscription-key": api_key,
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urlopen(request, timeout=5) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                translated = res_data.get("translated_text")
                if isinstance(translated, str) and translated.strip():
                    result = translated.strip()
                    _TRANSLATION_CACHE[cache_key] = result
                    return result
        except Exception as exc:
            _LOGGER.debug("Sarvam API translation error: %s. Using fallback.", exc)

    # 2. Dictionary fallback
    lang_dict = _TRANSLATION_MAP.get(sarvam_lang_code, {})
    if clean_text in lang_dict:
        result = lang_dict[clean_text]
        _TRANSLATION_CACHE[cache_key] = result
        return result

    return clean_text


def translate_text(text: str, language_id: Optional[int]) -> str:
    """Translate text to the target language by language_id."""
    if language_id is None or language_id == 1:
        return text
    target_lang_code = _LANGUAGE_CODES.get(language_id, "en-IN")
    return translate_text_by_code(text, target_lang_code)


def transliterate_text(text: str, target_lang_code: str) -> str:
    """Transliterate personal names, places, and user content into target script."""
    if not isinstance(text, str) or not text.strip():
        return text

    clean_text = text.strip()
    code = target_lang_code.split("-")[0].lower() if target_lang_code else "en"
    if code == "en":
        return clean_text

    sarvam_lang_code = f"{code}-IN"
    api_key = settings.SARVAM_API_KEY.strip()
    if api_key:
        try:
            payload = json.dumps({
                "input": clean_text,
                "source_language_code": "en-IN",
                "target_language_code": sarvam_lang_code,
            }).encode("utf-8")
            url = "https://api.sarvam.ai/transliterate"
            request = Request(
                url,
                data=payload,
                headers={
                    "api-subscription-key": api_key,
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urlopen(request, timeout=5) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                transliterated = res_data.get("transliterated_text")
                if isinstance(transliterated, str) and transliterated.strip():
                    return transliterated.strip()
        except Exception as exc:
            _LOGGER.debug("Sarvam Transliteration API error: %s.", exc)

    return translate_text_by_code(clean_text, target_lang_code)


def bulk_translate_texts(texts: list[str], target_lang_code: str) -> dict[str, str]:
    """Translate multiple texts to target language code."""
    results = {}
    for text in texts:
        results[text] = translate_text_by_code(text, target_lang_code)
    return results


def text_to_speech(text: str, target_lang_code: str) -> dict:
    """Generate audio for translated text using Sarvam AI Text-to-Speech API."""
    clean_text = text.strip()
    code = target_lang_code.split("-")[0].lower() if target_lang_code else "hi"
    sarvam_lang_code = f"{code}-IN"

    api_key = settings.SARVAM_API_KEY.strip()
    if api_key:
        try:
            payload = json.dumps({
                "inputs": [clean_text],
                "text": clean_text,
                "target_language_code": sarvam_lang_code,
                "language_code": sarvam_lang_code,
                "speaker": "meera",
            }).encode("utf-8")
            url = "https://api.sarvam.ai/text-to-speech"
            request = Request(
                url,
                data=payload,
                headers={
                    "api-subscription-key": api_key,
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urlopen(request, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                audios = res_data.get("audios", [])
                audio_str = audios[0] if audios else res_data.get("audio")
                if audio_str:
                    return {"audio_base64": audio_str, "status": "success"}
        except Exception as exc:
            _LOGGER.debug("Sarvam TTS API error: %s", exc)

    return {"audio_base64": None, "status": "simulated_tts", "text": clean_text}
