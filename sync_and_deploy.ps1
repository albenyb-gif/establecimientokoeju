# Script de Despliegue Automático para Hostinger (Gestión Ganadera)
# Uso: .\sync_and_deploy.ps1

Write-Host "`n🚀 Iniciando proceso de sincronización y despliegue..." -ForegroundColor Cyan

# 1. Sincronización Local con Git
Write-Host "`n📦 1. Guardando cambios locales y subiendo a GitHub..." -ForegroundColor Yellow
git add .
git commit -m "update: sincronización automática para despliegue"
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Error al subir cambios a GitHub. Verifique su conexión o conflictos." -ForegroundColor Red
    exit
}

# 2. Despliegue en el Servidor via SSH
Write-Host "`n🌐 2. Conectando al servidor Hostinger para actualizar..." -ForegroundColor Yellow
Write-Host "Nota: Se le solicitará la contraseña de SSH si no tiene llaves configuradas." -ForegroundColor Gray

# Comando a ejecutar en el servidor
$remoteCmd = "cd public_html/koeju && git reset --hard HEAD && git pull origin main && npm install --prefix backend && npm run build --prefix frontend && pm2 restart koejuganaderia"

ssh Hostinger $remoteCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✨ ¡PROCESO FINALIZADO CON ÉXITO! ✨" -ForegroundColor Green
    Write-Host "La aplicación ha sido actualizada y el servidor reiniciado." -ForegroundColor Green
} else {
    Write-Host "`n❌ Error durante el despliegue en el servidor." -ForegroundColor Red
    Write-Host "Asegúrese de que el servidor tenga conexión a internet y pm2 esté configurado." -ForegroundColor Gray
}
