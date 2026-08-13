"""
Santali (sat / language_id=16) database migration script.
- Updates the 26 translation records that are still in English
- Adds missing translation keys for Nitrogen, Phosphorus, Potassium,
  fertilizers, soil health, crop/final recommendation labels
- ONLY modifies language_id=16 records
- Does NOT touch any other language
- Safe to run multiple times (upsert pattern)
"""
import sqlite3
import sys

sys.stdout.reconfigure(encoding="utf-8")

DB_PATH = "soil_health.db"
SANTALI_LANG_ID = 16

# ---------------------------------------------------------------------------
# Santali translations for translation_keys table
# Key: (translation_key.key value) -> Santali text
# ---------------------------------------------------------------------------
SANTALI_TRANSLATIONS = {
    # ── Soil types ──────────────────────────────────────────────────────────
    "Black Soil": "ᱢᱮᱴᱮᱫ ᱵᱚᱸᱜᱟ",
    "Red Soil": "ᱟᱨᱚᱜ ᱵᱚᱸᱜᱟ",
    "Alluvial Soil": "ᱵᱚᱸᱜᱟ ᱡᱚᱞᱚ",
    "Clayey Soil": "ᱫᱷᱤᱵᱤ ᱵᱚᱸᱜᱟ",
    "Sandy Soil": "ᱵᱟᱞᱩᱭ ᱵᱚᱸᱜᱟ",
    "Loamy Soil": "ᱞᱚᱢᱤ ᱵᱚᱸᱜᱟ",
    "Laterite Soil": "ᱞᱮᱴᱮᱨᱟᱭᱤᱴ ᱵᱚᱸᱜᱟ",
    # ── Soil health classes ─────────────────────────────────────────────────
    "Good": "ᱵᱟᱰᱟᱭ",
    "Moderate": "ᱢᱟᱬᱢᱟᱬ",
    "Poor": "ᱦᱩᱰᱤᱧ",
    "Optimal": "ᱥᱟᱨᱜᱩᱸᱡ",
    # ── Nutrients ───────────────────────────────────────────────────────────
    "Nitrogen": "ᱱᱟᱭᱫᱽᱨᱚᱡᱮᱱ",
    "Phosphorus": "ᱯᱷᱚᱥᱯᱷᱚᱨᱚᱥ",
    "Potassium": "ᱯᱚᱴᱟᱥᱤᱭᱟᱢ",
    # ── Crops ───────────────────────────────────────────────────────────────
    "Rice": "ᱫᱟᱠᱟ",
    "Wheat": "ᱜᱚᱦᱩᱢ",
    "Maize": "ᱡᱚᱱᱟᱨᱟ",
    "Cotton": "ᱠᱚᱯᱟᱥ",
    "Sugarcane": "ᱩᱠᱩ",
    "Groundnut": "ᱵᱟᱫᱟᱢ",
    "Soybean": "ᱥᱚᱭᱵᱤᱱ",
    "Sorghum": "ᱡᱚᱸᱲᱟ",
    "Millet": "ᱵᱟᱡᱨᱟ",
    "Jute": "ᱡᱩᱴ",
    "Barley": "ᱡᱚᱣ",
    "Lentils": "ᱢᱟᱥᱩᱨ",
    "Chickpea": "ᱪᱟᱱᱟ",
    "Mustard": "ᱥᱚᱨᱥᱚᱸ",
    # ── Fertilizers ─────────────────────────────────────────────────────────
    "Urea (46% N)": "ᱤᱩᱨᱤᱭᱟ (46% N)",
    "Ammonium Sulphate": "ᱟᱢᱳᱱᱤᱭᱟᱢ ᱥᱟᱞᱯᱷᱮᱴ",
    "Well-rotted farmyard manure": "ᱡᱮᱜᱮᱛ ᱦᱩᱨᱤ ᱜᱷᱚᱨ ᱠᱷᱟᱫ",
    "DAP (Di-Ammonium Phosphate)": "ᱰᱮᱯᱤ (DAP)",
    "Single Super Phosphate (SSP)": "ᱥᱤᱸᱜᱮᱞ ᱥᱩᱯᱟᱨ ᱯᱷᱚᱥᱯᱷᱮᱴ",
    "Rock phosphate": "ᱨᱚᱠ ᱯᱷᱚᱥᱯᱷᱮᱴ",
    "Muriate of Potash (MOP)": "ᱢᱩᱨᱤᱭᱮᱴ ᱚᱯ ᱯᱚᱴᱟᱥ (MOP)",
    "Sulphate of Potash (SOP)": "ᱥᱟᱞᱯᱷᱮᱴ ᱚᱯ ᱯᱚᱴᱟᱥ (SOP)",
    "Wood ash": "ᱫᱟᱨᱩ ᱪᱟᱨᱤ",
    # ── Navigation / UI ─────────────────────────────────────────────────────
    "HOME_TITLE": "AI ᱵᱚᱸᱜᱟ ᱦᱚᱨᱦᱚᱲ ᱢᱩᱞᱟᱹᱭᱫ ᱯᱚᱨᱱᱟᱢ",
    "LOGIN": "ᱞᱚᱜᱤᱱ",
    "REGISTER": "ᱱᱚᱶᱟ ᱠᱷᱟᱛᱟ ᱵᱟᱱᱟᱣ",
    "PROFILE": "ᱯᱨᱚᱯᱷᱟᱭᱤᱞ",
    "SOIL_ANALYSIS": "ᱵᱚᱸᱜᱟ ᱦᱚᱨᱦᱚᱲ ᱢᱩᱞᱟᱹᱭᱫ",
    "CROP_RECOMMENDATION": "ᱯᱚᱫ ᱵᱟᱹᱰᱤ ᱦᱚᱱᱟᱹᱣ",
    "FERTILIZER": "ᱠᱷᱟᱫ ᱵᱟᱹᱰᱤ ᱦᱚᱱᱟᱹᱣ",
    "LOGOUT": "ᱵᱟᱦᱮᱨ ᱦᱚᱪᱚ",
    "ACCOUNT_DETAILS": "ᱠᱷᱟᱛᱟ ᱵᱷᱟᱨᱥᱟ",
    "USER_NAME": "ᱵᱷᱤᱛᱨᱤ ᱱᱩᱢᱤᱛ",
    "SUBMIT": "ᱯᱟᱺᱠᱟᱣ",
    "CANCEL": "ᱵᱚᱸᱫ ᱦᱚᱪᱚ",
    "DOWNLOAD_PDF": "ᱵᱟᱦᱩ ᱞᱤᱯᱤ PDF ᱨᱤᱯᱳᱨᱴ ᱥᱩᱴᱟᱢ ᱠᱚᱨᱟ",
    "DISEASE_DETECTION": "ᱯᱚᱫ ᱵᱤᱢᱟᱨᱤ ᱪᱤᱱᱦᱟᱹᱣ",
    "WEATHER_FORECAST": "ᱦᱟᱵᱟ ᱠᱷᱚᱵᱚᱨ",
    # ── Analysis result labels ───────────────────────────────────────────────
    "Nitrogen deficiency detected": "ᱱᱟᱭᱫᱽᱨᱚᱡᱮᱱ ᱠᱚᱢᱛᱤ ᱡᱟᱦᱟᱸ ᱟᱠᱟᱱ",
    "Phosphorus deficiency detected": "ᱯᱷᱚᱥᱯᱷᱚᱨᱚᱥ ᱠᱚᱢᱛᱤ ᱡᱟᱦᱟᱸ ᱟᱠᱟᱱ",
    "Potassium deficiency detected": "ᱯᱚᱴᱟᱥᱤᱭᱟᱢ ᱠᱚᱢᱛᱤ ᱡᱟᱦᱟᱸ ᱟᱠᱟᱱ",
    "No deficiency detected": "ᱠᱚᱢᱛᱤ ᱵᱟᱰᱟᱭ ᱡᱟᱦᱟᱸ ᱟᱠᱟᱱ ᱟᱫᱚ",
    "Apply nitrogen-rich fertilizer": "ᱱᱟᱭᱫᱽᱨᱚᱡᱮᱱ ᱵᱷᱚᱨᱯᱩᱨ ᱠᱷᱟᱫ ᱞᱟᱜᱟᱣ",
    "Soil health is good": "ᱵᱚᱸᱜᱟ ᱦᱚᱨᱦᱚᱲ ᱵᱟᱰᱟᱭ ᱟᱠᱟᱱ",
    "Soil health is moderate": "ᱵᱚᱸᱜᱟ ᱦᱚᱨᱦᱚᱲ ᱢᱟᱬᱢᱟᱬ ᱟᱠᱟᱱ",
    "Soil health is poor": "ᱵᱚᱸᱜᱟ ᱦᱚᱨᱦᱚᱲ ᱦᱩᱰᱤᱧ ᱟᱠᱟᱱ",
    # ── Compound nutrient deficiency labels ────────────────────────────────
    "Nitrogen, Phosphorus": "ᱱᱟᱭᱫᱽᱨᱚᱡᱮᱱ, ᱯᱷᱚᱥᱯᱷᱚᱨᱚᱥ",
    "Nitrogen, Potassium": "ᱱᱟᱭᱫᱽᱨᱚᱡᱮᱱ, ᱯᱚᱴᱟᱥᱤᱭᱟᱢ",
    "Phosphorus, Potassium": "ᱯᱷᱚᱥᱯᱷᱚᱨᱚᱥ, ᱯᱚᱴᱟᱥᱤᱭᱟᱢ",
    "Nitrogen, Phosphorus, Potassium": "ᱱᱟᱭᱫᱽᱨᱚᱡᱮᱱ, ᱯᱷᱚᱥᱯᱷᱚᱨᱚᱥ, ᱯᱚᱴᱟᱥᱤᱭᱟᱢ",
    # ── Status messages ─────────────────────────────────────────────────────
    "Success": "ᱥᱟᱯᱷᱚᱞᱴᱟ",
    "Failed": "ᱵᱮᱠᱟᱨ",
    "Loading": "ᱞᱤᱰ ᱦᱚᱪᱚ",
    "Error": "ᱜᱷᱩᱛᱤ",
    "Analysis": "ᱢᱩᱞᱟᱹᱭᱫ",
    "Prediction": "ᱯᱨᱮᱫᱤᱠᱥᱚᱱ",
    "Confidence": "ᱵᱷᱚᱨᱯᱚᱥᱟ",
    "Recommendation": "ᱵᱟᱹᱰᱤ ᱦᱚᱱᱟᱹᱣ",
    "Result": "ᱯᱷᱚᱞ",
    "Score": "ᱥᱠᱳᱨ",
    "Health": "ᱦᱚᱨᱦᱚᱲ",
}

