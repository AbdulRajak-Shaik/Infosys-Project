print("language_routes.py loaded")

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import Language, User
from app.schemas import (
    LanguageResponse,
    TranslationKeyCreate,
    TranslationKeyUpdate,
    TranslationKeyResponse,
)
from app.services.translation_service import get_translations as get_translations_service
from app.services.translation_admin_service import (
    create_translation_key,
    update_translation_key,
    delete_translation_key,
)

router = APIRouter(
    prefix="/api",
    tags=["Languages"],
)


@router.get("/test123")
def test123():
    return {"message": "working"}


@router.get(
    "/languages",
    response_model=list[LanguageResponse],
    status_code=status.HTTP_200_OK,
)
def get_languages(db: Session = Depends(get_db)):
    return (
        db.query(Language)
        .filter(Language.is_active == True)
        .order_by(Language.id)
        .all()
    )


@router.get(
    "/translations",
    status_code=status.HTTP_200_OK,
)
def fetch_translations(
    lang: str = Query(...),
    db: Session = Depends(get_db),
):
    return get_translations_service(db, lang)


@router.post(
    "/admin/translation-key",
    response_model=TranslationKeyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_translation(
    data: TranslationKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create translation keys.",
        )

    return create_translation_key(db, data)
@router.put(
    "/admin/translation-key/{translation_key_id}",
    status_code=status.HTTP_200_OK,
)
def update_translation(
    translation_key_id: int,
    data: TranslationKeyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update translation keys.",
        )

    return update_translation_key(
        db,
        translation_key_id,
        data,
    )


@router.delete(
    "/admin/translation-key/{translation_key_id}",
    status_code=status.HTTP_200_OK,
)
def delete_translation(
    translation_key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete translation keys.",
        )

    return delete_translation_key(
        db,
        translation_key_id,
    )


@router.get(
    "/translations",
    status_code=status.HTTP_200_OK,
    summary="Get Multilingual UI Text Translations",
    description="Returns static UI text translations (Dashboard, Weather, Soil Analysis, Profile, Login/Logout, Buttons, Labels) for frontend UI rendering."
)
def get_translations(
    db: Session = Depends(get_db)
):
    """Returns static UI text translations for all frontend navigation items, buttons, and labels."""
    from app.models import Multilingual
    entries = db.query(Multilingual).all()
    return [
        {
            "key": e.key,
            "english": e.english,
            "hindi": e.hindi,
            "telugu": e.telugu,
            "tamil": e.tamil,
        }
        for e in entries
    ]