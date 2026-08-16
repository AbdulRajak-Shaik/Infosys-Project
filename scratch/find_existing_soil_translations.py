import re

index_path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1/src/translations/index.ts"

with open(index_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's find every occurrence of "Black Soil" and its translation
matches = re.finditer(r'"([a-z]{2,3})":\s*\{', content)
positions = [m.start() for m in matches]
positions.append(len(content))

for idx in range(len(positions) - 1):
    lang_block = content[positions[idx]:positions[idx+1]]
    lang = re.search(r'"([a-z]{2,3})":\s*\{', lang_block).group(1)
    # Find "Black Soil" value
    black_match = re.search(r'"Black Soil":\s*"([^"]+)"', lang_block)
    clay_match = re.search(r'"Clay Soil":\s*"([^"]+)"', lang_block)
    loamy_match = re.search(r'"Loamy Soil":\s*"([^"]+)"', lang_block)
    sandy_match = re.search(r'"Sandy Soil":\s*"([^"]+)"', lang_block)
    
    black_val = black_match.group(1) if black_match else "N/A"
    clay_val = clay_match.group(1) if clay_match else "N/A"
    loamy_val = loamy_match.group(1) if loamy_match else "N/A"
    sandy_val = sandy_match.group(1) if sandy_match else "N/A"
    
    # Print safe ascii
    black_safe = black_val.encode('ascii', errors='ignore').decode('ascii')
    clay_safe = clay_val.encode('ascii', errors='ignore').decode('ascii')
    loamy_safe = loamy_val.encode('ascii', errors='ignore').decode('ascii')
    sandy_safe = sandy_val.encode('ascii', errors='ignore').decode('ascii')
    print(f"Lang: {lang:3} | Black: {black_safe:10} | Clay: {clay_safe:10} | Loamy: {loamy_safe:10} | Sandy: {sandy_safe:10}")
