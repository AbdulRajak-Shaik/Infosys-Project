$file = "c:\infosys\AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026\AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1\src\translations\index.ts"
$lines = Get-Content $file
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s+"(en|hi|te|ta|kn|ml|mr|gu|bn|pa|or|as|ur|mai|mni|sat|brx|doi|ks|kok|ne|sa|sd)"\s*:\s*\{') {
        Write-Host "$($i+1): $($lines[$i].Trim())"
    }
}
