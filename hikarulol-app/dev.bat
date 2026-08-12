@echo off
REM HikaruLoL - Geliştirme modu başlatma (hot reload)
echo ========================================
echo   HikaruLoL - Development Mode
echo ========================================
echo.

if not exist "node_modules" (
  echo [1/2] Ilk kurulum yapiliyor...
  call npm install
)

echo [2/2] Dev server baslatiliyor (http://localhost:3000)...
echo Tarayicinizda acin veya Electron penceresi acilacak.
call npm run dev
