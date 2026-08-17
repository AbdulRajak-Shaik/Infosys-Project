"""Reusable nutrient deficiency prediction service."""

import pickle
import traceback
import time
from pathlib import Path
from typing import Any, Dict, Optional, List

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier

from app.services.sarvam_service import translate_text

_MODEL_PATH = Path("app/ml_models/nutrient_deficiency_model.cbm")
_LABEL_ENCODERS_PATH = Path("app/ml_models/label_encoders.pkl")
_FEATURE_META_PATH = Path("app/ml_models/feature_meta.pkl")

_MODEL: Optional[CatBoostClassifier] = None
_LABEL_ENCODERS: Optional[Dict[str, Any]] = None
_FEATURE_META: Optional[Dict[str, Any]] = None

NUTRIENT_CLASS_MAPPING = {
    0: "Nitrogen",
    1: "Nitrogen, Phosphorus",
    2: "Nitrogen, Phosphorus, Potassium",
    3: "Nitrogen, Potassium",
    4: "No_deficiencies",
    5: "Phosphorus",
    6: "Phosphorus, Potassium",
    7: "Potassium",
}


def _load_model_once() -> CatBoostClassifier:
    """Load the nutrient deficiency CatBoost model natively once."""
    global _MODEL

    if _MODEL is None:
        if not _MODEL_PATH.exists():
            raise FileNotFoundError(f"CatBoost model file not found: {_MODEL_PATH}")

        try:
            _MODEL = CatBoostClassifier()
            _MODEL.load_model(str(_MODEL_PATH))
            print(f"[DEBUG] Nutrient deficiency CatBoost model loaded successfully from: {_MODEL_PATH}")
        except Exception as exc:
            raise RuntimeError(f"Failed to load CatBoost model from {_MODEL_PATH}: {exc}") from exc

    return _MODEL


def _load_label_encoders_once() -> Dict[str, Any]:
    """Load label encoders once and reuse them for all predictions."""
    global _LABEL_ENCODERS

    if _LABEL_ENCODERS is None:
        if not _LABEL_ENCODERS_PATH.exists():
            raise FileNotFoundError(f"Label encoders file not found: {_LABEL_ENCODERS_PATH}")

        try:
            with _LABEL_ENCODERS_PATH.open("rb") as handle:
                _LABEL_ENCODERS = pickle.load(handle)
        except (pickle.UnpicklingError, OSError) as exc:
            raise RuntimeError(f"Failed to load label encoders from {_LABEL_ENCODERS_PATH}") from exc

        if not isinstance(_LABEL_ENCODERS, dict):
            raise ValueError("Label encoders file must contain a dictionary.")

        print(f"[DEBUG] Loaded label encoders from {_LABEL_ENCODERS_PATH}: {list(_LABEL_ENCODERS.keys())}")

    return _LABEL_ENCODERS


def _load_feature_meta_once() -> Dict[str, Any]:
    """Load feature metadata once and reuse it for all predictions."""
    global _FEATURE_META

    if _FEATURE_META is None:
        if not _FEATURE_META_PATH.exists():
            raise FileNotFoundError(f"Feature metadata file not found: {_FEATURE_META_PATH}")

        try:
            with _FEATURE_META_PATH.open("rb") as handle:
                _FEATURE_META = pickle.load(handle)
        except (pickle.UnpicklingError, OSError) as exc:
            raise RuntimeError(f"Failed to load feature metadata from {_FEATURE_META_PATH}") from exc

        if not isinstance(_FEATURE_META, dict):
            raise ValueError("Feature metadata must contain a dictionary.")

        print(f"[DEBUG] Loaded feature metadata from {_FEATURE_META_PATH}: {_FEATURE_META}")

    return _FEATURE_META


