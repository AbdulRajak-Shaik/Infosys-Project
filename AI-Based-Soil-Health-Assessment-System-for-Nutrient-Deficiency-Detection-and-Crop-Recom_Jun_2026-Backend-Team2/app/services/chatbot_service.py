"""Business logic for authenticated multilingual chatbot conversations."""

import json
from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import ChatHistory, PredictionHistory, User
from app.schemas import ChatRequest
from app.services.agriculture_validator import is_agriculture_question
from app.services.gemini_service import gemini_service
from app.services.language_service import (
    LANGUAGE_RESPONSE_KEYS,
    detect_question_language,
    get_preferred_language,
)
from app.services.prompt_builder import (
    build_disease_explanation_prompt,
    build_follow_up_prompt,
    build_general_farming_prompt,
    build_prediction_explanation_prompt,
    build_translation_prompt,
)


NON_AGRICULTURE_RESPONSES = {
    "English": "i am chatbot of agriculture ask me questions or topics related to agriculture or farming.",
    "Telugu": "నేను వ్యవసాయ చాట్‌బాట్‌ను, వ్యవసాయం లేదా వ్యవసాయానికి సంబంధించిన ప్రశ్నలు లేదా అంశాలను నన్ను అడగండి.",
    "Hindi": "मैं कृषि का चैटबॉट हूँ, मुझसे कृषि या खेती से संबंधित प्रश्न या विषय पूछें।",
    "Tamil": "நான் விவசாயத்தின் சாட்பாட், விவசாயம் அல்லது விவசாயம் தொடர்பான கேள்விகள் அல்லது தலைப்புகளை என்னிடம் கேளுங்கள்.",
    "Kannada": "ನಾನು কෘಷಿ ಚಾಟ್‌ಬಾಟ್, ಕೃಷಿ ಅಥವಾ ಬೇಸಾಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳನ್ನು ಅಥವಾ ವಿಷಯಗಳನ್ನು ನನ್ನನ್ನು ಕೇಳಿ.",
    "Malayalam": "ഞാൻ കൃഷിയുടെ ഒരു ചാറ്റ്ബോട്ട് ആണ്, കൃഷിയെയോ കാർഷിക മേഖലയെയോ കുറിച്ചുള്ള ചോദ്യങ്ങളോ വിഷയങ്ങളോ എന്നോട് ചോദിക്കുക.",
    "Marathi": "मी शेतीचा चॅटबॉट आहे, मला शेती किंवा शेतीशी संबंधित प्रश्न किंवा विषय विचारा.",
    "Gujarati": "હું ખેતીનો ચેટબોટ છું, મને ખેતી અથવા ખેતી સંબંધિત પ્રશ્નો અથવા વિષયો પૂછો.",
    "Bengali": "আমি কৃষির চ্যাটবট, আমাকে কৃষি বা চাষ সংক্রান্ত প্রশ্ন বা বিষয় জিজ্ঞাসা করুন।",
    "Punjabi": "ਮੈਂ ਖੇਤੀਬਾੜੀ ਦਾ ਚੈਟਬੋਟ ਹਾਂ, ਮੈਨੂੰ ਖੇਤੀਬาੜੀ ਜਾਂ ਖੇਤੀ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲ ਜਾਂ ਵਿਸ਼ੇ ਪੁੱਛੋ।",
}


@dataclass
class ChatResult:
    """Persisted chat conversation together with its API response payload."""

    history: ChatHistory
    response_payload: dict[str, str]


def _get_prediction_context(
    db: Session,
    user_id: int | None,
    prediction_history_id: int | None,
) -> PredictionHistory | None:
    if prediction_history_id is None or user_id is None:
        return None
    return (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == prediction_history_id,
            PredictionHistory.user_id == user_id,
        )
        .first()
    )


def _build_prompt(
    question: str,
    response_language: str,
    prediction: PredictionHistory | None,
    previous_chat: ChatHistory | None,
) -> str:
    if prediction is not None:
        return build_prediction_explanation_prompt(question, prediction, response_language)
    if "disease" in question.lower():
        return build_disease_explanation_prompt(question, response_language)
    if previous_chat is not None:
        return build_follow_up_prompt(question, previous_chat.assistant_response, response_language)
    return build_general_farming_prompt(question, response_language)


def _build_response_payload(
    question_language: str,
    preferred_language: str,
    primary_response: str,
    preferred_response: str | None = None,
) -> dict[str, str]:
    if question_language == preferred_language:
        return {"response": primary_response, "assistant_response": primary_response}
    return {
        "response": primary_response,
        "assistant_response": primary_response,
        "question_language": question_language,
        "preferred_language": preferred_language,
        LANGUAGE_RESPONSE_KEYS.get(question_language, "english_response"): primary_response,
        LANGUAGE_RESPONSE_KEYS.get(preferred_language, "english_response"): preferred_response or primary_response,
    }


def chat_with_user(db: Session, current_user: User | None, chat_data: ChatRequest) -> ChatResult:
    """Validate, generate, and save a single-language or bilingual conversation."""
    user_id = getattr(current_user, "id", None)
    language_id = getattr(current_user, "language_id", 1)

    prediction = _get_prediction_context(db, user_id, chat_data.prediction_history_id)

    question_language = detect_question_language(chat_data.question)
    preferred_language = get_preferred_language(language_id)
    is_agriculture = is_agriculture_question(chat_data.question)

    if is_agriculture:
        previous_chat = None
        if user_id is not None:
            previous_chat = (
                db.query(ChatHistory)
                .filter(ChatHistory.user_id == user_id)
                .order_by(ChatHistory.created_at.desc())
                .first()
            )
        primary_response = gemini_service.generate_response(
            _build_prompt(chat_data.question, question_language, prediction, previous_chat)
        )
        preferred_response = None
        if question_language != preferred_language:
            preferred_response = gemini_service.generate_response(
                build_translation_prompt(primary_response, question_language, preferred_language)
            )
    else:
        default_non_agri = NON_AGRICULTURE_RESPONSES["English"]
        primary_response = NON_AGRICULTURE_RESPONSES.get(question_language, default_non_agri)
        preferred_response = (
            NON_AGRICULTURE_RESPONSES.get(preferred_language, default_non_agri)
            if question_language != preferred_language
            else None
        )

    response_payload = _build_response_payload(
        question_language,
        preferred_language,
        primary_response,
        preferred_response,
    )
    stored_response = (
        primary_response
        if question_language == preferred_language
        else json.dumps(response_payload, ensure_ascii=False)
    )

    chat_history = ChatHistory(
        user_id=user_id,
        prediction_history_id=prediction.id if prediction else None,
        user_message=chat_data.question,
        question_language=question_language,
        preferred_language=preferred_language,
        assistant_response=stored_response,
    )

    if db and user_id:
        try:
            db.add(chat_history)
            db.commit()
            db.refresh(chat_history)
        except Exception:
            db.rollback()

    return ChatResult(history=chat_history, response_payload=response_payload)


def get_user_chat_history(db: Session, user_id: int) -> list[ChatHistory]:
    """Return only the requesting user's conversations, newest first."""
    return (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at.desc())
        .all()
    )
