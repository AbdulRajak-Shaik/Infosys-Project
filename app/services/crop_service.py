"""Reusable crop recommendation service for agricultural decision support.

Uses an agronomic scoring engine (crop-specific N/P/K/pH/temp/humidity/rainfall ranges)
to rank and recommend crops based on soil and environmental inputs.
This replaces the previous broken ML model that returned near-uniform probabilities.
"""

from typing import Any, Dict, List, Optional

from app.services.sarvam_service import translate_text


# ---------------------------------------------------------------------------
# Agronomic crop profiles (based on real-world growing conditions)
# ---------------------------------------------------------------------------
# Each crop defines optimal (min, max) ranges for each feature.
# A score from 0-100 is computed per crop per input set.

CROP_PROFILES: Dict[str, Dict[str, tuple]] = {
    "Rice": {
        "nitrogen":    (60, 120),
        "phosphorus":  (20, 60),
        "potassium":   (20, 60),
        "ph":          (5.5, 7.0),
        "temperature": (20, 35),
        "humidity":    (70, 100),
        "rainfall":    (100, 250),
    },
    "Wheat": {
        "nitrogen":    (40, 100),
        "phosphorus":  (30, 70),
        "potassium":   (20, 50),
        "ph":          (6.0, 7.5),
        "temperature": (10, 25),
        "humidity":    (30, 65),
        "rainfall":    (40, 120),
    },
    "Maize": {
        "nitrogen":    (50, 120),
        "phosphorus":  (30, 80),
        "potassium":   (30, 70),
        "ph":          (5.8, 7.5),
        "temperature": (18, 32),
        "humidity":    (50, 80),
        "rainfall":    (50, 150),
    },
    "Cotton": {
        "nitrogen":    (20, 80),
        "phosphorus":  (10, 40),
        "potassium":   (80, 200),
        "ph":          (6.0, 8.0),
        "temperature": (25, 40),
        "humidity":    (20, 60),
        "rainfall":    (30, 100),
    },
    "Sugarcane": {
        "nitrogen":    (60, 150),
        "phosphorus":  (20, 60),
        "potassium":   (30, 80),
        "ph":          (6.0, 7.5),
        "temperature": (25, 38),
        "humidity":    (60, 90),
        "rainfall":    (100, 200),
    },
    "Soybean": {
        "nitrogen":    (10, 50),
        "phosphorus":  (30, 80),
        "potassium":   (20, 60),
        "ph":          (5.8, 7.0),
        "temperature": (20, 32),
        "humidity":    (50, 80),
        "rainfall":    (60, 160),
    },
    "Groundnut": {
        "nitrogen":    (10, 40),
        "phosphorus":  (20, 60),
        "potassium":   (20, 60),
        "ph":          (5.5, 7.0),
        "temperature": (22, 35),
        "humidity":    (40, 75),
        "rainfall":    (50, 120),
    },
    "Potato": {
        "nitrogen":    (60, 120),
        "phosphorus":  (40, 100),
        "potassium":   (60, 120),
        "ph":          (4.8, 6.5),
        "temperature": (10, 22),
        "humidity":    (60, 90),
        "rainfall":    (50, 120),
    },
    "Tomato": {
        "nitrogen":    (40, 100),
        "phosphorus":  (40, 80),
        "potassium":   (40, 100),
        "ph":          (5.5, 7.0),
        "temperature": (18, 32),
        "humidity":    (50, 80),
        "rainfall":    (40, 120),
    },
    "Jute": {
        "nitrogen":    (50, 120),
        "phosphorus":  (20, 50),
        "potassium":   (20, 50),
        "ph":          (6.0, 7.5),
        "temperature": (25, 38),
        "humidity":    (70, 100),
        "rainfall":    (100, 250),
    },
}

