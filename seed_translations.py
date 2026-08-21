"""
seed_translations.py
--------------------
Seeds initial TranslationKey and Translation records into the database.

Mirrors the pattern used in app/seed_users.py — reuses the project's
existing SessionLocal, Language, TranslationKey, and Translation models.

Run standalone:
    python seed_translations.py

Or call seed_translations() from application startup if needed.

Safe to run multiple times — skips keys/translations that already exist.
"""

import sys
import os

# Ensure project root is on path when run as a standalone script
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Language, TranslationKey, Translation


# ---------------------------------------------------------------------------
# Core translation data
# Key structure: { key: { "english": "...", "hi": "...", "te": "..." } }
# Add more languages or keys here as the project grows.
# ---------------------------------------------------------------------------
TRANSLATION_DATA = [
    {
        "key": "dashboard",
        "english": "Dashboard",
        "category": "navigation",
        "translations": {
            "hi": "डैशबोर्ड",
            "te": "డాష్‌బోర్డ్",
        },
    },
    {
        "key": "soilAnalysis",
        "english": "Soil Analysis",
        "category": "features",
        "translations": {
            "hi": "मिट्टी विश्लेषण",
            "te": "నేల విశ్లేషణ",
        },
    },
    {
        "key": "cropRecommendation",
        "english": "Crop Recommendation",
        "category": "features",
        "translations": {
            "hi": "फसल अनुशंसा",
            "te": "పంట సిఫారసు",
        },
    },
    {
        "key": "nutrientDeficiency",
        "english": "Nutrient Deficiency",
        "category": "features",
        "translations": {
            "hi": "पोषक तत्व की कमी",
            "te": "పోషక లోపం",
        },
    },
    {
        "key": "soilHealthScore",
        "english": "Soil Health Score",
        "category": "features",
        "translations": {
            "hi": "मिट्टी स्वास्थ्य स्कोर",
            "te": "నేల ఆరోగ్య స్కోర్",
        },
    },
    {
        "key": "fertilizerRecommendation",
        "english": "Fertilizer Recommendation",
        "category": "features",
        "translations": {
            "hi": "उर्वरक अनुशंसा",
            "te": "ఎరువు సిఫారసు",
        },
    },
    {
        "key": "weatherForecast",
        "english": "Weather Forecast",
        "category": "features",
        "translations": {
            "hi": "मौसम पूर्वानुमान",
            "te": "వాతావరణ అంచనా",
        },
    },
    {
        "key": "aiChatbot",
        "english": "AI Chatbot",
        "category": "features",
        "translations": {
            "hi": "एआई चैटबॉट",
            "te": "AI చాట్‌బాట్",
        },
    },
    {
        "key": "login",
        "english": "Login",
        "category": "auth",
        "translations": {
            "hi": "लॉगिन",
            "te": "లాగిన్",
        },
    },
    {
        "key": "logout",
        "english": "Logout",
        "category": "auth",
        "translations": {
            "hi": "लॉगआउट",
            "te": "లాగ్అవుట్",
        },
    },
    {
        "key": "register",
        "english": "Register",
        "category": "auth",
        "translations": {
            "hi": "पंजीकरण करें",
            "te": "నమోదు చేయండి",
        },
    },
    {
        "key": "profile",
        "english": "Profile",
        "category": "navigation",
        "translations": {
            "hi": "प्रोफ़ाइल",
            "te": "ప్రొఫైల్",
        },
    },
    {
        "key": "settings",
        "english": "Settings",
        "category": "navigation",
        "translations": {
            "hi": "सेटिंग्स",
            "te": "సెట్టింగులు",
        },
    },
    {
        "key": "history",
        "english": "History",
        "category": "navigation",
        "translations": {
            "hi": "इतिहास",
            "te": "చరిత్ర",
        },
    },
    {
        "key": "submit",
        "english": "Submit",
        "category": "ui",
        "translations": {
            "hi": "जमा करें",
            "te": "సమర్పించండి",
        },
    },
    {
        "key": "cancel",
        "english": "Cancel",
        "category": "ui",
        "translations": {
            "hi": "रद्द करें",
            "te": "రద్దు చేయండి",
        },
    },
    {
        "key": "save",
        "english": "Save",
        "category": "ui",
        "translations": {
            "hi": "सहेजें",
            "te": "సేవ్ చేయండి",
        },
    },
    {
        "key": "loading",
        "english": "Loading...",
        "category": "ui",
        "translations": {
            "hi": "लोड हो रहा है...",
            "te": "లోడ్ అవుతోంది...",
        },
    },
    {
        "key": "error",
        "english": "An error occurred. Please try again.",
        "category": "ui",
        "translations": {
            "hi": "एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
            "te": "లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
        },
    },
    {
        "key": "noDataAvailable",
        "english": "No data available",
        "category": "ui",
        "translations": {
            "hi": "कोई डेटा उपलब्ध नहीं",
            "te": "డేటా అందుబాటులో లేదు",
        },
    },
]

# Map language codes to Language.language_name — must match what seed_users.py seeds
LANGUAGE_MAP = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
}


def seed_translations():
    db = SessionLocal()
    try:
        # Ensure required languages exist (English is seeded by seed_users; Hindi/Telugu may not be)
        lang_objects: dict[str, Language] = {}
        for code, name in LANGUAGE_MAP.items():
            lang = db.query(Language).filter(Language.language_code == code).first()
            if not lang:
                lang = Language(
                    language_name=name,
                    language_code=code,
                    is_default=(code == "en"),
                    is_active=True,
                )
                db.add(lang)
                db.commit()
                db.refresh(lang)
                print(f"[seed_translations] Language seeded: {name} ({code})")
            lang_objects[code] = lang

        # Seed each translation key and its translations
        inserted_keys = 0
        inserted_translations = 0

        for entry in TRANSLATION_DATA:
            key_str = entry["key"]
            english_text = entry["english"]
            category = entry.get("category")

            # Upsert the TranslationKey (skip if already exists)
            tk = db.query(TranslationKey).filter(TranslationKey.key == key_str).first()
            if not tk:
                tk = TranslationKey(
                    key=key_str,
                    english=english_text,
                    category=category,
                )
                db.add(tk)
                db.commit()
                db.refresh(tk)
                inserted_keys += 1

            # Seed translations for each language
            for lang_code, translated_text in entry.get("translations", {}).items():
                lang_obj = lang_objects.get(lang_code)
                if not lang_obj:
                    continue

                existing = (
                    db.query(Translation)
                    .filter(
                        Translation.translation_key_id == tk.id,
                        Translation.language_id == lang_obj.id,
                    )
                    .first()
                )
                if not existing:
                    t = Translation(
                        translation_key_id=tk.id,
                        language_id=lang_obj.id,
                        translated_text=translated_text,
                    )
                    db.add(t)
                    inserted_translations += 1

        db.commit()
        print(
            f"[seed_translations] Done — {inserted_keys} new keys, "
            f"{inserted_translations} new translations seeded."
        )

    except Exception as exc:
        db.rollback()
        print(f"[seed_translations] Error: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_translations()
