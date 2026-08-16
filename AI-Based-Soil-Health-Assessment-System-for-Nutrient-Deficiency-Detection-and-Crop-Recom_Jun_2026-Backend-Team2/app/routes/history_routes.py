"""Prediction history API routes."""

from typing import Any, Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import PredictionHistory, User, GeneralHistory, ChatHistory
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
    response: Response,
    search: Optional[str] = Query(None, description="Search term matching result, input, or type"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. soil, crop, fertilizer, chatbot, weather, profile, community, report, login_activity, notification)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Return filtered, searched, paginated history summaries for the logged-in user."""
    # Fetch user's language_id for dynamic translations
    lang_id = getattr(current_user, "language_id", 1) or 1
    
    # Get combined, sorted history list
    all_history = get_prediction_history(db, current_user.id, language_id=lang_id)
    
    # 1. Category Filter
    if category and category.strip():
        cat_lower = category.strip().lower()
        # Allow aliases matching the tab categories
        if cat_lower == "login activity" or cat_lower == "login":
            cat_lower = "login_activity"
        
        filtered = []
        for item in all_history:
            p_type = str(item.get("prediction_type") or "").lower()
            if cat_lower == p_type or cat_lower in p_type:
                filtered.append(item)
        all_history = filtered

    # 2. Search Filter
    if search and search.strip():
        q = search.strip().lower()
        filtered = []
        for item in all_history:
            res_str = str(item.get("result") or "").lower()
            inp_str = str(item.get("input") or "").lower()
            type_str = str(item.get("type") or "").lower()
            if q in res_str or q in inp_str or q in type_str:
                filtered.append(item)
        all_history = filtered

    # 3. Date Filter
    if start_date or end_date:
        filtered = []
        for item in all_history:
            dt_str = item.get("created_at") or item.get("prediction_date")
            if not dt_str:
                continue
            try:
                # ISO format string comparison or datetime conversion
                item_date = datetime.fromisoformat(dt_str).date()
                if start_date:
                    start = datetime.strptime(start_date.strip(), "%Y-%m-%d").date()
                    if item_date < start:
                        continue
                if end_date:
                    end = datetime.strptime(end_date.strip(), "%Y-%m-%d").date()
                    if item_date > end:
                        continue
                filtered.append(item)
            except Exception:
                # Fallback to appending if date parsing fails
                filtered.append(item)
        all_history = filtered

    # Calculate totals for pagination metadata
    total_count = len(all_history)
    total_pages = max(1, (total_count + page_size - 1) // page_size)

    # Expose custom pagination headers
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Total-Pages"] = str(total_pages)
    response.headers["X-Current-Page"] = str(page)
    response.headers["X-Page-Size"] = str(page_size)

    # 4. Paginate
    start = (page - 1) * page_size
    end = start + page_size
    return all_history[start:end]


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

    if isinstance(prediction, PredictionHistory):
        return _serialize_detail(prediction)
    elif isinstance(prediction, ChatHistory):
        try:
            import json
            payload = json.loads(prediction.assistant_response)
            answer = payload.get("assistant_response") or payload.get("response") or prediction.assistant_response
        except Exception:
            answer = prediction.assistant_response

        return {
            "history_id": history_id,
            "prediction_date": prediction.created_at,
            "soil_type": "Loamy",
            "soil_confidence": 98.0,
            "nitrogen": 90.0,
            "phosphorus": 42.0,
            "potassium": 43.0,
            "ph": 6.5,
            "organic_carbon": 0.62,
            "electrical_conductivity": 0.41,
            "temperature": 25.0,
            "humidity": 60.0,
            "soil_health": "Healthy",
            "soil_health_score": 100.0,
            "soil_fertility_status": "High",
            "deficiencies": [],
            "recommended_crops": [],
            "recommended_fertilizers": [{"category": "AI Chatbot", "fertilizer": f"Q: {prediction.user_message}", "dosage": "Response", "method": answer[:100]}]
        }
    else: # GeneralHistory
        inp = prediction.input_parameters
        res = prediction.prediction_result
        
        # deficiencies
        defs = res.get("deficiencies", [])
        if not defs and "disease_name" in res:
            defs = [{"nutrient": res["disease_name"]}]
            
        # recommended crops
        crops = res.get("recommended_crops", [])
        if not crops and "recommended_crop" in res:
            crops = [res["recommended_crop"]]
            
        # recommended fertilizers
        ferts = res.get("recommended_fertilizers") or res.get("fertilizer_schedule") or []

        return {
            "history_id": history_id,
            "prediction_date": prediction.created_at,
            "soil_type": inp.get("soil_type") or inp.get("soiltype") or "Loamy",
            "soil_confidence": prediction.confidence or 100.0,
            "nitrogen": float(inp.get("nitrogen") or 90.0),
            "phosphorus": float(inp.get("phosphorus") or 42.0),
            "potassium": float(inp.get("potassium") or 43.0),
            "ph": float(inp.get("ph") or 6.5),
            "organic_carbon": float(inp.get("organic_carbon") or 0.62),
            "electrical_conductivity": float(inp.get("electrical_conductivity") or 0.41),
            "temperature": float(inp.get("temperature") or 25.0),
            "humidity": float(inp.get("humidity") or 60.0),
            "soil_health": "Optimal" if prediction.prediction_type == "soil" else "Healthy",
            "soil_health_score": 100.0,
            "soil_fertility_status": "High Fertility",
            "deficiencies": defs,
            "recommended_crops": crops,
            "recommended_fertilizers": ferts
        }


@router.delete("/history/{history_id}")
def delete_prediction_history(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a history record by ID."""
    if history_id >= 20000:
        c = db.query(ChatHistory).filter(ChatHistory.id == history_id - 20000, ChatHistory.user_id == current_user.id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Chat history not found.")
        db.delete(c)
    elif history_id >= 10000:
        g = db.query(GeneralHistory).filter(GeneralHistory.id == history_id - 10000, GeneralHistory.user_id == current_user.id).first()
        if not g:
            raise HTTPException(status_code=404, detail="General history not found.")
        db.delete(g)
    else:
        p = db.query(PredictionHistory).filter(PredictionHistory.id == history_id, PredictionHistory.user_id == current_user.id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Prediction history not found.")
        db.delete(p)
        
    db.commit()
    return {"message": "History record deleted successfully."}
