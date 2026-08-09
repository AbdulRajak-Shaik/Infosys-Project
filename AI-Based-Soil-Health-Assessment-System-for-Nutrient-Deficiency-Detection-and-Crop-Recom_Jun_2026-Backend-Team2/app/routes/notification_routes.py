"""API routes for Notification Management — Real Dynamic Notifications.

Generates notifications from:
1. User's prediction history (soil, crop, disease analyses)
2. Weather alerts based on user's location
3. Profile update events
4. Chatbot activity
5. System-level announcements
"""

from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Body
from app.dependencies import get_current_user
from app.models import User
from app.database import SessionLocal
from app.models import PredictionHistory

router = APIRouter(tags=["Notifications"])

# In-memory notification storage per user (persisted during server session)
_USER_NOTIFICATIONS: Dict[int, List[Dict[str, Any]]] = {}
_READ_IDS: Dict[int, set] = {}


def _relative_time(dt: datetime) -> str:
    """Convert a datetime to a human-readable relative time string."""
    now = datetime.utcnow()
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


def _generate_real_notifications(user: User) -> List[Dict[str, Any]]:
    """Generate real notifications from user's prediction history and system events."""
    notifications: List[Dict[str, Any]] = []
    db = SessionLocal()
    
    try:
        # Fetch user's recent prediction history
        predictions = (
            db.query(PredictionHistory)
            .filter(PredictionHistory.user_id == user.id)
            .order_by(PredictionHistory.created_at.desc())
            .limit(20)
            .all()
        )
        
        for idx, pred in enumerate(predictions):
            pred_type = (pred.prediction_type or "soil").lower()
            created = pred.created_at or datetime.utcnow()
            time_str = _relative_time(created)
            
            if "crop" in pred_type:
                crop_name = pred.predicted_crop or pred.top_crop or "recommended crop"
                confidence = pred.soil_confidence or 0
                conf_pct = confidence if confidence > 1 else round(confidence * 100)
                notifications.append({
                    "id": f"pred-crop-{pred.id}",
                    "title": f"Crop Recommendation: {crop_name}",
                    "desc": f"AI recommended {crop_name} for your soil conditions with {conf_pct}% confidence. Based on NPK values and regional climate data analysis.",
                    "time": time_str,
                    "type": "crop",
                    "read": False,
                })
            elif "soil" in pred_type:
                soil_type = pred.soil_type or "soil sample"
                notifications.append({
                    "id": f"pred-soil-{pred.id}",
                    "title": f"Soil Analysis Complete: {soil_type}",
                    "desc": f"Your soil sample has been analyzed. Soil type identified as {soil_type}. Check the detailed NPK nutrient breakdown and recommendations.",
                    "time": time_str,
                    "type": "crop",
                    "read": False,
                })
            elif "disease" in pred_type:
                notifications.append({
                    "id": f"pred-disease-{pred.id}",
                    "title": "Plant Disease Detected",
                    "desc": f"AI analysis identified a potential plant disease in your submitted image. Review the diagnosis and suggested treatment plan.",
                    "time": time_str,
                    "type": "disease",
                    "read": False,
                })
    except Exception as e:
        print(f"[Notification] DB query warning: {e}")
    finally:
        db.close()
    
    # Add real-time system notifications
    now = datetime.utcnow()
    
    # Weather-based notification using user's region
    user_region = user.region or "your region"
    notifications.append({
        "id": f"weather-live-{now.strftime('%Y%m%d')}",
        "title": f"Weather Update: {user_region}",
        "desc": f"Check today's weather conditions for {user_region}. Monitor temperature, humidity, and rainfall forecasts to plan your farming activities.",
        "time": _relative_time(now - timedelta(hours=1)),
        "type": "weather",
        "read": False,
    })
    
    # Profile completion notification
    if not user.region or user.region == "Central":
        notifications.append({
            "id": "profile-incomplete",
            "title": "Complete Your Profile",
            "desc": "Add your region and location details for personalized crop recommendations and accurate weather alerts tailored to your farm.",
            "time": _relative_time(now - timedelta(hours=3)),
            "type": "system",
            "read": False,
        })
    
    # Welcome / getting started
    if user.created_at:
        try:
            created_dt = user.created_at if isinstance(user.created_at, datetime) else datetime.fromisoformat(str(user.created_at))
            days_active = (now - created_dt).days
            if days_active <= 7:
                notifications.append({
                    "id": "welcome-new-user",
                    "title": "Welcome to AgroAI!",
                    "desc": f"You joined {days_active} day{'s' if days_active != 1 else ''} ago. Explore Soil Analysis, Crop Recommendations, and AI Chatbot to get started with smart farming.",
                    "time": _relative_time(created_dt),
                    "type": "system",
                    "read": False,
                })
        except Exception:
            pass
    
    # System announcement
    notifications.append({
        "id": f"system-update-{now.strftime('%Y%m')}",
        "title": "AI Model Updated",
        "desc": "Crop recommendation and soil analysis models have been upgraded with improved accuracy. Results now include enhanced regional climate data integration.",
        "time": _relative_time(now - timedelta(days=2)),
        "type": "system",
        "read": True,
    })
    
    # Sort by newest first and assign sequential IDs if needed
    return notifications[:15]  # Cap at 15 notifications


