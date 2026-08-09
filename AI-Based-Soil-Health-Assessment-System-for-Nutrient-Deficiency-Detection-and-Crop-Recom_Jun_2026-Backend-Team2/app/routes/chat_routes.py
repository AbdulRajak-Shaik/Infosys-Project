"""Authenticated chatbot API routes."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user_optional, get_db
from app.models import User
from app.schemas import ChatHistoryResponse, ChatRequest, ChatResponse
from app.services.chatbot_service import chat_with_user, get_user_chat_history


router = APIRouter(tags=["Chatbot"])


@router.post("/chat", response_model=ChatResponse, response_model_exclude_none=True)
def chat(
    chat_data: ChatRequest,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Generate and save a single-language or bilingual agriculture response."""
    try:
        chat_result = chat_with_user(db, current_user, chat_data)
        return ChatResponse(**chat_result.response_payload)
    except Exception as exc:
        print(f"Chatbot route error: {exc}")
        return ChatResponse(
            response="Hello! I am your AI Agriculture & Soil Health Assistant. "
                     "To get the best yield, maintain balanced N-P-K nutrient application, "
                     "keep soil pH between 6.0 and 7.5, and ensure timely irrigation. "
                     "You can ask me questions about crops, soil health, fertilizers, or plant diseases!"
        )


@router.get("/chat-history", response_model=List[ChatHistoryResponse])
def list_chat_history(
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> list[ChatHistoryResponse]:
    """Return only the authenticated user's chatbot conversations."""
    if not current_user:
        return []
    return get_user_chat_history(db, current_user.id)
