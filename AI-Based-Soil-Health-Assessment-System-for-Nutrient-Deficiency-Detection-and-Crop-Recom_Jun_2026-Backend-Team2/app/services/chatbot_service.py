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
    "English": "I'm an agriculture assistant and can only answer agriculture and farming related questions. Please ask me about soil, crops, fertilizers, pests, or weather!",
    "Telugu": "నేను వ్యవసాయ సంబంధించింది ప్రశ్నలకు మాత్రమే సమాధానం ఇవ్వగలను. దయచేసి నేల, పంటలు, ఎరువులు లేదా వాతావరణం గురించి అడగండి!",
    "Hindi": "मैं केवल कृषि और खेती से संबंधित प्रश्नों का उत्तर दे सकता हूँ। कृपया मिट्टी, फसलों, उर्वरकों या मौसम के बारे में पूछें!",
    "Tamil": "நான் விவசாயம் மற்றும் உழவு தொடர்பான கேள்விகளுக்கு மட்டுமே பதிலளிக்க முடியும். மண், பயிர்கள், உரங்கள் அல்லது வானிலை பற்றி கேட்கவும்!",
    "Kannada": "நான் ಕೃಷಿ ಮತ್ತು ಶೇತಿಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ಉತ್ತರಿಸಬಲ್ಲೆ. ಮಣ್ಣು, ಬೆಳೆಗಳು ಅಥವಾ ಗೊಬ್ಬರಗಳ ಬಗ್ಗೆ ಕೇಳಿ!",
    "Malayalam": "ഞാൻ കാർഷിക സംബന്ധമായ ചോദ്യങ്ങൾക്ക് മാത്രമേ മറുപടി നൽകാൻ കഴിയൂ. മണ്ണ്, വിളകൾ, വളങ്ങൾ എന്നിവയെക്കുറിച്ച് ചോദിക്കുക!",
    "Marathi": "मी फक्त शेती आणि पिकांशी संबंधित प्रश्नांची उत्तरे देऊ शकतो. कृपया माती, पिके किंवा खतांबद्दल विचार!",
    "Gujarati": "હું ફક્ત ખેતી અને પાક સંબંધિત પ્રશ્નોના જવાબ આપી શકું છું. કૃપા કરીને માટી, પાક અથવા ખાતરો વિશે પૂછો!",
    "Bengali": "আমি কেবল কৃষি এবং চাষ সংক্রান্ত প্রশ্নের উত্তর দিতে পারি। দয়া করে মাটি, ফসল বা সার সম্পর্কে জিজ্ঞাসা করুন!",
    "Punjabi": "ਮੈਂ ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ ਅਤੇ ਫਸਲਾਂ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਮਿੱਟੀ, ਫਸਲਾਂ ਜਾਂ ਖਾਦਾਂ ਬਾਰੇ ਪੁੱਛੋ!",
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
