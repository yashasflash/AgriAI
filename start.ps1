# ============================================================
# AgriAI - Start Script
# ============================================================
# Starts both the FastAPI backend and the frontend server.
#
# Prerequisites:
#   1. Python venv in backend/venv (or system Python with requirements.txt)
#   2. LM Studio running at http://127.0.0.1:1234
#   3. Node.js installed
#
# Usage:
#   powershell -File .\start.ps1
#   or from project root: .\start.ps1
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  AgriAI - Starting Application" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Resolve project root dynamically
$root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}

# ---- Start Backend ----
Write-Host "[1/2] Starting FastAPI backend..." -ForegroundColor Cyan

$backendJob = Start-Process -FilePath $pythonExe `
    -ArgumentList "-m", "uvicorn", "app:app", "--reload", "--host", "127.0.0.1", "--port", "8000" `
    -WorkingDirectory $backendDir `
    -PassThru `
    -NoNewWindow

Write-Host "  Backend PID: $($backendJob.Id)" -ForegroundColor DarkGray
Write-Host "  Backend URL: http://127.0.0.1:8000" -ForegroundColor DarkGray
Write-Host ""

# ---- Start Frontend ----
Write-Host "[2/2] Starting frontend dev server..." -ForegroundColor Cyan

$frontendJob = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory $frontendDir `
    -PassThru `
    -NoNewWindow

Write-Host "  Frontend PID: $($frontendJob.Id)" -ForegroundColor DarkGray
Write-Host "  Frontend URL: http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  AgriAI is ready!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Yellow
Write-Host "  Backend:   http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  LM Studio: http://127.0.0.1:1234" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor DarkGray
Write-Host ""

# Wait for either process to exit
try {
    while (-not $backendJob.HasExited -and -not $frontendJob.HasExited) {
        Start-Sleep -Seconds 2
    }
} finally {
    # Cleanup on exit
    if (-not $backendJob.HasExited) {
        Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    }
    if (-not $frontendJob.HasExited) {
        Stop-Process -Id $frontendJob.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host ""
    Write-Host "AgriAI stopped." -ForegroundColor Red
}