# ---------------------------------------------------------------------------
# Santali translations for the `multilingual` table (santali column)
# ---------------------------------------------------------------------------
MULTILINGUAL_SANTALI = {
    "HOME_TITLE": "AI ᱵᱚᱸᱜᱟ ᱦᱚᱨᱦᱚᱲ ᱢᱩᱞᱟᱹᱭᱫ ᱯᱚᱨᱱᱟᱢ",
    "LOGIN": "ᱞᱚᱜᱤᱱ",
    "REGISTER": "ᱱᱚᱶᱟ ᱠᱷᱟᱛᱟ ᱵᱟᱱᱟᱣ",
    "PROFILE": "ᱯᱨᱚᱯᱷᱟᱭᱤᱞ",
    "SOIL_ANALYSIS": "ᱵᱚᱸᱜᱟ ᱦᱚᱨᱦᱚᱲ ᱢᱩᱞᱟᱹᱭᱫ",
    "CROP_RECOMMENDATION": "ᱯᱚᱫ ᱵᱟᱹᱰᱤ ᱦᱚᱱᱟᱹᱣ",
    "FERTILIZER": "ᱠᱷᱟᱫ ᱵᱟᱹᱰᱤ ᱦᱚᱱᱟᱹᱣ",
    "LOGOUT": "ᱵᱟᱦᱮᱨ ᱦᱚᱪᱚ",
    "ACCOUNT_DETAILS": "ᱠᱷᱟᱛᱟ ᱵᱷᱟᱨᱥᱟ",
    "USER_NAME": "ᱵᱷᱤᱛᱨᱤ ᱱᱩᱢᱤᱛ",
    "BANK_NAME": "ᱵᱮᱸᱠ ᱱᱩᱢᱤᱛ",
    "ACCOUNT_NUMBER": "ᱠᱷᱟᱛᱟ ᱱᱚᱢᱵᱚᱨ",
    "IFSC": "IFSC ᱠᱳᱰ",
    "ADDRESS": "ᱜᱟᱶ ᱟᱨ ᱡᱤᱞᱟ ᱛᱷᱤᱠᱟᱱᱟ",
    "DISEASE_DETECTION": "ᱯᱚᱫ ᱵᱤᱢᱟᱨᱤ ᱪᱤᱱᱦᱟᱹᱣ",
    "WEATHER_FORECAST": "ᱦᱟᱵᱟ ᱠᱷᱚᱵᱚᱨ",
    "SUBMIT": "ᱯᱟᱺᱠᱟᱣ",
    "CANCEL": "ᱵᱚᱸᱫ ᱦᱚᱪᱚ",
    "DOWNLOAD_PDF": "ᱵᱟᱦᱩ ᱞᱤᱯᱤ PDF ᱨᱤᱯᱳᱨᱴ ᱥᱩᱴᱟᱢ",
}


