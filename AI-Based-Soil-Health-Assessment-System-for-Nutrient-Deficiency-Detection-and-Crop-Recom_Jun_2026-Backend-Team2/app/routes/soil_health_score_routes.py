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
        result = predict_soil_health_score(request.model_dump())

        if current_user and getattr(current_user, "id", None):
            try:
                create_prediction_history(
                    db,
                    {
                        "user_id": current_user.id,
                        "soil_type": request.soil_type,
                        "nitrogen": request.nitrogen,
                        "phosphorus": request.phosphorus,
                        "potassium": request.potassium,
                        "ph": request.ph,
                        "organic_carbon": request.organic_carbon,
                        "electrical_conductivity": request.electrical_conductivity,
                        "temperature": request.temperature,
                        "humidity": request.humidity,
                        "soil_health_score": result.get("soil_health_score", 85.0),
                        "prediction_type": "soil_health_score",
                    }
                )
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save prediction history: {str(e)}"
                )

        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=f"Model files not found: {str(exc)}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(exc)}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(exc)}") from exc