def predict_nutrient_deficiency(
    data: Dict[str, Any],
    language_id: int | None = None,
) -> Dict[str, Any]:
    """Predict nutrient deficiencies from soil and environmental features using fertilizer_model.cbm."""
    try:
        # Load native fertilizer model cbm
        model_path = Path("app/ml_models/fertilizer_model.cbm")
        if not model_path.exists():
            raise FileNotFoundError(f"Fertilizer model weights not found at {model_path}")
        
        model = CatBoostClassifier()
        model.load_model(str(model_path))

        feature_meta = _load_feature_meta_once()

        feature_order = feature_meta.get("input_features", feature_meta.get("feature_order"))
        if not isinstance(feature_order, list) or not feature_order:
            raise ValueError("Feature metadata must define a non-empty input_features list.")

        categorical_inputs = feature_meta.get("categorical_inputs", [])
        if not isinstance(categorical_inputs, list):
            raise ValueError("Feature metadata categorical_inputs must be a list.")

        normalized_data = {
            key.replace("_", "").lower(): value
            for key, value in data.items()
        }

        # Map soil_type correctly
        soil_key_norm = "soiltype"
        if soil_key_norm in normalized_data and normalized_data[soil_key_norm] is not None:
            from app.services.crop_service import map_soil_type_for_catboost
            normalized_data[soil_key_norm] = map_soil_type_for_catboost(normalized_data[soil_key_norm])

        # Fill defaults
        if "organiccarbon" not in normalized_data:
            normalized_data["organiccarbon"] = 0.62
        if "electricalconductivity" not in normalized_data:
            normalized_data["electricalconductivity"] = 0.41

        features: Dict[str, Any] = {}
        for feature in feature_order:
            normalized_feature = feature.replace("_", "").lower()
            if normalized_feature not in normalized_data or normalized_data[normalized_feature] is None:
                raise ValueError(f"Missing feature: {feature}")

            value = normalized_data[normalized_feature]
            if feature in categorical_inputs:
                features[feature] = value
            else:
                features[feature] = float(value)

        feature_frame = pd.DataFrame([features], columns=feature_order)

        start_time = time.time()
        prediction = model.predict(feature_frame)
        latency_ms = int((time.time() - start_time) * 1000)

        predicted_value = np.asarray(prediction).reshape(-1)[0]
        
        # Class decoding
        label_encoders = _load_label_encoders_once()
        nutrient_encoder = label_encoders.get("Nutrient_Deficiencies")
        if nutrient_encoder is not None:
            predicted_deficiencies = nutrient_encoder.inverse_transform([int(predicted_value)])[0]
        else:
            predicted_deficiencies = NUTRIENT_CLASS_MAPPING.get(int(predicted_value))
            if predicted_deficiencies is None:
                raise RuntimeError(f"Unknown nutrient deficiency class: {predicted_value}")

        nutrient_labels = [nutrient.strip() for nutrient in str(predicted_deficiencies).split(",") if nutrient.strip() != "No_deficiencies"]

        n_in = float(normalized_data.get("nitrogen", 90))
        p_in = float(normalized_data.get("phosphorus", 42))
        k_in = float(normalized_data.get("potassium", 43))

        # Safeguard: if input nutrients are below standard agricultural thresholds, ensure they are flagged as deficient
        if n_in < 80.0 and "Nitrogen" not in nutrient_labels:
            nutrient_labels.append("Nitrogen")
        if p_in < 30.0 and "Phosphorus" not in nutrient_labels:
            nutrient_labels.append("Phosphorus")
        if k_in < 30.0 and "Potassium" not in nutrient_labels:
            nutrient_labels.append("Potassium")

        deficiencies = [
            {"nutrient": translate_text(nutrient.strip(), language_id)}
            for nutrient in nutrient_labels
        ]

        # Calculate NPK ratio based on deficient target needs (120:60:50)
        n_need = max(0.0, 120.0 - n_in)
        p_need = max(0.0, 60.0 - p_in)
        k_need = max(0.0, 50.0 - k_in)
        if not nutrient_labels or (n_need == 0 and p_need == 0 and k_need == 0):
            npk_ratio = "4:2:1 (Balanced Maintenance)"
        else:
            parts = [n_need, p_need, k_need]
            non_zeros = [v for v in parts if v > 0]
            if non_zeros:
                min_val = min(non_zeros)
                r_n = round(n_need / min_val, 1)
                r_p = round(p_need / min_val, 1)
                r_k = round(k_need / min_val, 1)
                npk_ratio = f"{r_n}:{r_p}:{r_k}"
            else:
                npk_ratio = "4:2:1"

        # Build recommendations scientifically
        recommended_fertilizers = []
        fertilizer_schedule = []

        # Only recommend fertilizers if there are deficiencies detected
        if nutrient_labels:
            # Always include Farm Yard Manure (FYM)
            organic_rec = {
                "category": translate_text("Organic", language_id),
                "product": translate_text("Farm Yard Manure", language_id),
                "fertilizer": translate_text("Farm Yard Manure (FYM) / Compost", language_id),
                "nutrient_deficiency": translate_text("None", language_id),
                "dosage": "2 tons/acre",
                "stage": translate_text("Before Sowing", language_id),
                "method": translate_text("Soil Mix", language_id),
                "reason": translate_text("To improve soil organic matter, water retention, and microbial activity.", language_id)
            }
            recommended_fertilizers.append({
                "category": organic_rec["category"],
                "fertilizer": organic_rec["fertilizer"],
                "dosage": organic_rec["dosage"],
                "method": organic_rec["method"]
            })
            fertilizer_schedule.append(organic_rec)

        for nutrient in nutrient_labels:
            nut_lower = nutrient.lower()
            if "nitrogen" in nut_lower:
                dose_val = max(25, int(round((120.0 - n_in) * 2.17)))
                rec = {
                    "category": translate_text("Nitrogen", language_id),
                    "product": translate_text("Urea", language_id),
                    "fertilizer": translate_text("Urea (46% N)", language_id),
                    "nutrient_deficiency": translate_text("Nitrogen deficiency", language_id),
                    "dosage": f"{dose_val} kg/acre",
                    "stage": translate_text("Vegetative", language_id),
                    "method": translate_text("Split Dose", language_id),
                    "reason": translate_text("To supplement soil nitrogen levels for healthy vegetative growth.", language_id)
                }
                recommended_fertilizers.append({
                    "category": rec["category"],
                    "fertilizer": rec["fertilizer"],
                    "dosage": rec["dosage"],
                    "method": rec["method"]
                })
                fertilizer_schedule.append(rec)
            elif "phosphorus" in nut_lower:
                dose_val = max(20, int(round((60.0 - p_in) * 2.17)))
                rec = {
                    "category": translate_text("Phosphorus", language_id),
                    "product": translate_text("DAP", language_id),
                    "fertilizer": translate_text("DAP (Di-ammonium Phosphate)", language_id),
                    "nutrient_deficiency": translate_text("Phosphorus deficiency", language_id),
                    "dosage": f"{dose_val} kg/acre",
                    "stage": translate_text("Basal", language_id),
                    "method": translate_text("Before Sowing", language_id),
                    "reason": translate_text("To promote strong root establishment and early plant vigor.", language_id)
                }
                recommended_fertilizers.append({
                    "category": rec["category"],
                    "fertilizer": rec["fertilizer"],
                    "dosage": rec["dosage"],
                    "method": rec["method"]
                })
                fertilizer_schedule.append(rec)
            elif "potassium" in nut_lower:
                dose_val = max(25, int(round((50.0 - k_in) * 1.67)))
                rec = {
                    "category": translate_text("Potassium", language_id),
                    "product": translate_text("MOP", language_id),
                    "fertilizer": translate_text("MOP (Muriate of Potash)", language_id),
                    "nutrient_deficiency": translate_text("Potassium deficiency", language_id),
                    "dosage": f"{dose_val} kg/acre",
                    "stage": translate_text("Flowering", language_id),
                    "method": translate_text("Broadcast", language_id),
                    "reason": translate_text("To enhance disease resistance, water regulation, and fruit quality.", language_id)
                }
                recommended_fertilizers.append({
                    "category": rec["category"],
                    "fertilizer": rec["fertilizer"],
                    "dosage": rec["dosage"],
                    "method": rec["method"]
                })
                fertilizer_schedule.append(rec)

        # Dynamic Advisory Notes
        advisory_notes = []
        soil_type = data.get("soil_type") or data.get("soiltype") or "Loamy"
        
        # Soil Type specific notes
        if "sandy" in soil_type.lower():
            advisory_notes.append("Increase irrigation frequency due to low water retention of Sandy soil.")
            advisory_notes.append("Apply MOP during flowering stage to boost crop yield.")
            advisory_notes.append("Use organic compost to improve soil moisture retention.")
        elif "black" in soil_type.lower():
            advisory_notes.append("Reduce irrigation frequency since Black soil has high clay content.")
            advisory_notes.append("Split nitrogen application into two doses for optimal uptake.")
            advisory_notes.append("Avoid waterlogging by ensuring proper drainage channels.")
        elif "clay" in soil_type.lower():
            advisory_notes.append("Maintain proper drainage to prevent waterlogging in Clayey soil.")
            advisory_notes.append("Avoid working on wet soil to prevent heavy soil compaction.")
            advisory_notes.append("Apply gypsum to improve soil aeration and aggregate stability.")
        elif "loamy" in soil_type.lower():
            advisory_notes.append("Maintain balanced organic matter input to preserve Loamy soil quality.")
            advisory_notes.append("Rotate crops regularly to preserve soil nutrient balance.")
            advisory_notes.append("Monitor soil pH periodically and adjust using amendments.")
        elif "alluvial" in soil_type.lower():
            advisory_notes.append("Alluvial soil has excellent structure; ideal for crop rotation.")
            advisory_notes.append("Keep check of organic carbon content via green manuring.")
            advisory_notes.append("Basal application of Phosphorus & Potassium is highly recommended.")
        else: # silty or others
            advisory_notes.append("Silty soil is highly fertile but prone to surface crusting; avoid overhead irrigation.")
            advisory_notes.append("Incorporate organic matter to stabilize silty soil structure.")
            advisory_notes.append("Protect soil surface with mulching to avoid erosion.")

        # Nutrient levels
        if n_in < 50:
            advisory_notes.append("Soil nitrogen is low. Ensure timely split application of Nitrogen supplement.")
        if p_in < 30:
            advisory_notes.append("Soil phosphorus levels are low; basal DAP dosage is critical for root system.")
        if k_in < 30:
            advisory_notes.append("Soil potassium levels are low; MOP will enhance stress resistance.")
        
        ph_val = float(normalized_data.get("ph", 6.5))
        if ph_val < 5.5:
            advisory_notes.append("Acidic soil detected. Consider adding lime to neutralize acidity.")
        elif ph_val > 8.0:
            advisory_notes.append("Alkaline soil detected. Add organic manure or gypsum to buffer pH.")
            
        temp_val = float(normalized_data.get("temperature", 25))
        hum_val = float(normalized_data.get("humidity", 60))
        if temp_val > 35:
            advisory_notes.append("High ambient temperature detected. Ensure morning or late-evening irrigation to prevent evaporation.")
        if hum_val > 80:
            advisory_notes.append("High humidity levels may increase susceptibility to fungal diseases. Monitor crops closely.")

        # Print FERTILIZER MODEL DEBUG block exactly as required by specifications
        print("============================")
        print("FERTILIZER MODEL DEBUG")
        print("============================")
        print("\nModel Loaded")
        print("fertilizer_model.cbm\n")
        print("Input Features\n")
        print("Soil Type")
        print("Nitrogen")
        print("Phosphorus")
        print("Potassium")
        print("pH")
        print("Temperature")
        print("Humidity")
        print("Rainfall\n")
        print("Prediction\n")
        print(f"{predicted_deficiencies}\n")
        print("Recommended Fertilizers\n")
        for rec in fertilizer_schedule:
            print(rec["product"])
        print("\nStatus\n")
        print("SUCCESS")
        print("============================")

        return {
            "deficiencies": deficiencies,
            "recommended_fertilizers": recommended_fertilizers,
            "fertilizer_schedule": fertilizer_schedule,
            "advisory_notes": advisory_notes,
            "npk_ratio": npk_ratio
        }

    except Exception as exc:
        print("============================")
        print("FERTILIZER MODEL DEBUG")
        print("============================")
        print("\nModel Loaded")
        print("fertilizer_model.cbm\n")
        print("Status\n")
        print(f"FAILED: {exc}")
        print("============================")
        raise exc

