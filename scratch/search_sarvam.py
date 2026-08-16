import os

backend_dir = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-Backend-Team2"

for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            if "def translate_text" in content:
                print(f"Found translate_text in {file}:")
                # print the function
                lines = content.splitlines()
                for idx, line in enumerate(lines, 1):
                    if "def translate_text" in line:
                        for l in lines[idx-1 : idx+30]:
                            print(l)
                        break
