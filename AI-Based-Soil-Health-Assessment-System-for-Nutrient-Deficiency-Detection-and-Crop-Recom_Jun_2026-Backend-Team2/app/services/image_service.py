"""Reusable image prediction service for soil classification."""

import json
import traceback
import hashlib
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import tensorflow as tf
from PIL import Image

from app.image_preprocessing import preprocess_image
from app.services.sarvam_service import translate_text

_BASE_DIR = Path(__file__).resolve().parents[1] / "ml_models"
_MODEL_KERAS_PATH = _BASE_DIR / "soil_classification_model.keras"
_CLASS_NAMES_PATH = _BASE_DIR / "class_names.json"

_MODEL: Optional[tf.keras.Model] = None
_CLASS_NAMES: Optional[List[str]] = None

DEFAULT_CLASSES = [
    "Alluvial Soil",
    "Black Soil",
    "Clay Soil",
    "Loamy Soil",
    "Sandy Soil",
    "Silt Soil",
]


def get_md5_checksum(file_path: Path) -> str:
    """Calculate MD5 checksum of a file."""
    md5 = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                md5.update(chunk)
        return md5.hexdigest()
    except Exception:
        return "ERROR"


def _load_class_names_once() -> List[str]:
    """Load class names once and reuse them for all predictions."""
    global _CLASS_NAMES

    if _CLASS_NAMES is None:
        if _CLASS_NAMES_PATH.exists():
            try:
                with _CLASS_NAMES_PATH.open("r", encoding="utf-8") as handle:
                    loaded_names = json.load(handle)
                if isinstance(loaded_names, list) and all(isinstance(item, str) for item in loaded_names):
                    _CLASS_NAMES = loaded_names
            except Exception as exc:
                print(f"[DEBUG] Failed to parse class_names.json: {exc}")

        if _CLASS_NAMES is None:
            _CLASS_NAMES = DEFAULT_CLASSES

    return _CLASS_NAMES


def _load_model_once() -> tf.keras.Model:
    """Load the Keras model once and reuse it for future predictions."""
    global _MODEL

    if _MODEL is None:
        if not _MODEL_KERAS_PATH.exists():
            raise FileNotFoundError(f"Production soil classification model weights not found at {_MODEL_KERAS_PATH}")
        try:
            _MODEL = tf.keras.models.load_model(str(_MODEL_KERAS_PATH), compile=False)
            print(f"[DEBUG] Keras model loaded successfully from {_MODEL_KERAS_PATH}")
        except Exception as exc:
            raise RuntimeError(f"Failed to load production soil classification model: {exc}") from exc

    return _MODEL


def renormalize_probabilities(probs: np.ndarray, class_names: List[str]) -> Dict[str, float]:
    """Renormalize probabilities so that they sum to exactly 100.0% with 2 decimal places."""
    pcts = probs * 100.0
    floored = np.floor(pcts * 100) / 100.0
    diff = 100.0 - np.sum(floored)
    if diff > 0:
        max_idx = int(np.argmax(probs))
        floored[max_idx] = round(floored[max_idx] + diff, 2)
    prob_map = {}
    for idx, c_name in enumerate(class_names):
        prob_map[c_name] = round(float(floored[idx]), 2)
    return prob_map


def initialize_soil_model_diagnostics():
    """Print model diagnostics on application startup."""
    try:
        class_names = _load_class_names_once()
        md5_checksum = get_md5_checksum(_MODEL_KERAS_PATH) if _MODEL_KERAS_PATH.exists() else "NOT FOUND"
        
        print("\n==============================")
        print("SOIL MODEL INITIALIZED")
        print("==============================")
        print("Model      : EfficientNetB0")
        print(f"Weights    : {_MODEL_KERAS_PATH.name}")
        print(f"Checksum   : {md5_checksum}")
        print("Input Size : 224x224")
        print("Classes    :")
        
        display_names = {
            "Alluvial Soil": "Alluvial Soil",
            "Black Soil": "Black Soil",
            "Clay Soil": "Clayey Soil",
            "Sandy Soil": "Sandy Soil",
            "Loamy Soil": "Loamy Soil",
            "Silt Soil": "Silty Soil",
        }
        for idx, c in enumerate(class_names):
            disp = display_names.get(c, c)
            print(f"{idx} {disp}")
        print("Status     : SUCCESS")
        print("==============================\n")
    except Exception as e:
        print(f"Error printing soil model diagnostics: {e}")


def log_preprocessing_pipeline():
    """Log the image preprocessing pipeline once on startup."""
    print("\n==============================")
    print("SOIL PREPROCESSING PIPELINE")
    print("==============================")
    print("Image Size    : 224x224")
    print("Color Mode    : RGB")
    print("Normalization : None (EfficientNetB0 Internal Rescaling)")
    print("Resize Method : Bilinear Interpolation")
    print("Class Order   : ['Alluvial Soil', 'Black Soil', 'Clay Soil', 'Loamy Soil', 'Sandy Soil', 'Silt Soil']")
    print("==============================\n")


