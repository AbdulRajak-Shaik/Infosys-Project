"""Soil health API routes."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import get_current_user, get_db
from app.models import User
from app.services.soil_health_service import predict_soil_health
from app.services.history_service import create_prediction_history
from sqlalchemy.orm import Session


router = APIRouter()


class SoilHealthRequest(BaseModel):
    """Request model for soil health prediction."""

    soil_type: str = Field(..., description="Type of soil (e.g., 'Clayey', 'Sandy', 'Loamy')")
    nitrogen: float = Field(..., ge=0, description="Nitrogen content (N) in kg/ha")
    phosphorus: float = Field(..., ge=0, description="Phosphorus content (P) in kg/ha")
    potassium: float = Field(..., ge=0, description="Potassium content (K) in kg/ha")
    ph: float = Field(..., ge=0, le=14, description="Soil pH value (0-14)")
    organic_carbon: float = Field(..., description="Organic carbon content")
    electrical_conductivity: float = Field(..., description="Electrical conductivity")
    temperature: float = Field(..., ge=-50, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage (0-100)")


@router.post("/soil-health", tags=["Soil Health"])
async def predict_soil_health_status(
    request: SoilHealthRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Predict soil health based on soil and environmental conditions and save prediction history."""
    try:
        request_data = request.dict()
        result = predict_soil_health(request_data, current_user.language_id)

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
                        "soil_health": result.get("soil_health", "Optimal"),
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
