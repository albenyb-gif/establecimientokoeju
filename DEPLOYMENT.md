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
3. Importa la base de datos:
   - Usa el archivo `backend/migrations/full_schema.sql` para crear la estructura inicial en MySQL.
   - **NUEVO**: Ejecuta el script SQL para la agenda:
     ```sql
     CREATE TABLE IF NOT EXISTS agenda (
         id INT AUTO_INCREMENT PRIMARY KEY,
         titulo VARCHAR(255) NOT NULL,
         descripcion TEXT,
         tipo ENUM('REUNION', 'VENTA', 'COMPRA', 'SANIDAD', 'OTRO') DEFAULT 'OTRO',
         fecha_hora DATETIME NOT NULL,
         ubicacion VARCHAR(255),
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
     ```

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