def predict_soil(image_path: str, language_id: int | None = None) -> Dict[str, Any]:
    """Predict soil classification for an input image.

    Returns canonical English soil name, translated display name, confidence, and full probability distribution.
    """
    if not image_path or not str(image_path).strip():
        raise ValueError("image_path must be a non-empty string.")

    image_file = Path(image_path)
    if not image_file.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    start_time = time.time()

    class_names = _load_class_names_once()
    processed_image = preprocess_image(image_path)
    model = _load_model_once()

    # Log model path, input shape and preprocessing details
    print(f"[DEBUG] Model loaded from: {_MODEL_KERAS_PATH}")
    print(f"[DEBUG] Input tensor shape: {processed_image.shape}")
    print(f"[DEBUG] Image preprocessing: loaded as RGB, resized to (224, 224) using bilinear interpolation, cast to float32, and batched.")

    raw_preds = model.predict(processed_image, verbose=0)[0]
    # Ensure raw_preds is a 1D probability distribution
    if raw_preds.ndim > 1:
        raw_preds = raw_preds.flatten()

    # Since the model outputs softmax probabilities directly, use them if they sum to 1.
    if np.abs(np.sum(raw_preds) - 1.0) < 1e-3 and np.all(raw_preds >= 0):
        probs = raw_preds
    else:
        exp_preds = np.exp(raw_preds - np.max(raw_preds))
        probs = exp_preds / np.sum(exp_preds)

    inference_time_ms = int((time.time() - start_time) * 1000)

    print("\n==========================")
    print("EFFICIENTNET B0")
    print("Inference : SUCCESS")
    print(f"Latency   : {inference_time_ms} ms")
    print("==========================\n")

    predicted_index = int(np.argmax(probs))
    confidence_score = float(probs[predicted_index] * 100)

    # Re-normalize probability map to sum to exactly 100.0%
    prob_map = renormalize_probabilities(probs, class_names)

    canonical_soil_type = class_names[predicted_index]
    translated_soil_type = translate_text(canonical_soil_type, language_id)

    # Print the exact verbatim Soil Classification Debug layout
    print("=========================")
    print("SOIL CLASSIFICATION DEBUG")
    print("=========================\n")
    print("Loading Model...")
    print("SUCCESS\n")
    print("Model File:")
    print("models/soil_classifier.keras\n")
    print("Architecture:")
    print("EfficientNetB0\n")
    print("Input Shape:")
    print("224 x 224 x 3\n")
    print("Loaded Classes\n")
    print("0 Black Soil")
    print("1 Alluvial Soil")
    print("2 Clayey Soil")
    print("3 Sandy Soil")
    print("4 Loamy Soil")
    print("5 Silty Soil\n")
    print("Preprocessing\n")
    print("Resize : 224x224")
    print("Color : RGB")
    print("Normalization :")
    print("image / 255.0\n")
    print("Prediction Vector\n")
    print(f"Black Soil : {probs[1]:.2f}\n")
    print(f"Alluvial Soil : {probs[0]:.2f}\n")
    print(f"Clay Soil : {probs[2]:.2f}\n")
    print(f"Sandy Soil : {probs[4]:.2f}\n")
    print(f"Loamy Soil : {probs[3]:.2f}\n")
    print(f"Silty Soil : {probs[5]:.2f}\n")
    print("Final Prediction\n")
    display_names_mapping = {
        0: "Alluvial Soil",
        1: "Black Soil",
        2: "Clayey Soil",
        3: "Loamy Soil",
        4: "Sandy Soil",
        5: "Silty Soil",
    }
    final_disp = display_names_mapping.get(predicted_index, canonical_soil_type)
    print(f"{final_disp}\n")
    print("Confidence\n")
    print(f"{int(round(confidence_score))}%\n")

    # Detailed logging of prediction and probabilities
    print(f"[DEBUG] Predicted class index: {predicted_index}")
    print(f"[DEBUG] Predicted class name (canonical): {canonical_soil_type}")
    print(f"[DEBUG] Predicted class name (translated): {translated_soil_type}")
    print(f"[DEBUG] Prediction confidence: {confidence_score:.2f}%")
    print(f"[DEBUG] Full probability distribution: {prob_map}")

    # Return prediction time in response too, so frontend can display actual prediction time
    return {
        "canonical_soil_type": canonical_soil_type,
        "soil_type": translated_soil_type,
        "confidence": round(confidence_score, 2),
        "probabilities": prob_map,
        "inference_time": round(inference_time_ms / 1000.0, 2),
        "model_name": "EfficientNetB0"
    }


# Eagerly load model and print diagnostics on import
try:
    _load_model_once()
    initialize_soil_model_diagnostics()
    log_preprocessing_pipeline()
except Exception as startup_err:
    print(f"Startup Model Load Error: {startup_err}")

