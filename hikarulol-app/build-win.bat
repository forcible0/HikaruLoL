@echo off
REM HikaruLoL - Windows .exe build
echo ========================================
echo   HikaruLoL - Windows EXE Build
echo ========================================
echo.

if not exist "node_modules" (
  echo [1/3] Ilk kurulum yapiliyor...
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
  echo HATA: Vite build basarisiz oldu.
  pause
  exit /b 1
)

echo [3/3] Electron Builder ile .exe olusturuluyor...
call npx electron-builder --win --x64
if errorlevel 1 (
  echo HATA: Electron build basarisiz oldu.
  pause
  exit /b 1
)

echo.
echo ========================================
echo  BUILD TAMAMLANDI! dist/ klasorune bakin.
echo ========================================
pause
