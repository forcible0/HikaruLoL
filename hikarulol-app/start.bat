@echo off
REM HikaruLoL - Windows başlatma scripti
echo ========================================
echo   HikaruLoL - League of Legends Builder
echo ========================================
echo.

REM İlk çalıştırmada node_modules yoksa yükle
if not exist "node_modules" (
  echo [1/3] Ilk kurulum - npm paketleri yukleniyor...
  call npm install
  if errorlevel 1 (
    echo HATA: npm install basarisiz oldu.
    pause
    exit /b 1
  )
)

echo [2/3] React production build olusturuluyor...
call npm run build:react
if errorlevel 1 (
  echo HATA: Build basarisiz oldu.
  pause
  exit /b 1
)

echo [3/3] Electron baslatiliyor...
echo.
call electron .
