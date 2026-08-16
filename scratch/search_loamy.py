def search_file(path, label):
    print(f"=== Searching {label} ===")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for idx, line in enumerate(content.splitlines(), 1):
        if "loamy" in line.lower():
            try:
                print(f"{idx}: {line.strip()}")
            except Exception:
                pass

search_file("c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/index.ts", "index.ts")
search_file("c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/adminTranslations.ts", "adminTranslations.ts")
