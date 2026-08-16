import re

index_path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/index.ts"
admin_path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts"

with open(index_path, "r", encoding="utf-8") as f:
    index_content = f.read()

with open(admin_path, "r", encoding="utf-8") as f:
    admin_content = f.read()

# Parse admin translations to find "soil.alluvial" for each language
admin_matches = list(re.finditer(r'"([a-z]{2,3})":\s*\{', admin_content))
admin_positions = [m.start() for m in admin_matches]
admin_positions.append(len(admin_content))

alluvial_by_lang = {}
for idx in range(len(admin_matches)):
    lang = admin_matches[idx].group(1)
    block = admin_content[admin_positions[idx]:admin_positions[idx+1]]
    alluvial_m = re.search(r'"soil\.alluvial":\s*"([^"]+)"', block)
    if alluvial_m:
        alluvial_by_lang[lang] = alluvial_m.group(1)
    else:
        alluvial_by_lang[lang] = "Alluvial Soil"

# Parse index translations to find "silt" and "Clay Soil" for each language
index_matches = list(re.finditer(r'"([a-z]{2,3})":\s*\{', index_content))
index_positions = [m.start() for m in index_matches]
index_positions.append(len(index_content))

modified_index = index_content

for idx in range(len(index_matches)):
    lang = index_matches[idx].group(1)
    block = index_content[index_positions[idx]:index_positions[idx+1]]
    
    silt_m = re.search(r'"silt":\s*"([^"]+)"', block)
    clay_m = re.search(r'"Clay Soil":\s*"([^"]+)"', block)
    
    silt_val = silt_m.group(1) if silt_m else "Silt Soil"
    clay_val = clay_m.group(1) if clay_m else "Clay Soil"
    alluvial_val = alluvial_by_lang.get(lang, "Alluvial Soil")
    
    # We will replace the opening brace of this language block in modified_index
    # The pattern is: "{lang}": {
    # Let's escape and search
    target = f'"{lang}": {{\n'
    if target not in modified_index:
        target = f'"{lang}":{{\n'
    
    # Replacement string
    replacement = target + (
        f'    "Alluvial Soil": "{alluvial_val}",\n'
        f'    "Silt Soil": "{silt_val}",\n'
        f'    "Slit Soil": "{silt_val}",\n'
        f'    "Alluvial soil": "{alluvial_val}",\n'
        f'    "Silt soil": "{silt_val}",\n'
        f'    "Slit soil": "{silt_val}",\n'
        f'    "Clayey Soil": "{clay_val}",\n'
        f'    "Clayey soil": "{clay_val}",\n'
    )
    
    modified_index = modified_index.replace(target, replacement, 1)
    print(f"Injected language {lang} -> Silt: {silt_val.encode('ascii', errors='ignore').decode('ascii')}, Alluvial: {alluvial_val.encode('ascii', errors='ignore').decode('ascii')}")

# Write back modified_index
with open(index_path, "w", encoding="utf-8") as f:
    f.write(modified_index)

print("index.ts updated successfully with soil translations!")
