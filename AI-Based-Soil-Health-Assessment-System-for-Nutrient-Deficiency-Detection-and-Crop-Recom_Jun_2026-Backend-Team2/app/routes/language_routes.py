from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import Language, User, TranslationKey, Translation, Multilingual
from app.schemas import (
    LanguageResponse,
    TranslationKeyCreate,
    TranslationKeyUpdate,
    TranslationKeyResponse,
    TranslateRequest,
    TranslateResponse,
    TransliterateRequest,
    TransliterateResponse,
    BulkTranslateRequest,
    BulkTranslateResponse,
    TranslationItemRequest,
    GenerateMissingTranslationsRequest,
)
from app.services.translation_service import get_translations
from app.services.sarvam_service import (
    translate_text_by_code,
    transliterate_text,
    bulk_translate_texts,
    text_to_speech,
)

router = APIRouter(
    prefix="/api",
    tags=["Languages & Translations"],
)


@router.get("/languages/", response_model=list[LanguageResponse])
@router.get("/languages", response_model=list[LanguageResponse])
def get_languages(db: Session = Depends(get_db)):
    """List all active languages."""
    return db.query(Language).filter(Language.is_active == True).order_by(Language.id).all()


@router.get("/translations/", status_code=status.HTTP_200_OK)
@router.get("/translations", status_code=status.HTTP_200_OK)
def fetch_all_translations(lang: str = Query("en"), db: Session = Depends(get_db)):
    """Get translation dictionary for given language code (Query param)."""
    return get_translations(db, lang)


@router.get("/translations/{language_code}", status_code=status.HTTP_200_OK)
@router.get("/language/{language_code}/dictionary/", status_code=status.HTTP_200_OK)
@router.get("/language/{language_code}/dictionary", status_code=status.HTTP_200_OK)
def fetch_language_dictionary(language_code: str, db: Session = Depends(get_db)):
    """Get translation dictionary for given language code path parameter."""
    return get_translations(db, language_code)


@router.post("/translations/", status_code=status.HTTP_201_CREATED)
def create_translation_value(req: TranslationItemRequest, db: Session = Depends(get_db)):
    """Create or update a translation value for a key and language."""
    t_key = db.query(TranslationKey).filter(TranslationKey.key == req.key).first()
    if not t_key:
        t_key = TranslationKey(key=req.key, english=req.translated_text if req.language_code == "en" else req.key)
        db.add(t_key)
        db.commit()
        db.refresh(t_key)

    lang = db.query(Language).filter(Language.language_code == req.language_code).first()
    if not lang:
        lang = Language(language_code=req.language_code, language_name=req.language_code.upper(), is_active=True)
        db.add(lang)
        db.commit()
        db.refresh(lang)

    trans = db.query(Translation).filter(
        Translation.translation_key_id == t_key.id,
        Translation.language_id == lang.id
    ).first()

    if trans:
        trans.translated_text = req.translated_text
    else:
        trans = Translation(translation_key_id=t_key.id, language_id=lang.id, translated_text=req.translated_text)
        db.add(trans)

    db.commit()
    return {"message": "Translation saved successfully", "key": req.key, "language_code": req.language_code}


@router.put("/translations/", status_code=status.HTTP_200_OK)
def update_translation_value(req: TranslationItemRequest, db: Session = Depends(get_db)):
    """Update an existing translation value."""
    return create_translation_value(req, db)


@router.delete("/translations/", status_code=status.HTTP_200_OK)
def delete_translation_value(key: str, language_code: str, db: Session = Depends(get_db)):
    """Delete a translation value by key and language code."""
    t_key = db.query(TranslationKey).filter(TranslationKey.key == key).first()
    lang = db.query(Language).filter(Language.language_code == language_code).first()
    if not t_key or not lang:
        raise HTTPException(status_code=404, detail="Translation key or language not found")

    trans = db.query(Translation).filter(
        Translation.translation_key_id == t_key.id,
        Translation.language_id == lang.id
    ).first()
    if trans:
        db.delete(trans)
        db.commit()
    return {"message": "Translation deleted successfully"}


@router.post("/translate/", response_model=TranslateResponse)
@router.post("/translate", response_model=TranslateResponse)
def translate_single_text(req: TranslateRequest):
    """Dynamic single text translation using Sarvam AI."""
    translated = translate_text_by_code(req.text, req.target_language)
    return TranslateResponse(
        original_text=req.text,
        translated_text=translated,
        target_language=req.target_language
    )


