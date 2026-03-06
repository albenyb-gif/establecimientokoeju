@echo off
setlocal

:: =========================================================================
:: Script de Despliegue - Gestión Ganadera (Hostinger Auto-Deploy)
:: Compila frontend, sube a GitHub y Hostinger despliega automaticamente
:: =========================================================================

echo.
echo ============================================
echo   DESPLIEGUE - Gestion Ganadera
echo ============================================

echo.
echo [1/3] Compilando frontend...
cd /d "C:\gemini\Gestión_Ganadera\frontend"
call npm run build

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Fallo la compilacion del frontend.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Subiendo cambios a GitHub...
cd /d "C:\gemini\Gestión_Ganadera"
git add .
git commit -m "deploy: actualizacion %date% %time:~0,8%"
git push origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: No se pudo subir a GitHub.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Esperando despliegue automatico de Hostinger...
echo Hostinger detectara el push y desplegara en 1-2 minutos.
echo Puedes verificar en: https://hpanel.hostinger.com

echo.
echo ============================================
echo   LISTO! Cambios subidos exitosamente.
echo   Hostinger desplegara automaticamente.
echo ============================================
echo.
pause
