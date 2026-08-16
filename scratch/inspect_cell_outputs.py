import json

nb_path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/EfficientNetB0_Final.ipynb"
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

for idx in [4, 16, 17, 28]:
    cell = nb.get("cells", [])[idx]
    print(f"Cell {idx} Outputs:")
    for out in cell.get("outputs", []):
        if "text" in out:
            text = "".join(out["text"])
            print(text.encode('ascii', errors='ignore').decode('ascii'))
    print(f"{'-'*40}")
