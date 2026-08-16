import re

path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's find every occurrence of "soil.alluvial" and its translation
matches = re.finditer(r'"([a-z]{2,3})":\s*\{', content)
positions = [m.start() for m in matches]
positions.append(len(content))

for idx in range(len(positions) - 1):
    lang_block = content[positions[idx]:positions[idx+1]]
    lang = re.search(r'"([a-z]{2,3})":\s*\{', lang_block).group(1)
    
    alluvial_match = re.search(r'"soil\.alluvial":\s*"([^"]+)"', lang_block)
    alluvial_val = alluvial_match.group(1) if alluvial_match else "N/A"
    
    print(f"Lang: {lang:3} | Alluvial: {alluvial_val}")
