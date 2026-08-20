# AgroAI - Start Backend + Frontend together
# Run this from: C:\Users\Dell\Desktop\AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  AgroAI - Starting Application" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Kill anything already on port 8000
$existing = netstat -ano | Select-String ":8000" | Select-String "LISTENING"
if ($existing) {
    $pid = ($existing -split '\s+')[-1]
    Write-Host "Killing existing process on port 8000 (PID: $pid)..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend in a new terminal window
Write-Host "[1/2] Starting Backend at http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$ROOT'; `$env:PYTHONPATH = '$ROOT'; Write-Host 'Backend starting...' -ForegroundColor Green; Backend\venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000"
) -WindowStyle Normal

# Give backend 5 seconds to start
Write-Host "   Waiting for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start Frontend in a new terminal window
Write-Host "[2/2] Starting Frontend at http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$ROOT\frontend'; Write-Host 'Frontend starting...' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend  -> http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
