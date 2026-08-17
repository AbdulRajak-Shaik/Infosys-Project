"""Prediction history API routes."""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import PredictionHistory, User
from app.schemas import PredictionHistoryDetailResponse, PredictionHistorySummaryResponse
from app.services.history_service import get_prediction_history, get_prediction_history_by_id


router = APIRouter(tags=["Prediction History"])


def _get_top_crop(recommended_crops: list[Any]) -> str | None:
    """Return the first crop from the stored crop recommendations."""
    if not recommended_crops:
        return None

    top_crop = recommended_crops[0]
    if isinstance(top_crop, dict):
        return top_crop.get("crop")
    return str(top_crop)


def _serialize_detail(prediction: PredictionHistory) -> Dict[str, Any]:
    """Build the complete saved prediction response."""
    return {
        "history_id": prediction.id,
        "prediction_date": prediction.created_at,
        "soil_type": prediction.soil_type,
        "soil_confidence": prediction.soil_confidence,
        "nitrogen": prediction.nitrogen,
        "phosphorus": prediction.phosphorus,
        "potassium": prediction.potassium,
        "ph": prediction.ph,
        "organic_carbon": prediction.organic_carbon,
        "electrical_conductivity": prediction.electrical_conductivity,
        "temperature": prediction.temperature,
        "humidity": prediction.humidity,
        "soil_health": prediction.soil_health,
        "soil_health_score": prediction.soil_health_score,
        "soil_fertility_status": prediction.soil_fertility_status,
        "deficiencies": prediction.nutrient_deficiencies,
        "recommended_crops": prediction.recommended_crops,
        "recommended_fertilizers": prediction.recommended_fertilizers,
    }


@router.get("/history", response_model=List[PredictionHistorySummaryResponse])
def list_prediction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Return lightweight history summaries for the logged-in user."""
    predictions = get_prediction_history(db, current_user.id)
    return [
        {
            "history_id": prediction.id,
            "id": prediction.id,
            "prediction_type": "crop" if (prediction.recommended_crops and len(prediction.recommended_crops) > 0) else "soil",
            "type": "Crop" if (prediction.recommended_crops and len(prediction.recommended_crops) > 0) else "Soil",
            "prediction_date": prediction.created_at.isoformat() if prediction.created_at else None,
            "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
            "date": prediction.created_at.strftime("%b %d, %Y %I:%M %p") if prediction.created_at else "Just now",
            "soil_type": prediction.soil_type,
            "soil_health": prediction.soil_health,
            "soil_health_score": prediction.soil_health_score,
            "soil_fertility_status": prediction.soil_fertility_status,
            "top_crop": _get_top_crop(prediction.recommended_crops),
            "predicted_crop": _get_top_crop(prediction.recommended_crops),
            "result": _get_top_crop(prediction.recommended_crops) or prediction.soil_type or "Soil Analysis",
            "confidence": int(prediction.soil_confidence if (prediction.soil_confidence and prediction.soil_confidence > 1) else (prediction.soil_confidence * 100 if prediction.soil_confidence else 95)),
            "input": f"Soil: {prediction.soil_type}, N:{prediction.nitrogen} P:{prediction.phosphorus} K:{prediction.potassium} pH:{prediction.ph}",
            "status": "success",
        }
        for prediction in predictions
    ]


@router.get("/history/{history_id}", response_model=PredictionHistoryDetailResponse)
def get_prediction_history_detail(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Return one complete saved prediction for the logged-in user."""
    prediction = get_prediction_history_by_id(db, current_user.id, history_id)
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction history not found.")

    return _serialize_detail(prediction)
