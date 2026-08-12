@echo off
REM HikaruLoL - Windows baslatma scripti
echo ========================================
echo   HikaruLoL - League of Legends Builder
echo ========================================
echo.

if not exist "node_modules" (
  echo [1/3] Ilk kurulum - npm paketleri yukleniyor...
  call npm install
  if errorlevel 1 (
    echo HATA: npm install basarisiz oldu.
    pause
    exit /b 1
  )
)

echo [2/3] Vite production build...
call npx vite build
if errorlevel 1 (
  echo HATA: Build basarisiz oldu.
  pause
  exit /b 1
)

echo [3/3] Electron baslatiliyor...
echo.
call npx electron .
