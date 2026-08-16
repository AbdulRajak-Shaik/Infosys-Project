with open("c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/index.ts", "r", encoding="utf-8") as f:
    content = f.read()

print("Alluvial Soil count:", content.count('"Alluvial Soil":'))
print("Silt Soil count:", content.count('"Silt Soil":'))
print("Slit Soil count:", content.count('"Slit Soil":'))
print("Alluvial soil count:", content.count('"Alluvial soil":'))
print("Silt soil count:", content.count('"Silt soil":'))
print("Slit soil count:", content.count('"Slit soil":'))
print("Clayey Soil count:", content.count('"Clayey Soil":'))
