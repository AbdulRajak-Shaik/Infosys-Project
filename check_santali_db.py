import sqlite3
import sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('soil_health.db')
c = conn.cursor()

# Check if soil types exist as translation keys
targets = ['Sandy Soil', 'Red Soil', 'Black Soil', 'Clayey Soil', 'Alluvial Soil',
           'Nitrogen', 'Phosphorus', 'Potassium', 'Rice', 'Wheat', 'Cotton',
           'Good', 'Moderate', 'Poor', 'HOME_TITLE', 'SOIL_ANALYSIS']

print('=== translation_keys lookup ===')
for t in targets:
    c.execute('SELECT id, key, english FROM translation_keys WHERE english=? OR key=?', (t, t))
    rows = c.fetchall()
    print(f'  {t!r}: {rows}')

print()
# Check what Santali records exist for Nitrogen key
c.execute('''
    SELECT t.id, tk.key, tk.english, t.translated_text
    FROM translations t
    JOIN translation_keys tk ON t.translation_key_id = tk.id
    WHERE t.language_id=16 AND (
        tk.key IN ('Nitrogen','Phosphorus','Potassium','Rice','Cotton','Wheat','Good','Moderate','Poor')
        OR tk.english IN ('Nitrogen','Phosphorus','Potassium','Rice','Cotton','Wheat','Good','Moderate','Poor')
    )
''')
rows = c.fetchall()
print('=== Santali translations for key nutrients/crops/health ===')
for r in rows:
    print(f'  id={r[0]}, key={r[1]!r}, en={r[2]!r}, sat={r[3]!r}')

conn.close()
