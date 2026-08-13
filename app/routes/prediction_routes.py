"""Image prediction API routes for soil classification."""

import os
import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.dependencies import get_current_user, get_db
from app.models import User
from app.services.image_service import predict_soil
from app.services.history_service import create_prediction_history
from sqlalchemy.orm import Session


router = APIRouter()

_UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/predict", tags=["Prediction"])
@router.post("/predict-image", tags=["Prediction"])
async def predict_image(
    file: UploadFile | None = File(None),
    current_user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Accept an uploaded soil image and return a prediction payload."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file provided. Please upload a soil image.")

    temp_file_path = None
    try:
        temp_file_path = _UPLOADS_DIR / f"{file.filename}"
        with temp_file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        lang_id = getattr(current_user, "language_id", 1) if current_user else 1
        result = predict_soil(str(temp_file_path), lang_id)

        # Save to prediction_history in database if user is authenticated
        if current_user and getattr(current_user, "id", None):
            try:
                create_prediction_history(
                    db,
                    {
                        "user_id": current_user.id,
                        "soil_image_path": str(temp_file_path),
                        "soil_type": result.get("canonical_soil_type", result["soil_type"]),
                        "soil_confidence": result.get("confidence", 95.0),
                        "recommended_crops": result.get("recommended_crops", ["Wheat", "Rice"]),
                        "nutrient_deficiencies": result.get("nutrient_deficiencies", ["Nitrogen"]),
                    }
                )
            except Exception as e:
                print("Error saving prediction history:", e)

        return {
            "soil_type": result["soil_type"],
            "confidence": result["confidence"],
            "canonical_soil_type": result.get("canonical_soil_type", result["soil_type"]),
            "probabilities": result.get("probabilities", {}),
        }
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Image file not found.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if temp_file_path and temp_file_path.exists():
            temp_file_path.unlink(missing_ok=True)
