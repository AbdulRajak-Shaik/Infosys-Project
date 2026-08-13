from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Language, Translation, TranslationKey
from app.schemas import (
    TranslationKeyCreate,
    TranslationKeyUpdate,
)
from app.services.sarvam_service import translate_text


def create_translation_key(
    db: Session,
    data: TranslationKeyCreate,
):
    """
    Create a translation key and generate translations
    for all active languages.
    """

    # Create translation key
    translation_key = TranslationKey(
        key=data.key,
        english=data.english,
        category=data.category,
        description=data.description,
    )

    db.add(translation_key)
    db.flush()  # Get translation_key.id before commit

    # Get all active languages
    languages = (
        db.query(Language)
        .filter(Language.is_active == True)
        .all()
    )

    # Generate translations
    for language in languages:

        translated_text = translate_text(
            data.english,
            language.id,
        )

        translation = Translation(
            translation_key_id=translation_key.id,
            language_id=language.id,
            translated_text=translated_text,
        )

        db.add(translation)

    db.commit()
    db.refresh(translation_key)

    return translation_key


def update_translation_key(
    db: Session,
    translation_key_id: int,
    data: TranslationKeyUpdate,
):
    """
    Update an existing translation key.
    """

    translation_key = (
        db.query(TranslationKey)
        .filter(TranslationKey.id == translation_key_id)
        .first()
    )

    if not translation_key:
        raise HTTPException(
            status_code=404,
            detail="Translation key not found",
        )

    if data.key is not None:
        translation_key.key = data.key

    if data.english is not None:
        translation_key.english = data.english

    if data.category is not None:
        translation_key.category = data.category

    if data.description is not None:
        translation_key.description = data.description

    db.commit()
    db.refresh(translation_key)

    return {
        "success": True,
        "message": "Translation key updated successfully",
    }


def delete_translation_key(
    db: Session,
    translation_key_id: int,
):
    """
    Delete a translation key and its translations.
    """

    translation_key = (
        db.query(TranslationKey)
        .filter(TranslationKey.id == translation_key_id)
        .first()
    )

    if not translation_key:
        raise HTTPException(
            status_code=404,
            detail="Translation key not found",
        )

    db.query(Translation).filter(
        Translation.translation_key_id == translation_key_id
    ).delete()

    db.delete(translation_key)
    db.commit()

    return {
        "success": True,
        "message": "Translation key deleted successfully",
    }