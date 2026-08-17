"""Nutrient deficiency analysis API routes."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import get_current_user, get_db
from app.models import User
from app.services.nutrient_service import predict_nutrient_deficiency
from app.services.history_service import create_prediction_history
from sqlalchemy.orm import Session

router = APIRouter()


class NutrientAnalysisRequest(BaseModel):
    """Request model for nutrient deficiency analysis."""

    soil_type: str = Field(..., description="Type of soil (e.g., 'Clayey', 'Sandy', 'Loamy')")
    nitrogen: float = Field(..., ge=0, description="Nitrogen content (N) in kg/ha")
    phosphorus: float = Field(..., ge=0, description="Phosphorus content (P) in kg/ha")
    potassium: float = Field(..., ge=0, description="Potassium content (K) in kg/ha")
    ph: float = Field(..., ge=0, le=14, description="Soil pH value (0-14)")
    organic_carbon: float = Field(..., description="Organic carbon content")
    electrical_conductivity: float = Field(..., description="Electrical conductivity")
    temperature: float = Field(..., ge=-50, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")


@router.post("/nutrient-analysis", tags=["Nutrient Analysis"])
@router.post("/predict-nutrient-deficiency", tags=["Nutrient Analysis"])
@router.post("/fertilizer-recommendation", tags=["Nutrient Analysis"])
@router.post("/recommend-fertilizer", tags=["Nutrient Analysis"])
async def analyze_nutrients(
    request: NutrientAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Analyze soil inputs, return predicted nutrient deficiencies and save prediction history."""
    try:
        request_data = request.model_dump()
        result = predict_nutrient_deficiency(request_data, current_user.language_id)

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
                        "nutrient_deficiencies": result.get("deficiencies", []),
                        "recommended_fertilizers": result.get("recommended_fertilizers", ["NPK 10:26:26", "Urea"]),
                        "prediction_type": "FERTILIZER_RECOMMENDATION",
                    }
                )
                from app.services.history_service import create_general_history
                create_general_history(
                    db=db,
                    user_id=current_user.id,
                    module_name="Fertilizer Advisory",
                    prediction_type="FERTILIZER_RECOMMENDATION",
                    input_parameters=request_data,
                    prediction_result=result,
                    confidence=94.0,
                    processing_time=0.03,
                    model_used="Fertilizer Expert System"
                )
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save nutrient/fertilizer history: {str(e)}"
                )

        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=f"Model files not found: {str(exc)}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(exc)}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=f"Nutrient analysis failed: {str(exc)}") from exc