@router.post("/transliterate/", response_model=TransliterateResponse)
@router.post("/transliterate", response_model=TransliterateResponse)
def transliterate_user_detail(req: TransliterateRequest):
    """Dynamic transliteration for user personal details (Person Name, Village, District, etc.)."""
    transliterated = transliterate_text(req.text, req.target_language)
    return TransliterateResponse(
        original_text=req.text,
        transliterated_text=transliterated,
        target_language=req.target_language
    )


@router.post("/bulk-translate/", response_model=BulkTranslateResponse)
@router.post("/bulk-translate", response_model=BulkTranslateResponse)
def bulk_translate(req: BulkTranslateRequest):
    """Bulk text translation using Sarvam AI."""
    translations = bulk_translate_texts(req.texts, req.target_language)
    return BulkTranslateResponse(
        translations=translations,
        target_language=req.target_language
    )


@router.post("/generate-missing-translations/", status_code=status.HTTP_200_OK)
@router.post("/generate-missing-translations", status_code=status.HTTP_200_OK)
def generate_missing_translations(req: GenerateMissingTranslationsRequest, db: Session = Depends(get_db)):
    """Automatically populate missing translations across active languages using Sarvam AI."""
    active_langs = db.query(Language).filter(Language.is_active == True).all()
    if req.language_codes:
        active_langs = [l for l in active_langs if l.language_code in req.language_codes]

    keys = db.query(TranslationKey).all()
    created_count = 0

    for l in active_langs:
        if l.language_code == "en":
            continue
        for k in keys:
            existing = db.query(Translation).filter(
                Translation.translation_key_id == k.id,
                Translation.language_id == l.id
            ).first()
            if not existing:
                trans_text = translate_text_by_code(k.english or k.key, l.language_code)
                new_trans = Translation(translation_key_id=k.id, language_id=l.id, translated_text=trans_text)
                db.add(new_trans)
                created_count += 1

    db.commit()
    return {"message": f"Successfully generated {created_count} missing translations using Sarvam AI."}


@router.post("/tts/", status_code=status.HTTP_200_OK)
@router.post("/tts", status_code=status.HTTP_200_OK)
def get_voice_output(text: str = Query(...), language_code: str = Query("hi")):
    """Generate Sarvam AI Text-to-Speech audio for translated text."""
    return text_to_speech(text, language_code)


@router.get("/multilingual", status_code=status.HTTP_200_OK)
def get_multilingual_table(db: Session = Depends(get_db)):
    """Returns all entries from the Multilingual database table across all Indian languages."""
    entries = db.query(Multilingual).all()
    return [
        {
            "id": e.id,
            "key": e.key,
            "english": e.english,
            "hindi": e.hindi,
            "telugu": e.telugu,
            "tamil": e.tamil,
            "kannada": e.kannada,
            "malayalam": e.malayalam,
            "marathi": e.marathi,
            "gujarati": e.gujarati,
            "bengali": e.bengali,
            "punjabi": e.punjabi,
            "odia": e.odia,
            "assamese": e.assamese,
            "urdu": e.urdu,
            "maithili": e.maithili,
            "manipuri": e.manipuri,
            "santali": e.santali,
            "bodo": e.bodo,
            "dogri": e.dogri,
            "kashmiri": e.kashmiri,
            "konkani": e.konkani,
            "nepali": e.nepali,
            "sanskrit": e.sanskrit,
            "sindhi": e.sindhi,
        }
        for e in entries
    ]


@router.get("/generate-pdf-report/", status_code=status.HTTP_200_OK)
@router.get("/generate-pdf-report", status_code=status.HTTP_200_OK)
def download_multilingual_pdf(
    language_code: str = Query("en", description="Target language code for PDF"),
    farmer_name: str = Query("Rahul Ramayanam"),
    soil_type: str = Query("Clay Soil"),
):
    """Generate and return a complete PDF report translated into the selected language."""
    from fastapi.responses import Response
    from app.services.pdf_multilingual_service import generate_multilingual_pdf

    data = {
        "farmer_name": farmer_name,
        "location": "Punjab, India",
        "date": "2026-08-03",
        "soil_type": soil_type,
        "soil_health": "Optimal",
        "health_score": 92.4,
        "n": 78,
        "p": 46,
        "k": 32,
        "recommended_crops": ["Wheat", "Rice", "Maize"],
    }
    pdf_bytes = generate_multilingual_pdf(data, language_code)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Soil_Report_{language_code}.pdf"}
    )