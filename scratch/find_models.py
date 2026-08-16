import json

nb_path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/EfficientNetB0_Final.ipynb"
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

for idx, cell in enumerate(nb.get("cells", [])):
    if idx <= 5 and cell.get("cell_type") == "code":
        source = "".join(cell.get("source", []))
        print(f"Cell {idx}:\n{source}\n{'-'*40}")
