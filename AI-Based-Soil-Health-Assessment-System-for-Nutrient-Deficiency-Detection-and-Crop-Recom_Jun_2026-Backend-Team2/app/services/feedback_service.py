"""Feedback persistence and retrieval service."""

from typing import Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Feedback, User


def create_feedback(
    db: Session,
    feedback: Feedback,
) -> Feedback:
    """Save one feedback entry."""
    try:
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback
    except Exception as exc:
        db.rollback()
        raise RuntimeError(f"Failed to save feedback: {str(exc)}") from exc


def get_all_feedback(
    db: Session,
) -> List[Feedback]:
    """Return all feedback from newest to oldest."""
    return (
        db.query(Feedback)
        .order_by(Feedback.created_at.desc())
        .all()
    )


def get_feedback_summary(db: Session) -> Dict:
    """Return real aggregate feedback statistics from the database."""
    total_reviews: int = db.query(func.count(Feedback.id)).scalar() or 0

    avg_rating_raw = db.query(func.avg(Feedback.rating)).scalar()
    average_rating: float = round(float(avg_rating_raw), 1) if avg_rating_raw is not None else 0.0

    # Number of distinct farmers (users) who left feedback
    active_farmers: int = (
        db.query(func.count(func.distinct(Feedback.user_id))).scalar() or 0
    )

    # Feedback entries that have a non-empty admin_response — compute response rate
    responded: int = 0
    try:
        responded = (
            db.query(func.count(Feedback.id))
            .filter(Feedback.admin_response.isnot(None))  # type: ignore[attr-defined]
            .filter(Feedback.admin_response != "")        # type: ignore[attr-defined]
            .scalar()
            or 0
        )
    except Exception:
        # admin_response column may not exist on all deployments; skip gracefully
        responded = 0

    response_rate: int = round((responded / total_reviews) * 100) if total_reviews > 0 else 0

    # Rating distribution: {1: count, 2: count, ..., 5: count}
    distribution: Dict[int, int] = {star: 0 for star in range(1, 6)}
    rows = (
        db.query(Feedback.rating, func.count(Feedback.id))
        .group_by(Feedback.rating)
        .all()
    )
    for rating_val, cnt in rows:
        if isinstance(rating_val, int) and 1 <= rating_val <= 5:
            distribution[rating_val] = cnt

    return {
        "total_reviews": total_reviews,
        "average_rating": average_rating,
        "active_farmers": active_farmers,
        "response_rate": response_rate,
        "rating_distribution": distribution,
    }