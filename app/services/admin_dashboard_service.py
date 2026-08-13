"""Database queries used by the admin dashboard."""

from collections import Counter
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import ChatHistory, Feedback, PredictionHistory, User, UserRole, Language


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
    try:
        bind = db.get_bind()
        if bind and bind.dialect.name == "sqlite":
            month_str = func.strftime("%Y-%m", User.created_at).label("month_str")
            results = (
                db.query(month_str, User.role, func.count(User.id).label("count"))
                .group_by(month_str, User.role)
                .order_by(month_str)
                .all()
            )
            months_list = []
            months_seen = {}
            for r in results:
                m_key = r.month_str or "2026-01"
                try:
                    from datetime import datetime
                    m_name = datetime.strptime(m_key, "%Y-%m").strftime("%B")
                except Exception:
                    m_name = m_key
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
        else:
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
                m_name = r.month_start.strftime("%B") if hasattr(r.month_start, "strftime") else str(r.month_start)
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
    except Exception as err:
        print(f"Error calculating user growth: {err}")
        return []


def get_recent_users(db: Session) -> list[dict[str, object]]:
    """Return recently registered users for the dashboard with real usage statistics."""
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    result = []
    for user in users:
        prediction_count = db.query(func.count(PredictionHistory.id)).filter(PredictionHistory.user_id == user.id).scalar() or 0
        chatbot_count = db.query(func.count(ChatHistory.id)).filter(ChatHistory.user_id == user.id).scalar() or 0
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "region": user.region or "N/A",
            "status": user.status,
            "phone": getattr(user, "phone", None) or "N/A",
            "created_at": user.created_at,
            "last_login_at": getattr(user, "last_login_at", None),
            "language_id": user.language_id,
            "analyses": prediction_count,
            "chatbot": chatbot_count,
        })
    return result


import json


def _parse_json_list(val: object) -> list:
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            parsed = json.loads(val)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
    return []


def get_dashboard_insights(db: Session) -> dict[str, object]:
    """Return aggregated chart and chatbot metrics for the admin dashboard."""
    prediction_history = db.query(PredictionHistory).all()
    soil_counts = Counter()
    crop_counts = Counter()
    nutrient_counts = Counter()

    for record in prediction_history:
        if record.soil_type:
            soil_counts[record.soil_type] += 1

        crops = _parse_json_list(record.recommended_crops)
        for crop in crops:
            crop_counts[_normalize_chart_value(crop)] += 1

        deficiencies = _parse_json_list(record.nutrient_deficiencies)
        for deficiency in deficiencies:
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

    # Load all languages from languages table to ensure we include supported ones with 0 users
    languages_list = db.query(Language).filter(Language.is_active == True).all()
    user_lang_counts = Counter()
    for user in db.query(User).all():
        if user.language:
            user_lang_counts[user.language.language_name] += 1
        else:
            user_lang_counts["English"] += 1
            
    language_usage = []
    for lang in languages_list:
        language_usage.append({
            "name": lang.language_name,
            "value": user_lang_counts[lang.language_name]
        })
    # Sort language_usage by value descending, and then by name
    language_usage.sort(key=lambda x: (-x["value"], x["name"]))


    chat_records = db.query(ChatHistory).order_by(ChatHistory.created_at.desc()).limit(10).all()
    recent_chat_activity = [
        {
            "id": chat.id,
            "user_name": chat.user.username if chat.user and chat.user.username else f"User {chat.user_id}",
            "user_message": chat.user_message,
            "assistant_response": chat.assistant_response or "Response generated.",
            "question_language": chat.question_language,
            "preferred_language": chat.preferred_language or chat.question_language or "en",
            "created_at": chat.created_at,
        }
        for chat in chat_records
    ]

    total_conversations = db.query(func.count(ChatHistory.id)).scalar() or 0
    user_sessions = set()
    for chat in db.query(ChatHistory.user_id, ChatHistory.created_at).all():
        if chat.created_at:
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

