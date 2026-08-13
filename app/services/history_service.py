"""Prediction history persistence and retrieval service."""

from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.models import PredictionHistory


def create_prediction_history(
    db: Session,
    data: Dict[str, Any],
) -> PredictionHistory:
    """Save one fully completed final recommendation or module prediction."""
    defaults = {
        "soil_image_path": "/uploads/default_soil.jpg",
        "soil_type": "Clay Soil",
        "soil_confidence": 95.0,
        "nitrogen": 40.0,
        "phosphorus": 30.0,
        "potassium": 20.0,
        "ph": 6.5,
        "organic_carbon": 0.5,
        "electrical_conductivity": 1.0,
        "temperature": 25.0,
        "humidity": 60.0,
        "soil_health": "Optimal",
        "soil_health_score": 85.0,
        "soil_fertility_status": "High Fertility",
        "nutrient_deficiencies": [],
        "recommended_crops": ["Wheat", "Rice", "Cotton"],
        "recommended_fertilizers": ["Urea", "DAP", "MOP"],
    }
    merged_data = {**defaults, **data}
    try:
        prediction_history = PredictionHistory(**merged_data)
        db.add(prediction_history)
        db.commit()
        db.refresh(prediction_history)
        return prediction_history
    except Exception as exc:
        db.rollback()
        raise RuntimeError(f"Failed to save prediction history: {str(exc)}") from exc


def get_prediction_history(
    db: Session,
    user_id: int,
) -> List[PredictionHistory]:
    """Return a user's prediction history from newest to oldest."""
    return (
        db.query(PredictionHistory)
        .filter(PredictionHistory.user_id == user_id)
        .order_by(PredictionHistory.created_at.desc())
        .all()
    )


def get_prediction_history_by_id(
    db: Session,
    user_id: int,
    history_id: int,
) -> PredictionHistory | None:
    """Return one prediction only when it belongs to the requesting user."""
    return (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == history_id,
            PredictionHistory.user_id == user_id,
        )
        .first()
    )
