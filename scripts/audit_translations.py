import os
import re
import json

FRONTEND_SRC = r"C:\infosys\AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1\src"

def scan_files():
    ts_files = []
    for root, dirs, files in os.walk(FRONTEND_SRC):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                ts_files.append(os.path.join(root, file))
    return ts_files

def main():
    files = scan_files()
    print(f"[+] Scanning {len(files)} files in {FRONTEND_SRC}...")

if __name__ == '__main__':
    main()
