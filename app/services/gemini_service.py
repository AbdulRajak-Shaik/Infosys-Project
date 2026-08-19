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
    """Generate chatbot responses using Google Gemini AI with automatic key rotation and model fallback."""

    _PRIMARY_MODEL = "gemini-2.5-flash"
    _FALLBACK_MODELS = ("gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-flash")
    _TIMEOUT_SECS = 12

    def _call_gemini_api(self, api_key: str, model_name: str, prompt: str) -> str | None:
        """Direct REST API call to Gemini with timeout and clean candidate extraction."""
        try:
            import requests
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 1024,
                }
            }
            res = requests.post(url, json=payload, timeout=self._TIMEOUT_SECS)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        text = parts[0]["text"].strip()
                        if text:
                            return text
            else:
                print(f"[Gemini REST] {model_name} returned status {res.status_code}")
        except Exception as exc:
            print(f"[Gemini REST] {model_name} error: {exc}")

        # Try SDK as secondary fallback
        if genai is not None:
            try:
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(model=model_name, contents=prompt)
                text = getattr(response, "text", None)
                if text and text.strip():
                    return text.strip()
            except Exception as exc:
                print(f"[Gemini SDK] {model_name} error: {exc}")

        return None

    def generate_response(self, prompt: str, language_id: int | None = None) -> str:
        """Return Gemini's generated response using active models and configured keys."""
        del language_id

        api_keys = [
            k for k in (
                settings.GEMINI_API_KEY_1,
                settings.GEMINI_API_KEY_2,
                settings.GEMINI_API_KEY_3,
                os.getenv("GEMINI_API_KEY"),
                os.getenv("GOOGLE_API_KEY"),
            ) if k and k.strip()
        ]

        if api_keys:
            # 1. Try primary fast model (gemini-2.5-flash) across all keys
            for key in api_keys:
                result = self._call_gemini_api(key, self._PRIMARY_MODEL, prompt)
                if result:
                    print(f"[Gemini] [OK] Successfully generated response via {self._PRIMARY_MODEL}")
                    return result

            # 2. Try fallback models if primary failed
            for fallback_model in self._FALLBACK_MODELS:
                for key in api_keys:
                    result = self._call_gemini_api(key, fallback_model, prompt)
                    if result:
                        print(f"[Gemini] [OK] Successfully generated response via {fallback_model}")
                        return result

        # 3. All external attempts exhausted — serve rich local agricultural knowledge
        print("[Gemini] Fallback to local agricultural knowledge engine")
        return _local_agriculture_response(prompt)


