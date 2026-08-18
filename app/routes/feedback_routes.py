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


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
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


@router.get("", response_model=list[FeedbackResponse], include_in_schema=False)
@router.get(
    "/",
    response_model=list[FeedbackResponse],
    summary="Get All Feedback"
)
def view_feedback(
    db: Session = Depends(get_db),
):
    items = get_all_feedback(db)
    result = []
    for item in items:
        user = item.user
        result.append(FeedbackResponse(
            id=item.id,
            user_id=item.user_id,
            user_name=user.username if user and user.username else f"Farmer #{item.user_id}",
            user_email=user.email if user else None,
            rating=item.rating,
            comment=item.comment,
            admin_response=item.admin_response,
            is_resolved=bool(item.is_resolved),
            created_at=item.created_at
        ))
    return result


@router.get(
    "/summary",
    summary="Get Feedback Summary Statistics"
)
def get_feedback_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException, status
    from sqlalchemy import func
    from app.models import UserRole
    
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    total_reviews = db.query(func.count(Feedback.id)).scalar() or 0
    avg_rating = db.query(func.avg(Feedback.rating)).scalar() or 0.0
    avg_rating = round(float(avg_rating), 1)
    
    active_farmers = db.query(func.count(User.id)).filter(User.role == UserRole.FARMER.value, User.status == "active").scalar() or 0
    
    # Response Rate: entries with admin_response or is_resolved
    resolved_count = db.query(func.count(Feedback.id)).filter(
        (Feedback.admin_response.isnot(None)) & (Feedback.admin_response != "") | (Feedback.is_resolved == True)
    ).scalar() or 0
    
    response_rate = int((resolved_count / max(total_reviews, 1)) * 100)
    
    return {
        "average_rating": avg_rating,
        "total_reviews": total_reviews,
        "active_farmers": active_farmers,
        "response_rate": response_rate
    }


from pydantic import BaseModel
class FeedbackReplyRequest(BaseModel):
    admin_response: str


@router.put(
    "/{feedback_id}/reply",
    response_model=FeedbackResponse,
    summary="Admin Reply to Feedback"
)
def reply_to_feedback(
    feedback_id: int,
    req: FeedbackReplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException, status
    from app.models import UserRole
    
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
        
    feedback.admin_response = req.admin_response
    db.commit()
    db.refresh(feedback)
    return feedback


@router.put(
    "/{feedback_id}/resolve",
    response_model=FeedbackResponse,
    summary="Admin Mark Feedback as Resolved"
)
def resolve_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException, status
    from app.models import UserRole
    
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
        
    feedback.is_resolved = True
    db.commit()
    db.refresh(feedback)
    return feedback


@router.delete(
    "/{feedback_id}/reply",
    response_model=FeedbackResponse,
    summary="Admin Delete Reply to Feedback"
)
def delete_feedback_reply(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException, status
    from app.models import UserRole
    
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
        
    feedback.admin_response = None
    feedback.is_resolved = False  # Revert to Pending
    db.commit()
    db.refresh(feedback)
    return feedback