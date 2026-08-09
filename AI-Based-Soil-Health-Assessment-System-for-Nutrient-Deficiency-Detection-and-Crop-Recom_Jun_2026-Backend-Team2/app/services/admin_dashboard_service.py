"""Database queries used by the admin dashboard."""

from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Feedback, PredictionHistory, User, UserRole


def get_dashboard_summary(db: Session) -> dict[str, int]:
    """Return the aggregate metrics required by the dashboard summary."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_today = (
        db.query(func.count(User.id))
        .filter(func.date(User.last_login_at) == date.today())
        .scalar()
        or 0
    )
    total_predictions = db.query(func.count(PredictionHistory.id)).scalar() or 0
    farmer_count = db.query(User).filter(User.role == UserRole.FARMER.value).count()
    feedback_received = db.query(func.count(Feedback.id)).scalar() or 0

    return {
        "total_users": total_users,
        "active_today": active_today,
        "total_predictions": total_predictions,
        "farmer_count": farmer_count,
        "feedback_received": feedback_received,
    }


def get_user_growth(db: Session) -> list[dict[str, int | str]]:
    """Return monthly user registration totals in chronological order."""
    month_start = func.date_trunc("month", User.created_at).label("month_start")
    registrations = (
        db.query(month_start, func.count(User.id).label("users"))
        .group_by(month_start)
        .order_by(month_start)
        .all()
    )

    return [
        {"month": registration.month_start.strftime("%B"), "users": registration.users}
        for registration in registrations
    ]


def get_recent_users(db: Session) -> list[dict[str, object]]:
    """Return the five most recently registered users for the dashboard."""
    recent_users = (
        db.query(
            User.id,
            User.username,
            User.email,
            User.role,
            User.region,
            User.status,
            User.created_at,
        )
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )

    return [dict(user._mapping) for user in recent_users]
