"""Crop recommendation API routes."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import get_current_user, get_db
from app.models import User
from app.services.crop_service import recommend_crop
from app.services.history_service import create_prediction_history
from sqlalchemy.orm import Session

router = APIRouter()


class CropPredictionRequest(BaseModel):
    """Request model for crop recommendation."""

    soil_type: str = Field(..., description="Type of soil (e.g., 'Clayey', 'Sandy', 'Loamy')")
    nitrogen: float = Field(..., ge=0, description="Nitrogen content (N) in kg/ha")
    phosphorus: float = Field(..., ge=0, description="Phosphorus content (P) in kg/ha")
    potassium: float = Field(..., ge=0, description="Potassium content (K) in kg/ha")
    ph: float = Field(..., ge=0, le=14, description="Soil pH value (0-14)")
    organic_carbon: float = Field(..., description="Organic carbon content")
    electrical_conductivity: float = Field(..., description="Electrical conductivity")
    temperature: float = Field(..., ge=-50, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage (0-100)")


@router.post("/predict-crop", tags=["Crop Recommendation"])
@router.post("/recommend-crop", tags=["Crop Recommendation"])
async def predict_crop(
    request: CropPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Recommend a crop based on soil and environmental conditions and save to history."""
    try:
        request_data = request.model_dump()
        result = recommend_crop(request_data, current_user.language_id)

        # Trigger nutrient/fertilizer analysis and merge results
        from app.services.nutrient_service import predict_nutrient_deficiency
        try:
            fert_res = predict_nutrient_deficiency(request_data, current_user.language_id)
            result["recommended_fertilizers"] = fert_res.get("recommended_fertilizers", [])
            result["fertilizer_schedule"] = fert_res.get("fertilizer_schedule", [])
            result["deficiencies"] = fert_res.get("deficiencies", [])
            result["advisory_notes"] = fert_res.get("advisory_notes", [])
        except Exception as e:
            print(f"[ERROR] Crop recommendation fertilizer analysis failed: {e}")
            result["recommended_fertilizers"] = []
            result["fertilizer_schedule"] = []
            result["deficiencies"] = []
            result["advisory_notes"] = []

        # Save prediction into general_history table
        if current_user and getattr(current_user, "id", None):
            try:
                from app.services.history_service import create_general_history
                # Save as crop module prediction
                create_general_history(
                    db,
                    user_id=current_user.id,
                    module_name="Crop Recommendation",
                    prediction_type="CROP_RECOMMENDATION",
                    input_parameters=request_data,
                    prediction_result={
                        "recommended_crops": result.get("recommended_crops", []),
                        "recommended_crop": result.get("recommended_crop", "Cotton"),
                        "confidence": result.get("confidence", 0.96),
                        "recommended_fertilizers": result["recommended_fertilizers"],
                        "fertilizer_schedule": result["fertilizer_schedule"]
                    },
                    confidence=result.get("confidence", 0.96),
                    processing_time=0.05,
                    model_used="CatBoost"
                )
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save crop prediction history: {str(e)}"
                )

        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=f"Model files not found: {str(exc)}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(exc)}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(exc)}") from exc
