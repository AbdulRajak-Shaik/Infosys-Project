from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import Feedback, User
from app.schemas import FeedbackCreate, FeedbackResponse, FeedbackReplyRequest
from app.services.feedback_service import create_feedback, get_all_feedback, get_feedback_summary

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
        category=feedback.category or "general",
    )

    saved_fb = create_feedback(db, new_feedback)
    user_name = db.query(User.username).filter(User.id == saved_fb.user_id).scalar() or f"Farmer #{saved_fb.user_id}"
    
    return FeedbackResponse(
        id=saved_fb.id,
        user_id=saved_fb.user_id,
        rating=saved_fb.rating,
        comment=saved_fb.comment,
        category=saved_fb.category,
        admin_response=saved_fb.admin_response,
        is_resolved=saved_fb.is_resolved,
        user_name=user_name,
        created_at=saved_fb.created_at
    )


@router.get(
    "/",
    response_model=list[FeedbackResponse],
    summary="Get All Feedback"
)
def view_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Query Feedback scoped by user's role
    if current_user.role == "admin":
        feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    else:
        feedbacks = db.query(Feedback).filter(Feedback.user_id == current_user.id).order_by(Feedback.created_at.desc()).all()
    results = []
    for f in feedbacks:
        user_name = db.query(User.username).filter(User.id == f.user_id).scalar() or f"Farmer #{f.user_id}"
        results.append(
            FeedbackResponse(
                id=f.id,
                user_id=f.user_id,
                rating=f.rating,
                comment=f.comment,
                category=f.category,
                admin_response=f.admin_response,
                is_resolved=f.is_resolved,
                user_name=user_name,
                created_at=f.created_at
            )
        )
    return results


@router.get(
    "/summary",
    summary="Get Feedback Summary Statistics",
)
def feedback_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns real aggregate statistics computed from the feedback table. Only for Admins.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required.",
        )
    return get_feedback_summary(db)


@router.put("/{feedback_id}/reply", response_model=FeedbackResponse)
def reply_to_feedback(
    feedback_id: int,
    reply: FeedbackReplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required.",
        )
    f = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Feedback not found")
    f.admin_response = reply.admin_response
    db.commit()
    db.refresh(f)

    user_name = db.query(User.username).filter(User.id == f.user_id).scalar() or f"Farmer #{f.user_id}"
    return FeedbackResponse(
        id=f.id,
        user_id=f.user_id,
        rating=f.rating,
        comment=f.comment,
        category=f.category,
        admin_response=f.admin_response,
        is_resolved=f.is_resolved,
        user_name=user_name,
        created_at=f.created_at
    )


@router.delete("/{feedback_id}/reply", response_model=FeedbackResponse)
def delete_feedback_reply(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required.",
        )
    f = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Feedback not found")
    f.admin_response = None
    db.commit()
    db.refresh(f)

    user_name = db.query(User.username).filter(User.id == f.user_id).scalar() or f"Farmer #{f.user_id}"
    return FeedbackResponse(
        id=f.id,
        user_id=f.user_id,
        rating=f.rating,
        comment=f.comment,
        category=f.category,
        admin_response=f.admin_response,
        is_resolved=f.is_resolved,
        user_name=user_name,
        created_at=f.created_at
    )


@router.put("/{feedback_id}/resolve", response_model=FeedbackResponse)
def resolve_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required.",
        )
    f = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Feedback not found")
    f.is_resolved = True
    db.commit()
    db.refresh(f)

    user_name = db.query(User.username).filter(User.id == f.user_id).scalar() or f"Farmer #{f.user_id}"
    return FeedbackResponse(
        id=f.id,
        user_id=f.user_id,
        rating=f.rating,
        comment=f.comment,
        category=f.category,
        admin_response=f.admin_response,
        is_resolved=f.is_resolved,
        user_name=user_name,
        created_at=f.created_at
    )