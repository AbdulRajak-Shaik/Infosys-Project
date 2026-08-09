from sqlalchemy.orm import Session
from app.models import Language, Translation, TranslationKey, Multilingual


def get_translations(db: Session, language_code: str) -> dict:
    response = {}

    # 1. Query Translation table by language_code
    language = (
        db.query(Language)
        .filter(
            Language.language_code == language_code,
            Language.is_active == True,
        )
        .first()
    )

    if language:
        translations = (
            db.query(Translation)
            .join(TranslationKey)
            .filter(Translation.language_id == language.id)
            .all()
        )
        for item in translations:
            if item.translation_key:
                response[item.translation_key.key] = item.translated_text

    # 2. Query Multilingual table by column name
    column_name_map = {
        'en': 'english',
        'hi': 'hindi',
        'te': 'telugu',
        'ta': 'tamil',
        'kn': 'kannada',
        'ml': 'malayalam',
        'mr': 'marathi',
        'gu': 'gujarati',
        'bn': 'bengali',
        'pa': 'punjabi',
        'or': 'odia',
        'as': 'assamese',
        'ur': 'urdu',
        'mai': 'maithili',
        'mni': 'manipuri',
        'sat': 'santali',
        'brx': 'bodo',
        'doi': 'dogri',
        'ks': 'kashmiri',
        'kok': 'konkani',
        'ne': 'nepali',
        'sa': 'sanskrit',
        'sd': 'sindhi',
    }
    col = column_name_map.get(language_code)
    if col and hasattr(Multilingual, col):
        multi_entries = db.query(Multilingual).all()
        for entry in multi_entries:
            val = getattr(entry, col, None)
            if val:
                response[entry.key] = val

    return response