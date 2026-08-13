"""Server-side proxy for Sarvam translation API to avoid exposing API keys.

Endpoint: POST /api/translate
Payload: {"text": string, "source": "en", "target": "hi"}
Response: {"translations": ["...translated text..."]}
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import requests

from app.dependencies import get_db, get_current_user
from app.config import settings
from app.models import User, UserRole

router = APIRouter(prefix="/api", tags=["Translation"])


class TranslateRequest(BaseModel):
    text: str | None = None
    texts: list[str] | None = None
    source: str | None = None
    target: str


class TranslateResponse(BaseModel):
    translations: list[str]


def translate_single_text(text: str, source_code: str, target_code: str) -> str:
    """Helper function to translate a single string via Sarvam API or fallbacks."""
    if not text.strip() or target_code == "en-IN":
        return text

    # 1. Try Sarvam API first if configured
    if settings.SARVAM_API_KEY:
        try:
            payload = {
                "input": text.strip(),
                "source_language_code": source_code,
                "target_language_code": target_code,
            }
            headers = {
                "api-subscription-key": settings.SARVAM_API_KEY.strip(),
                "Content-Type": "application/json",
            }
            url = settings.SARVAM_API_URL if settings.SARVAM_API_URL else "https://api.sarvam.ai/translate"
            resp = requests.post(url, json=payload, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                translated = data.get("translated_text")
                if isinstance(translated, str) and translated.strip():
                    return translated.strip()
        except Exception:
            pass

    # 2. Fallback to dictionary
    try:
        from app.services.sarvam_service import _TRANSLATION_MAP
        lang_dict = _TRANSLATION_MAP.get(target_code, {})
        if text.strip() in lang_dict:
            return lang_dict[text.strip()]
    except Exception:
        pass

    return text


@router.post("/translate", response_model=TranslateResponse)
def translate_proxy(req: TranslateRequest, current_user: User = Depends(get_current_user)):
    """Proxy endpoint that calls Sarvam AI Translate API using server-side key.

    Supports batch translation (texts) in parallel using ThreadPoolExecutor.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    lang_map = {
        "en": "en-IN",
        "hi": "hi-IN",
        "te": "te-IN",
        "ta": "ta-IN",
        "kn": "kn-IN",
        "mr": "mr-IN",
        "bn": "bn-IN",
        "ml": "ml-IN",
        "gu": "gu-IN",
        "pa": "pa-IN",
        "or": "or-IN",
        "as": "as-IN",
        "ur": "ur-IN",
        "mai": "mai-IN",
        "mni": "mni-IN",
        "brx": "brx-IN",
        "doi": "doi-IN",
        "ks": "ks-IN",
        "kok": "kok-IN",
        "ne": "ne-IN",
        "sa": "sa-IN",
        "sd": "sd-IN",
    }

    target_code = lang_map.get(req.target, req.target)
    source_code = lang_map.get(req.source or "en", "en-IN")

    # Gather texts to translate
    texts_to_translate = []
    if req.texts is not None:
        texts_to_translate = req.texts
    elif req.text is not None:
        texts_to_translate = [req.text]

    if not texts_to_translate:
        return TranslateResponse(translations=[])

    # Translate in parallel
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(translate_single_text, text, source_code, target_code)
            for text in texts_to_translate
        ]
        translations = [f.result() for f in futures]

    return TranslateResponse(translations=translations)
