# Guía de Despliegue - Gestión Ganadera

Esta aplicación se compone de un frontend en React (Vite) y un backend en Node.js (Express) con MySQL.

## Requisitos Previos

- **Node.js**: v18 o superior.
- **MySQL**: v8.0 o superior.
- **Google Cloud Console**: Para las credenciales de Calendar (opcional pero recomendado).

## Pasos para el Despliegue

### 1. Preparar el Backend
1. Entra a la carpeta `backend`:
   ```bash
   cd backend
   npm install
   ```
2. Crea un archivo `.env` basado en el ejemplo (asegúrate de incluir tus credenciales de BD y Google).
3. **Sincronización de Datos (Local a Hostinger)**:
   - Si ya tienes datos localmente y quieres verlos en Hostinger, ejecuta:
     ```bash
     node scripts/export_data.js
     ```
   - Esto generará un archivo `backend/migrations/data_sync_export.sql`.
   - Entra al **phpMyAdmin** de Hostinger e **Importa** ese archivo.
   
4. **Esquema Inicial (Solo si es nuevo)**:
   - Usa el archivo `backend/migrations/full_schema_final.sql` para crear la estructura inicial.

### 2. Construir el Frontend
1. Entra a la carpeta `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Ejecuta el comando de construcción:
   ```bash
   npm run build
   ```
   > [!NOTE]
   > El comando `build` está configurado para mover automáticamente los archivos generados a `backend/public`.

### 3. Ejecutar la Aplicación
1. Regresa a la carpeta `backend`.
2. Inicia el servidor:
   ```bash
   npm start
   ```
3. La aplicación estará disponible en `http://localhost:5000` (o el puerto configurado en el `.env`).

---

## Estructura de Producción

En producción, el servidor de Node sirve tanto la API como los archivos estáticos del frontend. Asegúrate de que el puerto configurado esté abierto en tu firewall.

## Recomendaciones (Hosting Recomendado: Hostinger/VPS)

1. **PM2**: Usa PM2 para mantener el servidor backend activo siempre.
   ```bash
   npm install -g pm2
   pm2 start server.js --name "gestion-ganadera"
   ```
2. **Proxy Inverso**: Se recomienda usar Nginx como proxy inverso si vas a usar un dominio (SSL).

## 🚀 Notas Específicas para Hostinger
- **Estructura de Servidor**: 
  - Hostinger separa el proyecto en dos directorios clave: `nodejs/` (donde vive el backend) y `public_html/` (donde se sirve el frontend estático por defecto si no es redirigido).
- **Variables de Entorno (.env)**:
  - **No subas el `.env` por Git**, ni crees archivos manuales en otras carpetas.
  - La forma correcta y segura de configurar credenciales es a través del **Panel de Hostinger**:
    1. Dirígete a **Despliegues > Ajustes y reimplementación**.
    2. Baja hasta **Variables de entorno** y haz clic en **Añadir**.
    3. Añade tus variables (`DB_HOST` siempre debe ser `localhost` dentro de Hostinger, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `NODE_ENV='production'`).
    4. Clic en **Guardar y reimplementar**. Esto reiniciará el backend y le inyectará las credenciales correctamente.
