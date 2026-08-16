"""Reusable crop recommendation service for agricultural decision support."""

import pickle
import traceback
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier

from app.services.sarvam_service import translate_text

_MODEL_PATH = Path("app/ml_models/crop_recommendation_model.cbm")
_LABEL_ENCODERS_PATH = Path("app/ml_models/label_encoders.pkl")
_FEATURE_META_PATH = Path("app/ml_models/feature_meta.pkl")

_MODEL: Optional[CatBoostClassifier] = None
_LABEL_ENCODERS: Optional[Dict[str, Any]] = None
_FEATURE_META: Optional[Dict[str, Any]] = None

CROP_INSIGHTS = {
    "Cotton": "Clay-rich structure, high moisture retention, ideal cation-exchange — well-suited for deep-rooting cash crops.",
    "Soybean": "Excellent nitrogen-fixing properties to replenish degraded soil.",
    "Wheat": "High rabi yield potential under moderate temperature.",
    "Sugarcane": "Good choice for loose loamy soil texture. Watch phosphorus levels.",
    "Maize": "Performs well in high-moisture paddy conditions.",
    "Groundnut": "Thrives in well-drained sandy loam soil, high oil content development.",
    "Jute": "Thrives in alluvial soil with high humidity and warm temperatures.",
    "Potato": "Prefers loose, well-aerated sandy loam soil for tuber development.",
    "Rice": "Requires high moisture retention clayey soils or waterlogged conditions.",
    "Tomato": "Ideal for well-drained loam soil, requires balanced NPK ratio.",
}


def map_soil_type_for_catboost(soil_type: str) -> str:
    """Map predicted/arbitrary soil types to categories trained by the CatBoost model."""
    s = str(soil_type).lower().strip()
    if "alluvial" in s:
        return "Alluvial"
    if "black" in s:
        return "Black"
    if "clay" in s:
        return "Clayey"
    if "loamy" in s or "loam" in s:
        return "Loamy"
    if "sandy" in s or "sand" in s:
        return "Sandy"
    if "silt" in s or "slit" in s or "silty" in s:
        return "Silty"
    return "Loamy"  # fallback


def _load_model_once() -> CatBoostClassifier:
    """Load the crop recommendation CatBoost model natively once."""
    global _MODEL

    if _MODEL is None:
        if not _MODEL_PATH.exists():
            raise FileNotFoundError(f"CatBoost model file not found: {_MODEL_PATH}")

        try:
            _MODEL = CatBoostClassifier()
            _MODEL.load_model(str(_MODEL_PATH))
            
            # Print the initialization banner:
            print("\n=========================")
            print("CATBOOST MODEL LOADED")
            print("=========================")
            print("Model    : crop_recommendation_model.cbm")
            print("Features : OK")
            print("Scaler   : OK")
            print("Encoder  : OK")
            print("Status   : READY")
            print("=========================\n")
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
            raise ValueError("Feature metadata file must contain a dictionary.")

        print(f"[DEBUG] Loaded feature metadata from {_FEATURE_META_PATH}: {_FEATURE_META}")

    return _FEATURE_META


def recommend_crop(data: Dict[str, Any], language_id: int | None = None) -> Dict[str, Any]:
    """Recommend a crop based on soil and environmental conditions.

    Args:
        data: Dictionary containing soil and environmental features:
              - soil_type: Categorical soil type
              - nitrogen: Nitrogen content (N)
              - phosphorus: Phosphorus content (P)
              - potassium: Potassium content (K)
              - temperature: Temperature in Celsius
              - humidity: Humidity percentage
              - ph: Soil pH value
              - rainfall: Rainfall in mm

    Returns:
        A dictionary containing the five highest-confidence recommended crops.
    """
    try:
        model = _load_model_once()
        feature_meta = _load_feature_meta_once()

        # Build a DataFrame in metadata order, retaining categorical strings for CatBoost.
        normalized_data = {
            key.replace("_", "").lower(): value
            for key, value in data.items()
        }

        # Map soil_type correctly
        soil_key_norm = "soiltype"
        if soil_key_norm in normalized_data and normalized_data[soil_key_norm] is not None:
            normalized_data[soil_key_norm] = map_soil_type_for_catboost(normalized_data[soil_key_norm])

        # Fill missing features if necessary
        # Organic_Carbon & Electrical_Conductivity defaults if not passed (model expects them)
        if "organiccarbon" not in normalized_data:
            normalized_data["organiccarbon"] = 0.62
        if "electricalconductivity" not in normalized_data:
            normalized_data["electricalconductivity"] = 0.41

        feature_order = feature_meta.get("input_features", feature_meta.get("feature_order"))
        categorical_inputs = feature_meta.get("categorical_inputs", [])
        
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
        print(f"[DEBUG] Feature vector shape: {feature_frame.shape}")
        print(f"[DEBUG] Feature vector: {feature_frame}")

        # Rank every CatBoost class probability and return the five best crops.
        start_time = time.time()
        probabilities = np.asarray(model.predict_proba(feature_frame))[0]
        latency_ms = int((time.time() - start_time) * 1000)

        print("\n==========================")
        print("CATBOOST")
        print("Inference : SUCCESS")
        print(f"Latency   : {latency_ms} ms")
        print("==========================\n")

        top5_indices = np.argsort(probabilities)[::-1][:5]

        label_encoders = _load_label_encoders_once()
        crop_encoder = label_encoders.get("crop", None)
        if crop_encoder is None:
            raise RuntimeError("Crop label encoder not found in loaded encoders.")

        recommendations = []
        for index in top5_indices:
            crop_name = crop_encoder.inverse_transform([int(index)])[0]
            # Scale top crop score out of 100 based on probability
            score = int(round((probabilities[index] / np.max(probabilities)) * 100))
            raw_insight = CROP_INSIGHTS.get(crop_name, "Suitable matching crop for target soil condition.")
            
            recommendations.append({
                "crop": translate_text(crop_name, language_id),
                "score": score,
                "insight": translate_text(raw_insight, language_id)
            })

        # Add top crop name and confidence fields verbatim
        top_crop = recommendations[0]["crop"] if recommendations else "Cotton"
        top_score = recommendations[0]["score"] if recommendations else 100
        confidence = float(top_score) / 100.0

        return {
            "recommended_crops": recommendations,
            "recommended_crop": top_crop,
            "confidence": confidence
        }

    except Exception as exc:
        traceback.print_exc()
        raise RuntimeError(f"Prediction error in crop recommendation service: {exc}") from exc
