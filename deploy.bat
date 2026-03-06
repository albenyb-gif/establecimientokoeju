@echo off
setlocal

:: =========================================================================
:: Script de Despliegue Automático para Hostinger (Gestión Ganadera)
:: Sincroniza Git, Compila Frontend y Reinicia PM2
:: =========================================================================

echo.
echo 🚀 [1/4] Guardando cambios y subiendo a GitHub...
git add .
git commit -m "update: despliegue automatico %date% %time%"
git push origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo subir a GitHub. Verifica conflictos.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 🌐 [2/4] Conectando al servidor para actualizar archivos...
:: Reset hard para asegurar que coincida con GitHub y Pull
ssh Hostinger "cd public_html/koeju && git reset --hard HEAD && git pull origin main"

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo conectar o hacer pull en el servidor.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 📦 [3/4] Instalando dependencias y compilando frontend...
ssh Hostinger "cd public_html/koeju && npm install --prefix backend && cd frontend && npm install && npm run build"

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR: Fallo la instalacion o el build en el servidor.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 🔄 [4/4] Reiniciando servidor Node (PM2)...
ssh Hostinger "pm2 restart koejuganaderia"

echo.
echo ✨ ¡PROCESO DE DESPLIEGUE FINALIZADO CON EXITO! ✨
echo.
pause