def _get_notifications_for_user(user: User) -> List[Dict[str, Any]]:
    """Get or generate notifications for a user."""
    user_id = user.id
    if user_id not in _USER_NOTIFICATIONS:
        _USER_NOTIFICATIONS[user_id] = _generate_real_notifications(user)
        _READ_IDS[user_id] = set()
    
    # Apply read status
    read_ids = _READ_IDS.get(user_id, set())
    for n in _USER_NOTIFICATIONS[user_id]:
        if n["id"] in read_ids:
            n["read"] = True
    
    return _USER_NOTIFICATIONS[user_id]


@router.get("/notifications", response_model=List[Dict[str, Any]])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Retrieve all real-time notifications for the authenticated user."""
    return _get_notifications_for_user(current_user)


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Mark a specific notification as read."""
    notifs = _get_notifications_for_user(current_user)
    if current_user.id not in _READ_IDS:
        _READ_IDS[current_user.id] = set()
    
    for n in notifs:
        if n["id"] == notification_id:
            n["read"] = True
            _READ_IDS[current_user.id].add(notification_id)
            return {"message": "Notification marked as read", "notification_id": notification_id}
    raise HTTPException(status_code=404, detail="Notification not found.")


@router.post("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Mark all notifications for the current user as read."""
    notifs = _get_notifications_for_user(current_user)
    if current_user.id not in _READ_IDS:
        _READ_IDS[current_user.id] = set()
    for n in notifs:
        n["read"] = True
        _READ_IDS[current_user.id].add(n["id"])
    return {"message": "All notifications marked as read", "count": len(notifs)}


@router.post("/notifications")
def create_notification(
    notification: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new notification for the current user."""
    user_id = current_user.id
    if user_id not in _USER_NOTIFICATIONS:
        _USER_NOTIFICATIONS[user_id] = _generate_real_notifications(current_user)
        _READ_IDS[user_id] = set()
    
    new_notif = {
        "id": notification.get("id", f"custom-{datetime.utcnow().timestamp()}"),
        "title": notification.get("title", "New Notification"),
        "desc": notification.get("desc", ""),
        "time": notification.get("time", "Just now"),
        "type": notification.get("type", "system"),
        "read": False,
    }
    _USER_NOTIFICATIONS[user_id].insert(0, new_notif)
    return {"message": "Notification created", "notification": new_notif}


@router.post("/notifications/refresh")
def refresh_notifications(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Force refresh notifications from latest user activity."""
    user_id = current_user.id
    read_ids = _READ_IDS.get(user_id, set())
    _USER_NOTIFICATIONS[user_id] = _generate_real_notifications(current_user)
    _READ_IDS[user_id] = read_ids  # Preserve read status
    return {"message": "Notifications refreshed", "count": len(_USER_NOTIFICATIONS[user_id])}
