@echo off
title AgriAI Launcher
echo ===================================================
echo               Starting AgriAI Locally
echo ===================================================
echo.

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "AgriAI Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak > nul

echo Starting React Vite Frontend on http://localhost:5173 ...
start "AgriAI Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo Both services are starting in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend:  http://127.0.0.1:8000
echo - API Docs: http://127.0.0.1:8000/docs
echo ===================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak > nul
start http://localhost:5173
