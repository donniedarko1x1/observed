@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22.12+ or 24 LTS, then run start.bat again.
  pause
  exit /b 1
)
if exist "node_modules\.bin\vite.cmd" (
  echo [OBSERVED] Building current source...
  call npm run build
  if errorlevel 1 (
    echo.
    echo [OBSERVED] Build failed. Packaged files were not started.
    pause
    exit /b 1
  )
) else (
  if not exist "dist\index.html" (
    echo Packaged game files are missing. Re-extract the complete ZIP.
    pause
    exit /b 1
  )
  echo [OBSERVED] Starting packaged Engine 0.14.3 Narrative Restraint...
)

echo.
echo [OBSERVED] Open http://127.0.0.1:4179
node serve.mjs
pause
