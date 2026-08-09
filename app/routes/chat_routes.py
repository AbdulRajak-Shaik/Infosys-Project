"""Authenticated chatbot API routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import User, ChatHistory, UserRole
from app.schemas import ChatHistoryResponse, ChatRequest, ChatResponse
from app.services.chatbot_service import chat_with_user, get_user_chat_history


router = APIRouter(tags=["Chatbot"])


@router.post("/chat", response_model=ChatResponse, response_model_exclude_none=True)
def chat(
    chat_data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Generate and save a single-language or bilingual agriculture response."""
    chat_result = chat_with_user(db, current_user, chat_data)
    return ChatResponse(**chat_result.response_payload)


@router.get("/chat-history", response_model=List[ChatHistoryResponse])
def list_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ChatHistoryResponse]:
    """Return only the authenticated user's chatbot conversations."""
    return get_user_chat_history(db, current_user.id)


@router.get("/api/chatbot/recent-activity")
def public_recent_chat_activity(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Public endpoint returning recent chatbot activity in a frontend-friendly shape.

    Returns an array of objects with fields: id, timestamp, userName, userRole, language, question, topic, status
    """
    try:
        # require admin privileges to view recent activity
        if current_user.role != UserRole.ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access is required.")

        records = (
            db.query(ChatHistory)
            .order_by(ChatHistory.created_at.desc())
            .limit(20)
            .all()
        )
        result = []
        from app.services.chatbot_service import classify_topic
        for r in records:
            user = r.user
            result.append(
                {
                    "id": f"conv-{r.id}",
                    "timestamp": r.created_at.isoformat(),
                    "userName": user.username if user and user.username else f"User {r.user_id}",
                    "userRole": user.role.title() if user and user.role else "Farmer",
                    "language": r.question_language or r.preferred_language or (user.language.language_name if user and user.language else "English"),
                    "question": r.user_message,
                    "assistant_response": r.assistant_response,
                    "topic": classify_topic(r.user_message, r.prediction_history_id),
                    "status": "Resolved" if bool(r.question_language) else "Pending",
                }
            )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to retrieve recent chatbot activity") from exc


@router.get("/api/chatbot/monitoring-analytics")
def get_chatbot_monitoring_analytics_endpoint(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Admin endpoint returning database-driven analytics for chatbot monitoring."""
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access is required.")
    from app.services.chatbot_service import get_chatbot_monitoring_analytics
    return get_chatbot_monitoring_analytics(db)
