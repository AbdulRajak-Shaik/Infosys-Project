"""Database queries used by the admin dashboard."""

from collections import Counter
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import ChatHistory, Feedback, PredictionHistory, User, UserRole


def _normalize_chart_value(value: object) -> str:
    if isinstance(value, dict):
        return str(value.get("crop") or value.get("name") or next(iter(value.values()), ""))
    return str(value)


def get_dashboard_summary(db: Session) -> dict[str, int]:
    """Return the aggregate metrics required by the dashboard summary."""
    from datetime import datetime, timezone, timedelta
    total_users = db.query(func.count(User.id)).scalar() or 0
    
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    active_today = (
        db.query(func.count(User.id))
        .filter((User.last_login_at >= cutoff) | (User.updated_at >= cutoff))
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
    """Return monthly user registration totals in chronological order, grouped by role."""
    month_start = func.date_trunc("month", User.created_at).label("month_start")
    results = (
        db.query(month_start, User.role, func.count(User.id).label("count"))
        .group_by(month_start, User.role)
        .order_by(month_start)
        .all()
    )

    months_list = []
    months_seen = {}
    for r in results:
        m_name = r.month_start.strftime("%B")
        if m_name not in months_seen:
            item = {"month": m_name, "farmers": 0, "admins": 0, "users": 0}
            months_seen[m_name] = item
            months_list.append(item)
        
        role_str = str(r.role).lower()
        if role_str == "farmer":
            months_seen[m_name]["farmers"] += r.count
        elif role_str == "admin":
            months_seen[m_name]["admins"] += r.count
        months_seen[m_name]["users"] += r.count

    return months_list


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


def get_dashboard_insights(db: Session) -> dict[str, object]:
    """Return aggregated chart and chatbot metrics for the admin dashboard."""
    prediction_history = db.query(PredictionHistory).all()
    soil_counts = Counter()
    crop_counts = Counter()
    nutrient_counts = Counter()

    for record in prediction_history:
        if record.soil_type:
            soil_counts[record.soil_type] += 1

        for crop in record.recommended_crops or []:
            crop_counts[_normalize_chart_value(crop)] += 1

        for deficiency in record.nutrient_deficiencies or []:
            nutrient_counts[_normalize_chart_value(deficiency)] += 1

    soil_type_distribution = [
        {"name": name, "value": count}
        for name, count in soil_counts.most_common()
    ]
    crop_recommendation_counts = [
        {"name": name, "value": count}
        for name, count in crop_counts.most_common()
    ]
    nutrient_deficiency_stats = [
        {"name": name, "value": count}
        for name, count in nutrient_counts.most_common()
    ]

    language_counts = Counter()
    for user in db.query(User).all():
        if user.language and user.language.language_name:
            language_counts[user.language.language_name] += 1
        else:
            language_counts["Unknown"] += 1

    language_usage = [
        {"name": name, "value": count}
        for name, count in language_counts.most_common()
    ]

    chat_records = db.query(ChatHistory).order_by(ChatHistory.created_at.desc()).limit(6).all()
    recent_chat_activity = [
        {
            "id": chat.id,
            "user_name": chat.user.username if chat.user and chat.user.username else f"User {chat.user_id}",
            "user_message": chat.user_message,
            "question_language": chat.question_language,
            "preferred_language": chat.preferred_language,
            "created_at": chat.created_at,
        }
        for chat in chat_records
    ]

    total_conversations = db.query(func.count(ChatHistory.id)).scalar() or 0
    user_sessions = set()
    for chat in db.query(ChatHistory.user_id, ChatHistory.created_at).all():
        user_sessions.add((chat.user_id, chat.created_at.date()))

    avg_questions_per_session = round(total_conversations / max(len(user_sessions), 1), 1)
    active_users_today = (
        db.query(func.count(func.distinct(ChatHistory.user_id)))
        .filter(func.date(ChatHistory.created_at) == date.today())
        .scalar()
        or 0
    )

    return {
        "soil_type_distribution": soil_type_distribution,
        "nutrient_deficiency_stats": nutrient_deficiency_stats,
        "crop_recommendation_counts": crop_recommendation_counts,
        "language_usage": language_usage,
        "chatbot_metrics": {
            "total_conversations": total_conversations,
            "avg_questions_per_session": avg_questions_per_session,
            "active_users_today": active_users_today,
        },
        "recent_chat_activity": recent_chat_activity,
    }
