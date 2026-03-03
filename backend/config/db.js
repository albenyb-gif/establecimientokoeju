const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Prioridad de Host: 
// 1. Host real de Hostinger (srv1842.hstgr.io)
// 2. IP Directa (193.203.175.192)
// 3. Variable de entorno
let dbHost = process.env.DB_HOST || 'srv1842.hstgr.io';

// Forzar IP si detectamos loopback o localhost para evitar el error ::1
if (dbHost === 'localhost' || dbHost === '127.0.0.1' || !process.env.DB_HOST) {
    dbHost = 'srv1842.hstgr.io';
}

console.log('--- DIAGNÓSTICO DE CONEXIÓN HOSTINGER ---');
console.log('📡 Host en uso:', dbHost);
console.log('👤 Usuario:', (process.env.DB_USER || 'root').trim());
console.log('🗄️ Base de Datos:', (process.env.DB_NAME || 'gestion_ganadera').trim());
console.log('------------------------------------------');

const pool = mysql.createPool({
    host: dbHost,
    user: (process.env.DB_USER || 'root').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),
    database: (process.env.DB_NAME || 'gestion_ganadera').trim(),
    waitForConnections: true,
    connectionLimit: 10, // Aumentado para producción
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

const promisePool = pool.promise();

// Self-healing migrations (Runs ONCE on startup)
async function runMigrations() {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Connected to Database for Migrations');

        // 1. Clientes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                ruc VARCHAR(20),
                telefono VARCHAR(50),
                email VARCHAR(100),
                direccion TEXT,
                tipo ENUM('PARTICULAR', 'FRIGORIFICO', 'FERIA', 'PROVEEDOR') DEFAULT 'PARTICULAR',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        try { await connection.query('ALTER TABLE clientes DROP INDEX ruc'); } catch (e) { }

        // 2. Compras Lotes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS compras_lotes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATE NOT NULL,
                cantidad_animales INT NOT NULL,
                pelaje VARCHAR(50),
                costo_unitario DECIMAL(15,2),
                vendedor VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        const comprasColumns = [
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS costo_total DECIMAL(15,2)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS nro_guia VARCHAR(50)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS comision_feria DECIMAL(15,2)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS flete DECIMAL(15,2)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS tasas DECIMAL(15,2)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS porcentaje_ganancia DECIMAL(5,2)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS ganancia_estimada DECIMAL(15,2)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS peso_promedio_compra DECIMAL(10,2)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS peso_total DECIMAL(10,2)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS lugar_procedencia VARCHAR(100)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(50)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS nro_cot VARCHAR(50)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS observaciones TEXT'
        ];
        for (const sql of comprasColumns) { try { await connection.query(sql); } catch (e) { } }

        // 3. Gastos
        await connection.query(`
            CREATE TABLE IF NOT EXISTS gastos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATE NOT NULL,
                categoria VARCHAR(50),
                monto DECIMAL(15,2) NOT NULL,
                descripcion TEXT,
                proveedor VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        try { await connection.query('ALTER TABLE gastos ADD COLUMN IF NOT EXISTS comprobante_nro VARCHAR(50)'); } catch (e) { }

        // 4. Animales (Ensure new columns exist)
        const animalsColumns = [
            'ALTER TABLE animales ADD COLUMN IF NOT EXISTS caravana_rfid VARCHAR(50)',
            'ALTER TABLE animales ADD COLUMN IF NOT EXISTS pelaje VARCHAR(50)',
            'ALTER TABLE animales ADD COLUMN IF NOT EXISTS negocio_destino ENUM("CRIA", "ENGORDE", "CABAÑA") DEFAULT "ENGORDE"',
            'ALTER TABLE animales ADD COLUMN IF NOT EXISTS estado_sanitario ENUM("ACTIVO", "BLOQUEADO", "CUARENTENA") DEFAULT "ACTIVO"',
            'ALTER TABLE animales ADD COLUMN IF NOT EXISTS precio_compra DECIMAL(15,2) DEFAULT 0',
            'ALTER TABLE animales ADD COLUMN IF NOT EXISTS peso_inicial DECIMAL(10,2)',
            'ALTER TABLE animales ADD COLUMN IF NOT EXISTS peso_actual DECIMAL(10,2)'
        ];
        for (const sql of animalsColumns) { try { await connection.query(sql); } catch (e) { } }

        // 5. Movimientos Salida (Sales)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS movimientos_salida (
                id INT AUTO_INCREMENT PRIMARY KEY,
                venta_lote_id INT,
                animal_id INT,
                fecha_salida DATE NOT NULL,
                peso_salida DECIMAL(10,2),
                precio_kg_real DECIMAL(15,2),
                motivo_salida VARCHAR(50) DEFAULT 'VENTA',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 6. Ovinos
        await connection.query(`
            CREATE TABLE IF NOT EXISTS produccion_lana (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATE NOT NULL,
                cantidad_animales INT,
                kilos_totales DECIMAL(10,2),
                observaciones TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS pariciones_ovinas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATE NOT NULL,
                madre_id INT,
                cantidad_crias INT NOT NULL,
                sexo_crias VARCHAR(20),
                raza VARCHAR(50),
                observaciones TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 7. Sanidad
        await connection.query(`
            CREATE TABLE IF NOT EXISTS insumos_stock (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_comercial VARCHAR(100) NOT NULL,
                principio_activo VARCHAR(100),
                descripcion TEXT,
                dias_carencia INT DEFAULT 0,
                lote VARCHAR(50),
                vencimiento DATE,
                stock_actual DECIMAL(10,2) DEFAULT 0,
                unidad_medida VARCHAR(20),
                costo_unitario DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sanidad_eventos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo_evento VARCHAR(50) NOT NULL,
                animal_id INT,
                producto_id INT,
                fecha_aplicacion DATE NOT NULL,
                fecha_fin_carencia DATE,
                nro_acta VARCHAR(50),
                lote_vencimiento VARCHAR(50),
                responsable VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 8. Agenda
        await connection.query(`
            CREATE TABLE IF NOT EXISTS agenda (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(100) NOT NULL,
                descripcion TEXT,
                tipo VARCHAR(50),
                fecha_hora DATETIME NOT NULL,
                ubicacion VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        connection.release();
        console.log('🚀 DB Self-Healing Completed');
    } catch (err) {
        console.error('⚠️ Migration skipped (Lack of permissions or DB Offline):', err.message);
    }
}

runMigrations();

module.exports = promisePool;
