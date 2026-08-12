@echo off
REM HikaruLoL - Gelistirme modu (Vite + Electron)
echo ========================================
echo   HikaruLoL - Development Mode
echo ========================================
echo.

if not exist "node_modules" (
  echo [1/2] Ilk kurulum yapiliyor...
  call npm install
)

echo [2/2] Vite + Electron baslatiliyor...
echo Tarayicinizda acin veya Electron penceresi acilacak.
call npm run dev