# Soil type compatibility bonuses (boost score if soil is good for crop)
SOIL_COMPATIBILITY: Dict[str, List[str]] = {
    "Rice":       ["Clay Soil", "Alluvial Soil", "Loamy Soil"],
    "Wheat":      ["Loamy Soil", "Clay Soil", "Silt Soil", "Alluvial Soil"],
    "Maize":      ["Loamy Soil", "Sandy Soil", "Alluvial Soil"],
    "Cotton":     ["Black Soil", "Loamy Soil", "Alluvial Soil"],
    "Sugarcane":  ["Loamy Soil", "Alluvial Soil", "Clay Soil"],
    "Soybean":    ["Loamy Soil", "Clay Soil", "Alluvial Soil"],
    "Groundnut":  ["Sandy Soil", "Loamy Soil"],
    "Potato":     ["Loamy Soil", "Sandy Soil", "Silt Soil"],
    "Tomato":     ["Loamy Soil", "Clay Soil", "Alluvial Soil"],
    "Jute":       ["Alluvial Soil", "Loamy Soil", "Clay Soil"],
}


def _score_crop(crop: str, data: Dict[str, Any]) -> float:
    """Score how suitable a crop is for given conditions (0.0 – 100.0)."""
    profile = CROP_PROFILES[crop]
    score = 0.0
    num_features = len(profile)

    for feature, (lo, hi) in profile.items():
        value = data.get(feature)
        if value is None:
            score += 50.0  # neutral if data missing
            continue
        value = float(value)
        center = (lo + hi) / 2.0
        half_range = (hi - lo) / 2.0
        if lo <= value <= hi:
            # Within optimal range: closer to center = higher score
            proximity = 1.0 - abs(value - center) / max(half_range, 1e-6)
            score += 80.0 + 20.0 * proximity
        else:
            # Outside optimal range: penalise proportionally to how far out
            if value < lo:
                deviation = (lo - value) / max(lo, 1e-6)
            else:
                deviation = (value - hi) / max(hi, 1e-6)
            score += max(0.0, 80.0 - deviation * 120.0)

    base_score = score / num_features  # 0 – 100

    # Soil bonus: +8 points if soil type matches preferred soils
    soil_type = str(data.get("soil_type", "")).strip()
    compatible_soils = SOIL_COMPATIBILITY.get(crop, [])
    if soil_type in compatible_soils:
        base_score += 8.0
    base_score = min(base_score, 100.0)

    return round(base_score, 2)


def recommend_crop(data: Dict[str, Any], language_id: int | None = None) -> Dict[str, Any]:
    """Recommend the top 5 crops based on soil and environmental conditions.

    Args:
        data: Dictionary with keys:
              soil_type, nitrogen, phosphorus, potassium, ph,
              organic_carbon, electrical_conductivity, temperature,
              humidity, rainfall (optional)
        language_id: Optional language ID for translation.

    Returns:
        Dict with key 'recommended_crops' listing top-5 crops with scores.

    Raises:
        ValueError: If required fields are missing.
        RuntimeError: If recommendation fails.
    """
    try:
        required = ["nitrogen", "phosphorus", "potassium", "ph", "temperature", "humidity"]
        for field in required:
            if data.get(field) is None:
                raise ValueError(f"Missing required field: {field}")

        # Score every crop
        scored: List[tuple] = []
        for crop_name in CROP_PROFILES:
            score = _score_crop(crop_name, data)
            scored.append((crop_name, score))

        # Sort descending by score
        scored.sort(key=lambda x: x[1], reverse=True)
        top5 = scored[:5]

        # Build response
        recommendations = []
        for crop_name, score in top5:
            translated = translate_text(crop_name, language_id)
            recommendations.append({
                "crop": translated,
                "score": score,
            })

        print(f"[CropService] Input: N={data.get('nitrogen')} P={data.get('phosphorus')} "
              f"K={data.get('potassium')} pH={data.get('ph')} "
              f"Temp={data.get('temperature')} Hum={data.get('humidity')}")
        print(f"[CropService] Top 5 recommendations: {[(r['crop'], r['score']) for r in recommendations]}")

        return {"recommended_crops": recommendations}

    except ValueError:
        raise
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Crop recommendation failed: {str(exc)}") from exc
