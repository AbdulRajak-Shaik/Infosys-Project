import os

frontend_dir = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src"

for root, dirs, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            if "unknown" in content.lower():
                print(f"File: {file}")
                for idx, line in enumerate(content.splitlines(), 1):
                    if "unknown" in line.lower():
                        clean_line = line.encode('ascii', errors='ignore').decode('ascii')
                        print(f"  Line {idx}: {clean_line.strip()}")
