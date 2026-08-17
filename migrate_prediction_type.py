"""Migrate prediction_history table to add prediction_type column and fix existing records."""
import sqlite3
import json

conn = sqlite3.connect("soil_health.db")
cursor = conn.cursor()

# Check if prediction_type column already exists
cursor.execute("PRAGMA table_info(prediction_history)")
cols = [row[1] for row in cursor.fetchall()]
print("Current columns:", cols)

if "prediction_type" not in cols:
    print("Adding prediction_type column...")
    cursor.execute("ALTER TABLE prediction_history ADD COLUMN prediction_type VARCHAR(50) NOT NULL DEFAULT 'soil'")
    conn.commit()
    print("Column added successfully!")
else:
    print("Column already exists")

# Fix existing records:
# Records with recommended_crops as list of dicts {crop: ...} = real ML crop recommendation -> "crop"
# Records with recommended_crops as list of plain strings (['Wheat','Rice']) = old bogus defaults from soil upload -> "soil"
# Records with empty recommended_crops = "soil"
cursor.execute("SELECT id, recommended_crops FROM prediction_history")
rows = cursor.fetchall()

for row in rows:
    rec_id, crops_raw = row
    try:
        if isinstance(crops_raw, str):
            crops = json.loads(crops_raw)
        else:
            crops = crops_raw or []
        
        # Real crop recommendations from ML model have dicts with 'crop' key
        is_crop = (
            isinstance(crops, list) 
            and len(crops) > 0 
            and isinstance(crops[0], dict) 
            and "crop" in crops[0]
        )
        pred_type = "crop" if is_crop else "soil"
        cursor.execute("UPDATE prediction_history SET prediction_type = ? WHERE id = ?", (pred_type, rec_id))
        print(f"  ID={rec_id}: first_crop={crops[:1] if crops else []} -> type={pred_type}")
    except Exception as e:
        print(f"  Error for ID={rec_id}: {e}")

conn.commit()
print("\nMigration complete! Final state:")
cursor.execute("SELECT id, prediction_type, soil_type, json_extract(recommended_crops, '$[0]') as first_crop FROM prediction_history ORDER BY id")
for row in cursor.fetchall():
    print(f"  ID={row[0]}, type={row[1]}, soil={row[2]}, first_crop={row[3]}")

conn.close()
