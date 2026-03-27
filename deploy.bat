@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

:: =========================================================================
:: Script de Despliegue - Gestión Ganadera (Hostinger Auto-Deploy)
:: Compila frontend, sube a GitHub y Hostinger despliega automaticamente
:: =========================================================================

echo.
echo ============================================
echo   DESPLIEGUE - Gestion Ganadera
echo ============================================

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"

echo.
echo [1/3] Compilando frontend...
echo      Carpeta: %FRONTEND%
pushd "%FRONTEND%"
if %ERRORLEVEL% neq 0 (
    echo ERROR: No se pudo acceder a la carpeta frontend.
    pause
    exit /b 1
)
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Fallo la compilacion del frontend.
    popd
    pause
    exit /b %ERRORLEVEL%
)
popd

echo.
echo [2/3] Subiendo cambios a GitHub...
pushd "%ROOT%"
git add .
git commit -m "deploy: actualizacion %date% %time:~0,8%"
git push origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: No se pudo subir a GitHub.
    popd
    pause
    exit /b %ERRORLEVEL%
)
popd

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
