"""Gemini-backed response generation for the chatbot module."""

import os
import re
from app.config import settings

try:
    from google import genai
except ImportError:
    genai = None

try:
    import google.generativeai as genai_old
except ImportError:
    genai_old = None


class GeminiService:
    """Generate chatbot responses with automatic API-key and model fallback."""

    _MODELS = ("gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro", "gemini-flash-latest")

    def generate_response(self, prompt: str, language_id: int | None = None) -> str:
        """Return Gemini's generated text, trying each configured key and model in order."""
        del language_id  # Prompt already contains language instructions.

        api_keys = [
            k for k in (
                settings.GEMINI_API_KEY_1,
                settings.GEMINI_API_KEY_2,
                settings.GEMINI_API_KEY_3,
                os.getenv("GEMINI_API_KEY"),
                os.getenv("GOOGLE_API_KEY"),
            ) if k and k.strip()
        ]

        if genai is not None and api_keys:
            for api_key in api_keys:
                for model_name in self._MODELS:
                    try:
                        client = genai.Client(api_key=api_key)
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                        )
                        if response and getattr(response, "text", None):
                            return response.text
                    except Exception as e:
                        print(f"Gemini new SDK error ({model_name}): {str(e)[:100]}")
                        continue

        if genai_old is not None and api_keys:
            for api_key in api_keys:
                for model_name in self._MODELS:
                    try:
                        genai_old.configure(api_key=api_key)
                        model = genai_old.GenerativeModel(model_name)
                        response = model.generate_content(prompt)
                        if response and getattr(response, "text", None):
                            return response.text
                    except Exception as e:
                        print(f"Gemini legacy SDK error ({model_name}): {str(e)[:100]}")
                        continue

        return _local_agriculture_response(prompt)


def _local_agriculture_response(prompt: str) -> str:
    """Provide useful, question-specific guidance when Gemini is not configured."""
    match = re.search(r"(?:Question|Follow-up question):\s*(.+)", prompt, flags=re.IGNORECASE)
    question = match.group(1).strip() if match else "your farming question"
    query = question.casefold()

    if re.search(r"\b(?:hello|hi|namaste|help)\b", query):
        return (
            "I can help with crop choice, soil pH, nutrients, irrigation, pests, and diseases. "
            "Tell me the crop, location, and the problem you see for a specific recommendation."
        )
    if any(word in query for word in ("yellow", "yellowing", "chlorosis", "pale leaf", "pale leaves")):
        return (
            "Yellow leaves can be caused by waterlogging, nitrogen deficiency, pests, or disease.\n"
            "1. Check that the root zone drains within a day after irrigation or rain.\n"
            "2. Inspect the underside of leaves for insects and spots.\n"
            "3. Use a soil or leaf test before applying fertilizer.\n"
            "Which crop is affected, and are the older or newer leaves yellow first?"
        )
    if any(word in query for word in ("pest", "insect", "aphid", "borer", "caterpillar")):
        return (
            "Start with field scouting before treatment. Check 10-20 plants across the field and note the pest, "
            "damage level, and crop stage. Remove heavily infested leaves where practical, keep weeds controlled, "
            "and use the locally approved treatment only when the economic threshold is crossed. "
            "Please share the crop and a photo or description of the pest."
        )
    if any(word in query for word in ("disease", "blight", "spot", "wilt", "fungus", "fungal")):
        return (
            "To manage a possible crop disease, first confirm the symptom and avoid treating blindly. Remove badly "
            "affected plant material, improve airflow and drainage, and avoid wetting leaves during irrigation. "
            "Use only a crop- and disease-specific product approved by your local agriculture office. "
            "What crop is it, and are there spots, wilting, or rot?"
        )
    if any(word in query for word in ("irrigation", "irrigate", "water", "watering", "rain", "rainfall")):
        return (
            "Irrigate according to soil moisture and crop stage, not a fixed calendar. Water deeply enough to wet the "
            "root zone, then allow the surface to begin drying before the next irrigation. Avoid standing water unless "
            "the crop requires it, and reduce irrigation before expected rain. What crop and soil type do you have?"
        )
    if any(word in query for word in ("fertilizer", "urea", "npk", "nitrogen", "phosphorus", "potassium", "nutrient")):
        return (
            "Fertilizer should be based on a recent soil test, crop, yield target, and growth stage. Apply nitrogen in "
            "split doses rather than all at once, place phosphorus near the root zone at planting when recommended, "
            "and avoid fertilizer on dry or waterlogged soil. Share the crop, area, growth stage, and soil-test values "
            "for a precise plan."
        )
    if any(word in query for word in ("ph", "acidic", "alkaline", "soil")):
        return (
            "Soil pH affects nutrient availability. Most field crops perform well near pH 6.0-7.5, but the right target "
            "depends on the crop. Confirm pH with a soil test before correcting it; use lime only for confirmed acidity "
            "and follow local recommendations for alkaline soil. What is your pH value and crop?"
        )
    if any(word in query for word in ("crop", "plant", "seed", "sow", "sowing", "variety")):
        return (
            "Crop selection depends on your season, rainfall or irrigation, soil type and pH, and local market. Choose "
            "a locally recommended, disease-tolerant variety and use certified seed. Please share your location, soil "
            "type, water availability, and planting month for a suitable crop recommendation."
        )
    return (
        f"For your question, \"{question}\", I need a little more farm context to give safe, useful advice. "
        "Please include the crop, location, growth stage, and any soil-test value or visible symptom."
    )


gemini_service = GeminiService()
