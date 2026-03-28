/**
 * Migraciones Automáticas (Self-Healing) para la Base de Datos.
 * Extraído de db.js para mejorar la modularidad (Agente Estructura).
 */

async function runMigrations(promisePool) {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Connected to Database for Migrations');

        // Helper para agregar columnas de forma segura
        const addColumnSafe = async (table, column, definition) => {
            try {
                const [cols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
                if (cols.length === 0) {
                    console.log(`➕ Agregando columna ${column} a ${table}...`);
                    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
                }
            } catch (err) {
                console.error(`❌ Error asegurando columna ${column} en ${table}:`, err.message);
            }
        };

        // --- Definición de Tablas ---
        
        // Establecimientos y Estructura
        await connection.query(`CREATE TABLE IF NOT EXISTS establecimientos (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, ruc VARCHAR(20), ubicacion_gps VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS potreros (id INT AUTO_INCREMENT PRIMARY KEY, establecimiento_id INT, nombre VARCHAR(50) NOT NULL, superficie_ha DECIMAL(10,2), FOREIGN KEY (establecimiento_id) REFERENCES establecimientos(id) ON DELETE CASCADE)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS rodeos (id INT AUTO_INCREMENT PRIMARY KEY, potrero_id INT, nombre VARCHAR(50) NOT NULL, FOREIGN KEY (potrero_id) REFERENCES potreros(id) ON DELETE CASCADE)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS categorias (id INT AUTO_INCREMENT PRIMARY KEY, descripcion VARCHAR(50) NOT NULL UNIQUE)`);

        // Datos maestros (Categorías SENACSA)
        const [cats] = await connection.query('SELECT COUNT(*) as count FROM categorias');
        if (cats[0].count === 0) {
            await connection.query(`INSERT IGNORE INTO categorias (descripcion) VALUES ('TERNERO'), ('DESMAMANTE_M'), ('DESMAMANTE_H'), ('NOVILLO_1_2'), ('NOVILLO_2_3'), ('NOVILLO_3_MAS'), ('VAQUILLONA'), ('VACA'), ('TORO'), ('CORDERO'), ('CORDERA'), ('BORREGO'), ('BORREGA'), ('OVEJA'), ('CARNERO'), ('CAPON')`);
        }

        // Clientes
        await connection.query(`CREATE TABLE IF NOT EXISTS clientes (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, ruc VARCHAR(20), telefono VARCHAR(50), email VARCHAR(100), direccion TEXT, tipo ENUM('PARTICULAR', 'FRIGORIFICO', 'FERIA', 'PROVEEDOR') DEFAULT 'PARTICULAR', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

        // Compras
        await connection.query(`CREATE TABLE IF NOT EXISTS compras_lotes (id INT AUTO_INCREMENT PRIMARY KEY, fecha DATE NOT NULL, cantidad_animales INT NOT NULL, pelaje VARCHAR(50), costo_unitario DECIMAL(15,2), vendedor VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        const purchaseCols = [['costo_total', 'DECIMAL(15,2)'], ['nro_guia', 'VARCHAR(50)'], ['comision_feria', 'DECIMAL(15,2)'], ['flete', 'DECIMAL(15,2)'], ['tasas', 'DECIMAL(15,2)'], ['porcentaje_ganancia', 'DECIMAL(5,2)'], ['ganancia_estimada', 'DECIMAL(15,2)'], ['peso_promedio_compra', 'DECIMAL(10,2)'], ['peso_total', 'DECIMAL(10,2)'], ['lugar_procedencia', 'VARCHAR(100)'], ['tipo_documento', 'VARCHAR(50)'], ['nro_cot', 'VARCHAR(50)'], ['observaciones', 'TEXT'], ['comparador', 'VARCHAR(100)'], ['tipo_ingreso', 'VARCHAR(20) DEFAULT "masivo"']];
        for (const [col, def] of purchaseCols) await addColumnSafe('compras_lotes', col, def);

        // Gastos
        await connection.query(`CREATE TABLE IF NOT EXISTS gastos (id INT AUTO_INCREMENT PRIMARY KEY, fecha DATE NOT NULL, categoria VARCHAR(50), monto DECIMAL(15,2) NOT NULL, descripcion TEXT, proveedor VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await addColumnSafe('gastos', 'comprobante_nro', 'VARCHAR(50)');

        // Animales
        await connection.query(`CREATE TABLE IF NOT EXISTS animales (id INT AUTO_INCREMENT PRIMARY KEY, caravana_visual VARCHAR(20) UNIQUE NOT NULL, caravana_rfid VARCHAR(50) UNIQUE, categoria_id INT, rodeo_id INT, peso_actual DECIMAL(10,2), fecha_nacimiento DATE, negocio_destino ENUM('CRIA', 'ENGORDE', 'CABAÑA') DEFAULT 'ENGORDE', estado_general ENUM('ACTIVO', 'VENDIDO', 'MUERTO', 'CONSUMO') DEFAULT 'ACTIVO', estado_sanitario ENUM('ACTIVO', 'BLOQUEADO', 'CUARENTENA') DEFAULT 'ACTIVO', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (categoria_id) REFERENCES categorias(id), FOREIGN KEY (rodeo_id) REFERENCES rodeos(id))`);
        const animalCols = [['pelaje', 'VARCHAR(50)'], ['precio_compra', 'DECIMAL(15,2) DEFAULT 0'], ['peso_inicial', 'DECIMAL(10,2)'], ['comparador', 'VARCHAR(100)'], ['fecha_liberacion_carencia', 'DATE'], ['raza', 'VARCHAR(50)'], ['especie', "ENUM('BOVINO', 'OVINO', 'EQUINO', 'CAPRINO') DEFAULT 'BOVINO'"]];
        for (const [col, def] of animalCols) await addColumnSafe('animales', col, def);

        // Movimientos y Pesajes
        await connection.query(`CREATE TABLE IF NOT EXISTS pesajes (id INT AUTO_INCREMENT PRIMARY KEY, animal_id INT, peso_kg DECIMAL(10,2) NOT NULL, gdp_calculado DECIMAL(10,3), fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS ventas_lotes (id INT AUTO_INCREMENT PRIMARY KEY, fecha DATE NOT NULL, cliente VARCHAR(100), destino VARCHAR(100), cantidad_animales INT, peso_total DECIMAL(10,2), precio_promedio_kg DECIMAL(15,2), total_bruto DECIMAL(15,2), descuentos_total DECIMAL(15,2), total_neto DECIMAL(15,2), observaciones TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS movimientos_salida (id INT AUTO_INCREMENT PRIMARY KEY, venta_lote_id INT, animal_id INT, fecha_salida DATE NOT NULL, peso_salida DECIMAL(10,2), precio_kg_real DECIMAL(15,2), motivo_salida VARCHAR(50) DEFAULT 'VENTA', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS movimientos_internos (id INT AUTO_INCREMENT PRIMARY KEY, animal_id INT NOT NULL, fecha DATE NOT NULL, origen_rodeo_id INT, destino_rodeo_id INT, motivo TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE)`);

        // Ovinos y Sanidad
        await connection.query(`CREATE TABLE IF NOT EXISTS produccion_lana (id INT AUTO_INCREMENT PRIMARY KEY, fecha DATE NOT NULL, cantidad_animales INT, kilos_totales DECIMAL(10,2), observaciones TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS pariciones_ovinas (id INT AUTO_INCREMENT PRIMARY KEY, fecha DATE NOT NULL, madre_id INT, cantidad_crias INT NOT NULL, sexo_crias VARCHAR(20), raza VARCHAR(50), observaciones TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS insumos_stock (id INT AUTO_INCREMENT PRIMARY KEY, nombre_comercial VARCHAR(100) NOT NULL, principio_activo VARCHAR(100), descripcion TEXT, dias_carencia INT DEFAULT 0, lote VARCHAR(50), vencimiento DATE, stock_actual DECIMAL(10,2) DEFAULT 0, unidad_medida VARCHAR(20), costo_unitario DECIMAL(15,2) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS sanidad_eventos (id INT AUTO_INCREMENT PRIMARY KEY, tipo_evento VARCHAR(50) NOT NULL, animal_id INT, producto_id INT, fecha_aplicacion DATE NOT NULL, fecha_fin_carencia DATE, nro_acta VARCHAR(50), lote_vencimiento VARCHAR(50), responsable VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

        // Agenda y Marcas
        await connection.query(`CREATE TABLE IF NOT EXISTS agenda (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(100) NOT NULL, descripcion TEXT, tipo VARCHAR(50), fecha_hora DATETIME NOT NULL, ubicacion VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await connection.query(`CREATE TABLE IF NOT EXISTS animales_marcas (id INT AUTO_INCREMENT PRIMARY KEY, animal_id INT NOT NULL, foto_path VARCHAR(255) NOT NULL, tipo_marca VARCHAR(50) DEFAULT 'PROPIA', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE)`);

        // Reparación de estados
        console.log('🔄 Verificando integridad de estados...');
        await connection.query("UPDATE animales SET estado_general = 'ACTIVO' WHERE estado_general IS NULL");
        await connection.query("UPDATE animales SET estado_sanitario = 'ACTIVO' WHERE estado_sanitario IS NULL");

        connection.release();
        console.log('🚀 DB Self-Healing Completed');
    } catch (err) {
        console.error('⚠️ Migration skipped:', err.message);
    }
}

module.exports = { runMigrations };
