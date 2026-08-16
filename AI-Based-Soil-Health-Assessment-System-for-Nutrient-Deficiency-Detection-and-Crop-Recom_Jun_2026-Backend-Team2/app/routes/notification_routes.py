"""API routes for Notification Management — Database-backed Persistent Notifications.

Generates and persists notifications to the database under general_history.
Allows marking as read/unread permanently.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.dependencies import get_current_user, get_db
from app.models import User, GeneralHistory, PredictionHistory
from app.services.sarvam_service import translate_text


router = APIRouter(tags=["Notifications"])


def _relative_time(dt: datetime) -> str:
    """Convert a datetime to a human-readable relative time string."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        mins = seconds // 60
        return f"{mins} minute{'s' if mins != 1 else ''} ago"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = seconds // 86400
        return f"{days} day{'s' if days != 1 else ''} ago"
    else:
        return dt.strftime("%b %d, %Y")


def _seed_default_notifications(db: Session, user: User) -> List[GeneralHistory]:
    """Seed initial default notifications into general_history for the user."""
    from app.services.history_service import create_general_history
    seeded = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # 1. Welcome announcement
    n1 = create_general_history(
        db=db,
        user_id=user.id,
        module_name="Notification",
        prediction_type="notification",
        input_parameters={
            "id": "welcome-new-user",
            "title": "Welcome to AgroAI!",
            "desc": "Explore Soil Analysis, Crop Recommendations, and AI Chatbot to get started with smart farming.",
            "type": "system"
        },
        prediction_result={"read": False}
    )
    # Set created_at slightly in the past
    n1.created_at = now - timedelta(hours=6)
    seeded.append(n1)

    # 2. AI model update notice
    n2 = create_general_history(
        db=db,
        user_id=user.id,
        module_name="Notification",
        prediction_type="notification",
        input_parameters={
            "id": "ai-model-updated",
            "title": "AI Model Updated",
            "desc": "Crop recommendation and soil analysis models have been upgraded with improved accuracy.",
            "type": "system"
        },
        prediction_result={"read": False}
    )
    n2.created_at = now - timedelta(days=2)
    seeded.append(n2)

    # 3. Weather update notification
    region = user.region or "your region"
    n3 = create_general_history(
        db=db,
        user_id=user.id,
        module_name="Notification",
        prediction_type="notification",
        input_parameters={
            "id": f"weather-live-{now.strftime('%Y%m%d')}",
            "title": f"Weather Update: {region}",
            "desc": f"Check weather forecasts for {region} to plan your daily farming activities.",
            "type": "weather"
        },
        prediction_result={"read": False}
    )
    n3.created_at = now - timedelta(hours=1)
    seeded.append(n3)

    # 4. Profile incomplete warning
    if not user.region or user.region == "Central":
        n4 = create_general_history(
            db=db,
            user_id=user.id,
            module_name="Notification",
            prediction_type="notification",
            input_parameters={
                "id": "profile-incomplete",
                "title": "Complete Your Profile",
                "desc": "Add your region and location details for personalized crop recommendations.",
                "type": "system"
            },
            prediction_result={"read": False}
        )
        n4.created_at = now - timedelta(hours=3)
        seeded.append(n4)

    db.commit()
    return seeded


def _get_notifications_from_db(db: Session, user: User) -> List[Dict[str, Any]]:
    """Retrieve user notifications from general_history table, seeding defaults if empty."""
    lang_id = user.language_id or 1
    
    # Query database for persistent notifications
    db_notifs = (
        db.query(GeneralHistory)
        .filter(
            GeneralHistory.user_id == user.id,
            GeneralHistory.prediction_type == "notification"
        )
        .order_by(GeneralHistory.created_at.desc())
        .all()
    )

    if not db_notifs:
        db_notifs = _seed_default_notifications(db, user)
        # Sort descending
        db_notifs.sort(key=lambda x: x.created_at or datetime.now(), reverse=True)

    # Serialize notifications with translation support
    results = []
    for n in db_notifs:
        inp = n.input_parameters
        res = n.prediction_result
        created = n.created_at or datetime.now()
        time_str = _relative_time(created)

        results.append({
            "id": inp.get("id") or f"notif-{n.id}",
            "title": translate_text(inp.get("title", "Notification"), lang_id),
            "desc": translate_text(inp.get("desc", ""), lang_id),
            "time": translate_text(time_str, lang_id),
            "type": inp.get("type", "system"),
            "read": res.get("read", False)
        })

    return results[:15]  # Cap at 15 notifications


@router.get("/notifications", response_model=List[Dict[str, Any]])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Retrieve all real-time, database-persisted notifications for the authenticated user."""
    return _get_notifications_from_db(db, current_user)


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Mark a specific database-persisted notification as read."""
    db_notifs = (
        db.query(GeneralHistory)
        .filter(
            GeneralHistory.user_id == current_user.id,
            GeneralHistory.prediction_type == "notification"
        )
        .all()
    )

    for n in db_notifs:
        if n.input_parameters.get("id") == notification_id:
            res = dict(n.prediction_result)
            res["read"] = True
            n.prediction_result = res
            db.add(n)
            db.commit()
            return {"message": "Notification marked as read", "notification_id": notification_id}

    raise HTTPException(status_code=404, detail="Notification not found.")


@router.post("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Mark all database-persisted notifications for the current user as read."""
    db_notifs = (
        db.query(GeneralHistory)
        .filter(
            GeneralHistory.user_id == current_user.id,
            GeneralHistory.prediction_type == "notification"
        )
        .all()
    )

    for n in db_notifs:
        res = dict(n.prediction_result)
        res["read"] = True
        n.prediction_result = res
        db.add(n)
        
    db.commit()
    return {"message": "All notifications marked as read", "count": len(db_notifs)}


@router.post("/notifications")
def create_notification(
    notification: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create and persist a new notification in general_history for the current user."""
    from app.services.history_service import create_general_history
    
    new_id = notification.get("id") or f"custom-{uuid.uuid4().hex[:12]}"
    title = notification.get("title", "New Notification")
    desc = notification.get("desc", "")
    n_type = notification.get("type", "system")

    db_notif = create_general_history(
        db=db,
        user_id=current_user.id,
        module_name="Notification",
        prediction_type="notification",
        input_parameters={
            "id": new_id,
            "title": title,
            "desc": desc,
            "type": n_type
        },
        prediction_result={"read": False}
    )

    return {
        "message": "Notification created successfully",
        "notification": {
            "id": new_id,
            "title": title,
            "desc": desc,
            "time": "Just now",
            "type": n_type,
            "read": False
        }
    }


@router.post("/notifications/refresh")
def refresh_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Fetch fresh database-persisted notifications for the user."""
    notifs = _get_notifications_from_db(db, current_user)
    return {"message": "Notifications refreshed", "count": len(notifs)}
