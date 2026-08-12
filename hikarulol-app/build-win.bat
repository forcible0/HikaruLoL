@echo off
REM HikaruLoL - Windows .exe build scripti
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

echo [2/3] React production build...
call npm run build:react
if errorlevel 1 (
  echo HATA: React build basarisiz oldu.
  pause
  exit /b 1
)

echo [3/3] Electron Builder ile .exe olusturuluyor...
call npm run build:win
if errorlevel 1 (
  echo HATA: Electron build basarisiz oldu.
  pause
  exit /b 1
)

echo.
echo ========================================
echo  BUILD TAMAMLANDI!
echo  dist/ klasorune bakin.
echo ========================================
pause
