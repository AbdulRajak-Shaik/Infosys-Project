from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import Feedback, User
from app.schemas import FeedbackCreate, FeedbackResponse
from app.services.feedback_service import create_feedback, get_all_feedback

router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"]
)


@router.post(
    "/",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Feedback"
)
def submit_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_feedback = Feedback(
        user_id=current_user.id,
        rating=feedback.rating,
        comment=feedback.comment,
    )

    return create_feedback(db, new_feedback)


@router.get(
    "/",
    response_model=list[FeedbackResponse],
    summary="Get All Feedback"
)
def view_feedback(
    db: Session = Depends(get_db),
):
    return get_all_feedback(db)