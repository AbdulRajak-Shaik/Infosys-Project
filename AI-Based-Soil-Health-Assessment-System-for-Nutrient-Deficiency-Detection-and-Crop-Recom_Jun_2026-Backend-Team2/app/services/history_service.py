"""Prediction history persistence and retrieval service."""

import json
import os
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.models import ChatHistory, GeneralHistory, PredictionHistory
from app.services.sarvam_service import translate_text


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


def create_general_history(
    db: Session,
    user_id: int,
    module_name: str,
    prediction_type: str,
    input_parameters: Dict[str, Any],
    prediction_result: Dict[str, Any],
    confidence: float | None = None,
    processing_time: float | None = None,
    model_used: str | None = None,
) -> GeneralHistory:
    """Save an activity record to general history."""
    try:
        new_rec = GeneralHistory(
            user_id=user_id,
            module_name=module_name,
            prediction_type=prediction_type,
            input_parameters=input_parameters,
            prediction_result=prediction_result,
            confidence=confidence,
            processing_time=processing_time,
            model_used=model_used
        )
        db.add(new_rec)
        db.commit()
        db.refresh(new_rec)
        return new_rec
    except Exception as exc:
        db.rollback()
        print(f"[ERROR] Failed to save general history: {exc}")
        raise


def get_prediction_history(
    db: Session,
    user_id: int,
    language_id: int | None = 1,
) -> List[Dict[str, Any]]:
    """Return unified prediction history across all modules, translated to the user's preferred language."""
    preds = db.query(PredictionHistory).filter(PredictionHistory.user_id == user_id).all()
    generals = db.query(GeneralHistory).filter(GeneralHistory.user_id == user_id).all()
    chats = db.query(ChatHistory).filter(ChatHistory.user_id == user_id).all()

    combined = []

    def _get_top_crop(recommended_crops: list) -> str | None:
        if not recommended_crops:
            return None
        top_crop = recommended_crops[0]
        if isinstance(top_crop, dict):
            return top_crop.get("crop")
        return str(top_crop)

    # 1. PredictionHistory
    for p in preds:
        top_crop = _get_top_crop(p.recommended_crops)
        pred_type = p.prediction_type or ("crop" if p.recommended_crops else "soil")
        
        # Translate values dynamically if language_id matches
        trans_soil_type = translate_text(p.soil_type, language_id)
        trans_soil_health = translate_text(p.soil_health, language_id)
        trans_soil_fert = translate_text(p.soil_fertility_status, language_id)
        trans_top_crop = translate_text(top_crop, language_id) if top_crop else None
        
        res_text = trans_top_crop or trans_soil_type or translate_text("Soil Analysis", language_id)
        inp_text = translate_text(f"Soil: {p.soil_type}, N:{p.nitrogen} P:{p.phosphorus} K:{p.potassium} pH:{p.ph}", language_id)

        combined.append({
            "id": p.id,
            "history_id": p.id,
            "prediction_type": pred_type,
            "type": "Crop" if (pred_type == "crop") else ("Soil" if pred_type == "soil" else ("Final" if pred_type == "final" else ("Crop" if p.recommended_crops else "Soil"))),
            "prediction_date": p.created_at.isoformat() if p.created_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "date": p.created_at.strftime("%b %d, %Y %I:%M %p") if p.created_at else "Just now",
            "soil_type": trans_soil_type,
            "soil_health": trans_soil_health,
            "soil_health_score": p.soil_health_score,
            "soil_fertility_status": trans_soil_fert,
            "top_crop": trans_top_crop,
            "predicted_crop": trans_top_crop,
            "result": res_text,
            "confidence": int(p.soil_confidence if (p.soil_confidence and p.soil_confidence > 1) else (p.soil_confidence * 100 if p.soil_confidence else 95)),
            "input": inp_text,
            "status": "success",
        })

    # 2. GeneralHistory
    for g in generals:
        p_type = g.prediction_type
        res = g.prediction_result
        inp = g.input_parameters
        
        result_text = "Analysis Successful"
        input_text = "Parameters analyzed"
        
        if p_type == "soil":
            result_text = res.get("soil_type", "Soil Analysis")
            input_text = f"Image: {os.path.basename(inp.get('image_path', 'soil.jpg'))}"
        elif p_type == "crop":
            result_text = res.get("recommended_crop") or (_get_top_crop(res.get("recommended_crops")) or "Crop Recommended")
            input_text = f"Soil: {inp.get('soil_type')}, N:{inp.get('nitrogen')} P:{inp.get('phosphorus')} K:{inp.get('potassium')} pH:{inp.get('ph')}"
        elif p_type == "fertilizer":
            sch = res.get("fertilizer_schedule") or res.get("recommended_fertilizers") or []
            if sch and isinstance(sch[0], dict):
                first_prod = sch[0].get("product") or sch[0].get("fertilizer") or "Fertilizer Schedule"
                result_text = f"{first_prod} recommended"
            else:
                result_text = "Fertilizer Schedule"
            input_text = f"Soil: {inp.get('soil_type')}, Crop: {inp.get('crop') or 'N/A'}, N:{inp.get('nitrogen')} P:{inp.get('phosphorus')} K:{inp.get('potassium')}"
        elif p_type == "disease":
            result_text = res.get("disease_name", "Leaf Blight")
            input_text = f"Image: {os.path.basename(inp.get('image_path', 'leaf.jpg')) if inp.get('image_path') else inp.get('image_name', 'leaf.jpg')}"
        elif p_type == "weather":
            result_text = inp.get("location") or "Weather Forecast"
            input_text = f"Temp: {res.get('temp', 25.0)}°C | Humidity: {res.get('humidity', 60.0)}% | Conditions: {res.get('conditions', 'Clear')}"
        elif p_type == "translation":
            orig = inp.get("original_text", "")
            orig_trunc = orig[:30] + "..." if len(orig) > 30 else orig
            result_text = f"Translated to {inp.get('target_language', 'Hindi')}"
            input_text = f"Source: '{orig_trunc}'"
        elif p_type == "report":
            result_text = res.get("report_name", "AgroAI Report")
            input_text = f"Module: {inp.get('module', 'General')} | Language: {inp.get('report_language', 'English')} | Prediction ID: {inp.get('prediction_id', 1)}"
        elif p_type == "profile":
            field = inp.get("field", "Profile")
            prev_val = inp.get("previous_value", "")
            new_val = res.get("updated_value", "")
            result_text = f"{field} changed"
            input_text = f"Field: {field} | Previous: {prev_val} | Updated: {new_val}"
        elif p_type == "community":
            action = inp.get("action", "Joined Community")
            comm_name = res.get("community_name", "")
            result_text = f"{action}: {comm_name}" if comm_name else action
            input_text = f"Action: {action} | Community: {comm_name}" if comm_name else action
        elif p_type == "login_activity":
            device = inp.get("device", "Desktop")
            browser = inp.get("browser", "Chrome")
            ip_addr = inp.get("ip_address", "127.0.0.1")
            duration = res.get("session_duration", "")
            result_text = f"Logged in from {browser}"
            input_text = f"Device: {device} | Browser: {browser} | IP: {ip_addr}"
            if duration:
                input_text += f" | Duration: {duration}"
        elif p_type == "notification":
            title = inp.get("title", "Alert")
            desc = inp.get("desc", "")
            n_type = inp.get("type", "system")
            result_text = title
            input_text = f"{desc} [Type: {n_type}]"

        conf_val = g.confidence or 100.0
        if conf_val <= 1.0:
            conf_val = conf_val * 100.0

        trans_result = translate_text(result_text, language_id)
        trans_input = translate_text(input_text, language_id)

        combined.append({
            "id": g.id + 10000,
            "history_id": g.id + 10000,
            "prediction_type": p_type,
            "type": p_type.capitalize().replace("_", " "),
            "prediction_date": g.created_at.isoformat() if g.created_at else None,
            "created_at": g.created_at.isoformat() if g.created_at else None,
            "date": g.created_at.strftime("%b %d, %Y %I:%M %p") if g.created_at else "Just now",
            "soil_type": translate_text(inp.get("soil_type") or inp.get("soiltype") or "Loamy", language_id),
            "soil_health": "Optimal" if p_type == "soil" else "Healthy",
            "soil_health_score": 100.0,
            "soil_fertility_status": "High Fertility",
            "top_crop": translate_text(res.get("recommended_crop") or (_get_top_crop(res.get("recommended_crops"))), language_id),
            "predicted_crop": translate_text(res.get("recommended_crop") or (_get_top_crop(res.get("recommended_crops"))), language_id),
            "result": trans_result,
            "confidence": int(conf_val),
            "input": trans_input,
            "status": "success",
        })

    # 3. ChatHistory
    for c in chats:
        try:
            payload = json.loads(c.assistant_response)
            answer = payload.get("assistant_response") or payload.get("response") or c.assistant_response
        except Exception:
            answer = c.assistant_response

        user_loc = "Local Area"
        input_text = f"Question: {c.user_message} | Answer: {answer[:100]}... | Language: {c.preferred_language or 'English'} | Location: {user_loc}"

        trans_answer = translate_text(answer, language_id)
        trans_input = translate_text(input_text, language_id)

        combined.append({
            "id": c.id + 20000,
            "history_id": c.id + 20000,
            "prediction_type": "chatbot",
            "type": "Chatbot",
            "prediction_date": c.created_at.isoformat() if c.created_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "date": c.created_at.strftime("%b %d, %Y %I:%M %p") if c.created_at else "Just now",
            "soil_type": "Loamy",
            "soil_health": "Healthy",
            "soil_health_score": 100.0,
            "soil_fertility_status": "High",
            "top_crop": None,
            "predicted_crop": None,
            "result": trans_answer,
            "confidence": 98,
            "input": trans_input,
            "status": "success",
        })

    combined.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return combined


def get_prediction_history_by_id(
    db: Session,
    user_id: int,
    history_id: int,
) -> Any:
    """Return unified history detail or PredictionHistory when matched."""
    if history_id >= 20000:
        c = db.query(ChatHistory).filter(ChatHistory.id == history_id - 20000, ChatHistory.user_id == user_id).first()
        if not c:
            return None
        return c
    elif history_id >= 10000:
        g = db.query(GeneralHistory).filter(GeneralHistory.id == history_id - 10000, GeneralHistory.user_id == user_id).first()
        if not g:
            return None
        return g
    else:
        return (
            db.query(PredictionHistory)
            .filter(
                PredictionHistory.id == history_id,
                PredictionHistory.user_id == user_id,
            )
            .first()
        )