def run_migration():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # ── Verify Santali language record ──────────────────────────────────────
    cur.execute(
        "SELECT id, language_name, language_code FROM languages WHERE id=?",
        (SANTALI_LANG_ID,),
    )
    lang_row = cur.fetchone()
    if not lang_row:
        print(f"ERROR: Language record with id={SANTALI_LANG_ID} not found!")
        conn.close()
        return

    print(f"Santali language record: id={lang_row['id']}, name={lang_row['language_name']}, code={lang_row['language_code']}")
    print()

    # ── Step 1: Update multilingual table santali column ────────────────────
    print("=== STEP 1: Updating multilingual.santali column ===")
    updated_multi = 0
    for key, santali_text in MULTILINGUAL_SANTALI.items():
        cur.execute("SELECT id FROM multilingual WHERE key=?", (key,))
        row = cur.fetchone()
        if row:
            cur.execute(
                "UPDATE multilingual SET santali=? WHERE key=?",
                (santali_text, key),
            )
            print(f"  [UPDATED multilingual] key={key!r}")
            updated_multi += 1
    conn.commit()
    print(f"  Total multilingual rows updated: {updated_multi}")
    print()

    # ── Step 2: Update/insert translations for translation_keys table ────────
    print("=== STEP 2: Updating translations table (language_id=16) ===")
    updated_trans = 0
    inserted_keys = 0
    inserted_trans = 0

    for key_or_english, santali_text in SANTALI_TRANSLATIONS.items():
        # Find existing translation_key by key field or english field
        cur.execute(
            "SELECT id, key, english FROM translation_keys WHERE key=? OR english=?",
            (key_or_english, key_or_english),
        )
        tk_row = cur.fetchone()

        if tk_row:
            tk_id = tk_row["id"]
            # Check if Santali translation already exists
            cur.execute(
                "SELECT id, translated_text FROM translations WHERE translation_key_id=? AND language_id=?",
                (tk_id, SANTALI_LANG_ID),
            )
            trans_row = cur.fetchone()

            if trans_row:
                old_text = trans_row["translated_text"]
                if old_text == santali_text:
                    # Already correct
                    pass
                elif old_text == tk_row["english"]:
                    # Still English — update to Santali
                    cur.execute(
                        "UPDATE translations SET translated_text=? WHERE id=?",
                        (santali_text, trans_row["id"]),
                    )
                    old_preview = repr(old_text)[:40]
                    print(f"  [UPDATED trans] key={tk_row['key']!r} old={old_preview}")
                    updated_trans += 1
                else:
                    # Non-English value already present — respect existing Santali
                    existing_preview = repr(old_text)[:40]
                    print(f"  [SKIP   trans] key={tk_row['key']!r} already has Santali: {existing_preview}")

            else:
                # No Santali translation yet — insert one
                cur.execute(
                    "INSERT INTO translations (translation_key_id, language_id, translated_text) VALUES (?,?,?)",
                    (tk_id, SANTALI_LANG_ID, santali_text),
                )
                print(f"  [INSERT trans] key={tk_row['key']!r}")
                inserted_trans += 1
        else:
            # translation_key row doesn't exist yet — create it + translation
            # Determine category based on key name
            category = "SantaliDynamic"
            if key_or_english in ("Nitrogen", "Phosphorus", "Potassium"):
                category = "Nutrients"
            elif "Soil" in key_or_english or "soil" in key_or_english:
                category = "SoilHealth"
            elif any(c in key_or_english for c in ("Rice", "Wheat", "Maize", "Cotton", "Crop", "crop")):
                category = "Crops"
            elif any(c in key_or_english for c in ("Urea", "DAP", "SSP", "MOP", "SOP", "fertilizer", "Fertilizer")):
                category = "Fertilizers"

            cur.execute(
                """
                INSERT INTO translation_keys (key, english, category, description)
                VALUES (?, ?, ?, ?)
                """,
                (
                    key_or_english.replace(" ", "_").replace(",", "").replace("(", "").replace(")", "").replace("%", "pct"),
                    key_or_english,
                    category,
                    f"Santali translation for: {key_or_english}",
                ),
            )
            new_tk_id = cur.lastrowid
            cur.execute(
                "INSERT INTO translations (translation_key_id, language_id, translated_text) VALUES (?,?,?)",
                (new_tk_id, SANTALI_LANG_ID, santali_text),
            )
            print(f"  [INSERT key+trans] english={key_or_english!r}")
            inserted_keys += 1
            inserted_trans += 1

    conn.commit()
    print()
    print(f"  translation_keys inserted: {inserted_keys}")
    print(f"  translations updated:      {updated_trans}")
    print(f"  translations inserted:     {inserted_trans}")
    print()

    # ── Step 3: Report remaining still-English translations ──────────────────
    print("=== STEP 3: Remaining still-English Santali translations ===")
    cur.execute(
        """
        SELECT t.id, tk.key, t.translated_text
        FROM translations t
        JOIN translation_keys tk ON t.translation_key_id = tk.id
        WHERE t.language_id = ? AND t.translated_text = tk.english
        ORDER BY tk.key
        """,
        (SANTALI_LANG_ID,),
    )
    remaining = cur.fetchall()
    if remaining:
        print(f"  {len(remaining)} records still in English (non-user-facing or technical):")
        for r in remaining:
            text_preview = repr(r["translated_text"])[:60]
            print(f"    id={r['id']}, key={r['key']!r}, text={text_preview}")
    else:
        print("  All Santali translations are non-English! ✓")
    print()

    # ── Final summary ────────────────────────────────────────────────────────
    cur.execute(
        "SELECT COUNT(*) as cnt FROM translations WHERE language_id=?",
        (SANTALI_LANG_ID,),
    )
    total = cur.fetchone()["cnt"]

    cur.execute(
        """
        SELECT COUNT(*) as cnt FROM translations t
        JOIN translation_keys tk ON t.translation_key_id = tk.id
        WHERE t.language_id=? AND t.translated_text != tk.english
        """,
        (SANTALI_LANG_ID,),
    )
    non_english = cur.fetchone()["cnt"]

    print("=== MIGRATION COMPLETE ===")
    print(f"  Total Santali translation records: {total}")
    print(f"  Records with actual Santali text:  {non_english}")
    print(f"  Records still in English:          {total - non_english}")

    conn.close()


if __name__ == "__main__":
    run_migration()
