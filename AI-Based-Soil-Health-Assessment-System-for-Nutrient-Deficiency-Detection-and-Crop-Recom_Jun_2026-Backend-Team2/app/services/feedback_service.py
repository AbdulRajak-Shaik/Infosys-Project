"""Feedback persistence and retrieval service."""

from typing import List

from sqlalchemy.orm import Session

from app.models import Feedback


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