const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fs = require('fs');

// Configuración base del pool
const poolConfig = {
    user: (process.env.DB_USER || 'root').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),
    database: (process.env.DB_NAME || 'gestion_ganadera').trim(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

// Detectar el socket Unix disponible en el servidor
const socketPaths = [
    '/tmp/mysql.sock',
    '/tmp/mysqld.sock',
    '/var/lib/mysql/mysql.sock',
    '/run/mysqld/mysqld.sock',
    '/var/run/mysqld/mysqld.sock'
];

if (process.env.NODE_ENV === 'production') {
    const foundSocket = socketPaths.find(p => {
        try { return fs.existsSync(p); } catch (e) { return false; }
    });
    if (foundSocket) {
        poolConfig.socketPath = foundSocket;
        console.log('🔌 Socket encontrado:', foundSocket);
    } else {
        // Fallback: TCP localhost si no hay socket
        poolConfig.host = '127.0.0.1';
        poolConfig.port = 3306;
        console.log('⚠️ No se encontró socket, usando TCP 127.0.0.1:3306');
    }
} else {
    poolConfig.host = process.env.DB_HOST || '127.0.0.1';
    console.log('💻 Modo desarrollo:', poolConfig.host);
}

console.log('--- DIAGNÓSTICO DB ---');
console.log('👤', poolConfig.user, '| 🗄️', poolConfig.database);
console.log('🔗', poolConfig.socketPath || poolConfig.host);
console.log('----------------------');

const pool = mysql.createPool(poolConfig);

const promisePool = pool.promise();

// Self-healing migrations (Runs ONCE on startup)
async function runMigrations() {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Connected to Database for Migrations');

        // 0. Infraestructura y Categorías
        await connection.query(`
            CREATE TABLE IF NOT EXISTS establecimientos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                ruc VARCHAR(20),
                ubicacion_gps VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS potreros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                establecimiento_id INT,
                nombre VARCHAR(50) NOT NULL,
                superficie_ha DECIMAL(10,2),
                FOREIGN KEY (establecimiento_id) REFERENCES establecimientos(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS rodeos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                potrero_id INT,
                nombre VARCHAR(50) NOT NULL,
                FOREIGN KEY (potrero_id) REFERENCES potreros(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS categorias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                descripcion VARCHAR(50) NOT NULL UNIQUE
            )
        `);

        // Insert default categories if empty
        const [cats] = await connection.query('SELECT COUNT(*) as count FROM categorias');
        if (cats[0].count === 0) {
            await connection.query(`
                INSERT IGNORE INTO categorias (descripcion) VALUES 
                ('TERNERO MACHO'), ('TERNERO HEMBRA'), ('DESMAMANTE MACHO'), ('DESMAMANTE HEMBRA'),
                ('VAQUILLA'), ('TORO'), ('NOVILLO'), ('VACA'), ('VAQUILLONA')
            `);
        }

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
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS observaciones TEXT',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS comparador VARCHAR(20)',
            'ALTER TABLE compras_lotes ADD COLUMN IF NOT EXISTS tipo_ingreso VARCHAR(20) DEFAULT "masivo"'
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
            'ALTER TABLE animales ADD COLUMN IF NOT EXISTS peso_actual DECIMAL(10,2)',
            'ALTER TABLE animales ADD COLUMN IF NOT EXISTS comparador VARCHAR(20)'
        ];
        for (const sql of animalsColumns) { try { await connection.query(sql); } catch (e) { } }

        // 4.1 Pesajes (GDP Tracking)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS pesajes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                animal_id INT,
                peso_kg DECIMAL(10,2) NOT NULL,
                gdp_calculado DECIMAL(10,3),
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
            )
        `);

        // 5. Movimientos Salida (Sales)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ventas_lotes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATE NOT NULL,
                cliente VARCHAR(100),
                destino VARCHAR(100),
                cantidad_animales INT,
                peso_total DECIMAL(10,2),
                precio_promedio_kg DECIMAL(15,2),
                total_bruto DECIMAL(15,2),
                descuentos_total DECIMAL(15,2),
                total_neto DECIMAL(15,2),
                observaciones TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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

        // 5.1 Movimientos Internos (Traslados)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS movimientos_internos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                animal_id INT NOT NULL,
                fecha DATE NOT NULL,
                origen_rodeo_id INT,
                destino_rodeo_id INT,
                motivo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
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

        // 9. Animales Marcas (Brand Photos)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS animales_marcas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                animal_id INT NOT NULL,
                foto_path VARCHAR(255) NOT NULL,
                tipo_marca VARCHAR(50) DEFAULT 'PROPIA',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
            )
        `);

        // 9. DATA RECOVERY: Fix missing states for dashboard consistency
        console.log('🔄 Verificando integridad de estados...');
        await connection.query("UPDATE animales SET estado_general = 'ACTIVO' WHERE estado_general IS NULL");
        await connection.query("UPDATE animales SET estado_sanitario = 'ACTIVO' WHERE estado_sanitario IS NULL");

        connection.release();
        console.log('🚀 DB Self-Healing Completed');
    } catch (err) {
        console.error('⚠️ Migration skipped (Lack of permissions or DB Offline):', err.message);
    }
}

runMigrations();

module.exports = promisePool;
