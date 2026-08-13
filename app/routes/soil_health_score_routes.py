"""Soil health score API routes."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user, get_db
from app.models import User
from app.routes.crop_routes import CropPredictionRequest
from app.services.soil_health_score_service import predict_soil_health_score
from app.services.history_service import create_prediction_history
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/soil-health-score", tags=["Soil Health Score"])
async def predict_soil_health_score_endpoint(
    request: CropPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Predict a numeric soil health score and save prediction history."""
    try:
        result = predict_soil_health_score(request.dict())

        if current_user and getattr(current_user, "id", None):
            try:
                create_prediction_history(
                    db,
                    {
                        "user_id": current_user.id,
                        "nitrogen": request.nitrogen,
                        "phosphorus": request.phosphorus,
                        "potassium": request.potassium,
                        "ph": request.ph,
                        "temperature": request.temperature,
                        "humidity": request.humidity,
                        "rainfall": request.rainfall,
                        "soil_health_score": result.get("soil_health_score", 85.0),
                    }
                )
            except Exception:
                pass

        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=f"Model files not found: {str(exc)}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(exc)}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(exc)}") from exc