def _local_agriculture_response(prompt: str) -> str:
    """Provide direct, specific agricultural guidance when Gemini is not available."""
    match = re.search(r"(?:Question|Follow-up question):\s*(.+)", prompt, flags=re.IGNORECASE)
    question = match.group(1).strip() if match else "your farming question"
    q = question.casefold()

    # ── Detect crops mentioned in question ────────────────────────────────────
    CROP_MAP = {
        "maize": "Maize (Corn)", "corn": "Maize (Corn)",
        "rice": "Rice (Paddy)", "paddy": "Rice (Paddy)",
        "wheat": "Wheat", "cotton": "Cotton",
        "groundnut": "Groundnut", "peanut": "Groundnut",
        "sugarcane": "Sugarcane", "tomato": "Tomato",
        "onion": "Onion", "potato": "Potato",
        "soybean": "Soybean", "soya": "Soybean",
        "sunflower": "Sunflower", "chilli": "Chilli",
        "turmeric": "Turmeric", "banana": "Banana",
        "mango": "Mango", "mustard": "Mustard",
        "chickpea": "Chickpea", "gram": "Chickpea",
        "lentil": "Lentil", "jowar": "Sorghum (Jowar)",
        "sorghum": "Sorghum", "bajra": "Pearl Millet",
        "millet": "Pearl Millet", "ragi": "Finger Millet",
        "okra": "Okra (Bhindi)", "bhindi": "Okra (Bhindi)",
    }
    detected_crop = None
    for kw, name in CROP_MAP.items():
        if kw in q:
            detected_crop = name
            break

    AP_TG = any(loc in q for loc in ("kesarapalli", "andhra", "telangana", "ap",
                                      "vijayawada", "guntur", "kurnool", "warangal", "hyderabad"))

    # ── GREETING ──────────────────────────────────────────────────────────────
    if re.search(r"\b(hello|hi|namaste|help)\b", q):
        return (
            "Hello! I am your AI Agriculture & Soil Health Assistant 🌱\n\n"
            "I can help you with:\n"
            "• 🌾 Crop selection by season, soil & region\n"
            "• 🧪 Fertilizer NPK dosages & split schedules\n"
            "• 📅 Seasonal planting calendars (Kharif / Rabi / Zaid)\n"
            "• 🐛 Pest & disease identification and treatment\n"
            "• 💧 Irrigation scheduling by crop stage\n\n"
            "Ask me anything about your crops or farm!"
        )

    # ── SEASON / PLANTING TIME ────────────────────────────────────────────────
    if any(w in q for w in ("season", "when to plant", "when to sow", "sowing time",
                             "planting time", "best time", "which month", "best season",
                             "sow", "cultivat", "grow")):
        if detected_crop and "maize" in detected_crop.lower() or "maize" in q or "corn" in q:
            region = "Andhra Pradesh / Telangana" if AP_TG else "India"
            return (
                f"**Best Seasons for Maize Cultivation in {region}** 🌽\n\n"
                "**Kharif Season (Primary — Rainfed or Irrigated):**\n"
                "• Sowing: **June 15 – July 15** (at monsoon onset)\n"
                "• Harvest: September – October (90–100 days)\n"
                "• Varieties: DHM-117, HQPM-1, Vivek Hybrid-9, DKC-9108\n\n"
                "**Rabi Season (Irrigated):**\n"
                "• Sowing: **October 15 – November 15**\n"
                "• Harvest: February – March\n"
                "• Varieties: HQPM-5, DKC-9108, Pro-318\n\n"
                "**Zaid / Summer (Irrigated only):**\n"
                "• Sowing: **January – February**\n"
                "• Harvest: April – May\n\n"
                "**Key Conditions:**\n"
                "• Soil: Well-drained loamy soil, pH 6.0–7.5\n"
                "• Temperature: 21°C–27°C optimal\n"
                "• Seed rate: 20 kg/acre; Spacing: 60 × 25 cm\n"
                "• Irrigation: Critical at knee-high, tasseling & grain-fill stages\n\n"
                + ("📍 **For Kesarapalli / Krishna district, AP:** Kharif sowing (late June) is recommended for rainfed, or Rabi (October–November) with canal irrigation." if AP_TG else "")
            )
        if detected_crop and "rice" in detected_crop.lower() or "rice" in q or "paddy" in q:
            return (
                "**Best Seasons for Rice (Paddy) Cultivation** 🌾\n\n"
                "**Kharif (Wet Season — Main Crop):**\n"
                "• Nursery: May–June | Transplanting: **June–July**\n"
                "• Harvest: October–November (120–150 days)\n"
                "• Varieties: MTU-7029, BPT-5204 (Sona Masuri), IR-64, MTU-1010\n\n"
                "**Rabi (Winter Crop, Irrigated):**\n"
                "• Nursery: November | Transplanting: **November–December**\n"
                "• Harvest: March–April\n"
                "• Varieties: MTU-1010, NLR-34449, DRR Dhan-42\n\n"
                "**Ideal Conditions:**\n"
                "• Soil: Clay or clay-loam, pH 5.5–6.5\n"
                "• Temperature: 20°C–35°C\n"
                "• Water: 1200–1500 mm (total season)"
            )
        if detected_crop and "wheat" in detected_crop.lower() or "wheat" in q:
            return (
                "**Best Season for Wheat Cultivation** 🌾\n\n"
                "**Rabi Season ONLY:**\n"
                "• Timely sowing: **October 15 – November 15** (best yields)\n"
                "• Late sowing: November 16 – December 15 (use late varieties: HD-2781, WH-1105)\n"
                "• Harvest: March – April\n\n"
                "**Top Varieties:** HD-2967, HD-3086, GW-322, K-9107\n\n"
                "**Key Conditions:**\n"
                "• Soil: Well-drained loam, pH 6.0–7.5\n"
                "• Temperature: 10°C–25°C (cool weather essential; not suitable for South India plains)\n"
                "• Seed rate: 40–45 kg/acre\n"
                "• Irrigation: 4–6 irrigations at critical stages"
            )
        if detected_crop and "cotton" in detected_crop.lower() or "cotton" in q:
            return (
                "**Best Season for Cotton Cultivation** 🌿\n\n"
                "**Kharif ONLY (April–January):**\n"
                "• Sowing: **April–May** (rainfed areas)\n"
                "• Or **June** after monsoon onset for dryland\n"
                "• Harvest: October–January (stage-wise picking)\n"
                "• Duration: 150–180 days\n\n"
                "**Varieties:** Bollgard-II hybrids, MRC-6301, JK-Varun, NHH-44\n\n"
                "**Key Conditions:**\n"
                "• Soil: Black cotton soil (Vertisol), pH 6.0–8.0\n"
                "• Temperature: 21°C–30°C\n"
                "• Spacing: 90×60 cm (rainfed) / 120×60 cm (irrigated)"
            )
        # Generic season calendar
        return (
            "**Indian Crop Planting Calendar** 📅\n\n"
            "**Kharif Season (Sow: June–July | Harvest: Oct–Nov):**\n"
            "Rice, Maize, Cotton, Groundnut, Soybean, Jowar, Bajra, Sunflower, Sesame\n\n"
            "**Rabi Season (Sow: Oct–Nov | Harvest: Mar–Apr):**\n"
            "Wheat, Chickpea, Mustard, Lentil, Safflower, Peas, Sunflower\n\n"
            "**Zaid / Summer Season (Jan–Feb | Harvest: May–Jun):**\n"
            "Watermelon, Cucumber, Moong dal, Maize (irrigated), Summer vegetables\n\n"
            "**Perennial (Year-round with irrigation):**\n"
            "Sugarcane, Banana, Turmeric, Coconut, Arecanut\n\n"
            "Which crop are you planning? I can give exact sowing dates, varieties & spacing!"
        )

    # ── FERTILIZER ────────────────────────────────────────────────────────────
    if any(w in q for w in ("fertilizer", "fertiliser", "urea", "npk", "nitrogen",
                             "phosphorus", "potassium", "dap", "mop", "manure", "nutrient", "dose")):
        NPK_TABLE = {
            "maize":     ("150:75:50",  "1/3 at sowing, 1/3 at knee-high (25 DAS), 1/3 at tasseling (50 DAS)",
                          "Urea 65 kg + DAP 48 kg + MOP 17 kg per acre"),
            "rice":      ("120:60:40",  "1/3 at transplant, 1/3 at active tillering, 1/3 at panicle initiation",
                          "Urea 52 kg + DAP 39 kg + MOP 13 kg per acre"),
            "wheat":     ("120:60:30",  "Half at sowing (basal), half at crown root initiation stage (21 DAS)",
                          "Urea 52 kg + DAP 39 kg + MOP 10 kg per acre"),
            "cotton":    ("180:90:60",  "Basal + 3 top-dressings at 30, 60, 90 DAS",
                          "Urea 78 kg + DAP 58 kg + MOP 20 kg per acre"),
            "groundnut": ("25:50:50",   "Full basal dose before sowing + gypsum at flowering",
                          "Urea 11 kg + DAP 32 kg + MOP 17 kg + Gypsum 200 kg per acre"),
            "sugarcane": ("250:100:120","Split into 4 doses across the growing season (0, 60, 120, 180 DAS)",
                          "Urea 108 kg + DAP 65 kg + MOP 40 kg per acre per split"),
            "soybean":   ("30:80:40",   "Full basal dose at sowing (Rhizobium seed treatment reduces N need)",
                          "Urea 13 kg + DAP 52 kg + MOP 13 kg per acre"),
            "sunflower": ("90:60:60",   "Half N basal, half N at knee-high; full P & K as basal",
                          "Urea 39 kg + DAP 39 kg + MOP 20 kg per acre"),
            "tomato":    ("120:80:80",  "Basal + top-dressing at 30 and 60 days after transplanting",
                          "Urea 52 kg + DAP 52 kg + MOP 27 kg + Boron 2 kg per acre"),
            "onion":     ("100:50:50",  "Basal + top-dress at 30 and 60 days",
                          "Urea 43 kg + DAP 32 kg + MOP 17 kg per acre"),
            "chickpea":  ("20:60:20",   "Full dose as basal at sowing (Rhizobium inoculation essential)",
                          "Urea 9 kg + DAP 39 kg + MOP 7 kg per acre"),
        }
        for crop_key, (npk, schedule, products) in NPK_TABLE.items():
            if crop_key in q or (detected_crop and crop_key in detected_crop.lower()):
                n, p, k = npk.split(":")
                return (
                    f"**Fertilizer Plan for {detected_crop or crop_key.title()}** 🧪\n\n"
                    f"**Recommended NPK (kg/ha):** N = {n}  |  P = {p}  |  K = {k}\n\n"
                    f"**Application Schedule:** {schedule}\n\n"
                    f"**Practical Quantities (per acre):**\n{products}\n\n"
                    "**General Tips:**\n"
                    "• Soil test every 2–3 years for accurate doses\n"
                    "• Apply urea on moist (not waterlogged) soil\n"
                    "• Apply DAP & MOP as basal before/at sowing\n"
                    "• Add 2–4 tons FYM/compost per acre yearly\n"
                    "• Use zinc sulphate (10 kg/acre) if Zn is deficient"
                )
        return (
            "**NPK Recommendations by Crop (kg/ha)** 🧪\n\n"
            "| Crop       |  N  |  P  |  K  |\n"
            "|------------|-----|-----|-----|\n"
            "| Rice       | 120 |  60 |  40 |\n"
            "| Maize      | 150 |  75 |  50 |\n"
            "| Wheat      | 120 |  60 |  30 |\n"
            "| Cotton     | 180 |  90 |  60 |\n"
            "| Groundnut  |  25 |  50 |  50 |\n"
            "| Sugarcane  | 250 | 100 | 120 |\n"
            "| Soybean    |  30 |  80 |  40 |\n"
            "| Chickpea   |  20 |  60 |  20 |\n"
            "| Sunflower  |  90 |  60 |  60 |\n\n"
            "**Key Rules:** Apply P & K as basal. Split N into 2–3 doses. Base doses on soil tests.\n\n"
            "Tell me your crop and I'll calculate exact product quantities per acre!"
        )

    # ── PEST ──────────────────────────────────────────────────────────────────
    if any(w in q for w in ("pest", "insect", "aphid", "borer", "caterpillar",
                             "whitefly", "thrips", "mite", "weevil", "bug", "army worm")):
        crop_ctx = f" in {detected_crop}" if detected_crop else ""
        return (
            f"**Pest Management{crop_ctx}** 🐛\n\n"
            "**Step 1 — Scout before treating:**\n"
            "Check 10–20 plants across the field; treat only at economic threshold.\n\n"
            "**Common Pests & Recommended Controls:**\n"
            "• **Stem borer** (rice/maize): Chlorantraniliprole (Coragen) 0.4 ml/L or Fipronil 1.5 ml/L\n"
            "• **Fall Army Worm** (maize): Emamectin Benzoate 0.4 g/L; apply early in whorl stage\n"
            "• **Aphids** (wheat/mustard): Imidacloprid 0.3 ml/L or Thiamethoxam 0.2 g/L\n"
            "• **Whitefly** (cotton/tomato): Acetamiprid 0.2 g/L + yellow sticky traps\n"
            "• **Caterpillars** (vegetables): Spinosad 0.9 ml/L or Bt spray\n"
            "• **Thrips** (chilli/onion): Fipronil 1.5 ml/L; avoid water stress\n"
            "• **Pink Bollworm** (cotton): Emamectin or Bollgard-II hybrids\n\n"
            "**Always:** Rotate chemical classes to prevent resistance. Use PPE when spraying."
        )

    # ── DISEASE ───────────────────────────────────────────────────────────────
    if any(w in q for w in ("disease", "blight", "spot", "wilt", "fungus", "fungal",
                             "rust", "mildew", "rot", "blast", "mosaic", "burn")):
        crop_ctx = f" in {detected_crop}" if detected_crop else ""
        return (
            f"**Crop Disease Management{crop_ctx}** 🍃\n\n"
            "**Key Diseases & Controls:**\n"
            "• **Rice Blast**: Tricyclazole 0.6 g/L at boot leaf/heading stage\n"
            "• **Bacterial Leaf Blight (rice)**: Copper oxychloride 2.5 g/L; drain field; avoid excess N\n"
            "• **Downy Mildew** (maize): Metalaxyl + Mancozeb seed treatment; Metalaxyl spray\n"
            "• **Powdery Mildew** (wheat/vegetables): Tebuconazole 1 ml/L or wettable Sulfur 2 g/L\n"
            "• **Fusarium Wilt** (tomato/chilli): Carbendazim drench 1 g/L; reduce irrigation\n"
            "• **Leaf Rust** (wheat): Propiconazole 1 ml/L at first appearance\n"
            "• **Boll Rot** (cotton): Improve drainage; avoid field entry when wet\n\n"
            "**Prevention:**\n"
            "• Use certified disease-resistant varieties\n"
            "• Crop rotation every 2–3 years\n"
            "• Remove and destroy infected plant material immediately\n"
            "• Avoid overhead irrigation; maintain good airflow"
        )

    # ── IRRIGATION ────────────────────────────────────────────────────────────
    if any(w in q for w in ("irrigation", "water", "irrigate", "drought", "dry", "rain")):
        if detected_crop and "maize" in detected_crop.lower() or "maize" in q:
            return (
                "**Irrigation Schedule for Maize** 💧\n\n"
                "Maize is highly sensitive to water stress at these stages:\n\n"
                "**Critical Irrigation Stages (never skip):**\n"
                "1. **Germination** (0–7 DAS): Light irrigation to establish\n"
                "2. **Knee-high** (25–30 DAS): Most critical for yield\n"
                "3. **Tasseling/Silking** (50–55 DAS): Yield-determining stage\n"
                "4. **Grain filling** (70–85 DAS): Affects grain size\n\n"
                "**Schedule:** Every 7–10 days in summer; 12–15 days in winter\n"
                "**Total irrigations:** 5–6 in Kharif; 6–8 in Rabi\n"
                "**Stop:** 10 days before harvest\n\n"
                "Drip/sprinkler saves 30–40% water vs flood irrigation."
            )
        if detected_crop and "rice" in detected_crop.lower() or "rice" in q or "paddy" in q:
            return (
                "**Irrigation for Rice (Paddy)** 💧\n\n"
                "• Nursery: Keep 2–3 cm water\n"
                "• After transplanting to tillering: 5 cm standing water\n"
                "• Panicle initiation to flowering: 5–7 cm — CRITICAL, never let dry\n"
                "• Grain filling: Alternate Wetting & Drying (AWD) — saves 20–30% water\n"
                "• 2 weeks before harvest: Drain field completely\n\n"
                "**SRI method:** AWD technique increases yield 15–20% and saves 40% water."
            )
        return (
            "**Irrigation Advisory** 💧\n\n"
            "**Key Principles:**\n"
            "• Irrigate at critical crop stages, not on fixed days\n"
            "• Water until root zone (30–45 cm) is wet, let top 5 cm dry before next\n"
            "• Drip/sprinkler saves 30–50% vs flood irrigation\n\n"
            "**By Soil Type:**\n"
            "• Sandy: Lighter, frequent irrigation (every 5–7 days)\n"
            "• Clay: Deep, less frequent (every 10–15 days)\n"
            "• Loam: 7–10 day intervals\n\n"
            "Tell me your crop for a specific irrigation schedule!"
        )

    # ── SOIL / pH ─────────────────────────────────────────────────────────────
    if any(w in q for w in ("soil", "ph", "acidic", "alkaline", "sandy", "clay",
                             "loam", "organic", "fertility", "compost", "micronutrient")):
        return (
            "**Soil Health & pH Management** 🌱\n\n"
            "**pH Guide:**\n"
            "| pH Range     | Condition   | Suitable Crops               |\n"
            "|--------------|-------------|------------------------------|\n"
            "| 5.0–6.0      | Acidic      | Rice, Tea, Potato            |\n"
            "| 6.0–6.5      | Slightly acid | Maize, Soybean, Groundnut  |\n"
            "| 6.5–7.5      | Optimal     | Wheat, Cotton, Vegetables    |\n"
            "| 7.5–8.5      | Alkaline    | Barley, Mustard, Sugarbeet   |\n\n"
            "**Correction:**\n"
            "• Acidic soil (pH < 6.0): Lime @ 400–600 kg/acre\n"
            "• Alkaline soil (pH > 7.5): Gypsum @ 200–400 kg/acre + organic matter\n\n"
            "**Organic Matter Improvement:**\n"
            "• Add FYM (Farm Yard Manure) 4–5 tons/acre annually\n"
            "• Green manure crops (Dhaincha, Sunhemp) before main crop\n"
            "• Compost, vermicompost 2–3 tons/acre\n\n"
            "Get soil tested at your nearest KVK every 2–3 years!"
        )

    # ── YELLOW LEAVES / DEFICIENCY ────────────────────────────────────────────
    if any(w in q for w in ("yellow", "pale", "chlorosis", "deficiency", "leaf curl", "browning")):
        return (
            "**Diagnosing Yellow / Pale Leaves** 🍃\n\n"
            "**Top 5 Causes & Fixes:**\n\n"
            "1. **Nitrogen deficiency** — Older (lower) leaves turn yellow first\n"
            "   → Apply urea top-dressing: 10–12 kg/acre\n\n"
            "2. **Iron (Fe) deficiency** — Yellow between veins; newest leaves affected\n"
            "   → Spray ferrous sulphate 5 g/L (0.5%) solution\n\n"
            "3. **Magnesium (Mg) deficiency** — Interveinal yellowing on older leaves\n"
            "   → Apply Epsom salt (MgSO4) 10 kg/acre\n\n"
            "4. **Waterlogging / root suffocation** — Uniform pale yellow overall\n"
            "   → Drain field immediately; loosen soil surface\n\n"
            "5. **Leafhoppers / Thrips** — Yellow stippled spots; check leaf underside\n"
            "   → Imidacloprid 0.3 ml/L spray\n\n"
            "Which crop is affected? Are older or newer leaves yellow first?"
        )

    # ── GENERIC FALLBACK (still helpful) ────────────────────────────────────
    crop_note = f" for {detected_crop}" if detected_crop else ""
    return (
        f"**Agriculture Advisory{crop_note}** 🌾\n\n"
        f"Your question: *\"{question}\"*\n\n"
        "**Quick answers I can give right now:**\n"
        "• 📅 Ask: *'best season for maize'* — get exact sowing dates & varieties\n"
        "• 🧪 Ask: *'fertilizer for rice'* — get NPK rates and product quantities\n"
        "• 🐛 Ask: *'pest control for cotton'* — get chemical names and doses\n"
        "• 💧 Ask: *'irrigation schedule for wheat'* — get stage-wise schedule\n"
        "• 🌱 Ask: *'soil pH for sugarcane'* — get amendment recommendations\n\n"
        "For a precise recommendation, share:\n"
        "📍 Location | 🌱 Crop | 📅 Growth stage | 🧪 Soil test values (if any)"
    )



gemini_service = GeminiService()
