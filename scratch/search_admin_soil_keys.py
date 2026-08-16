with open("c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Let's inspect the English block (the first block)
en_content = content.split('"en": {')[1].split('},\n  "')[0]
for idx, line in enumerate(en_content.splitlines(), 1):
    if "soil." in line:
        print(line.strip())
