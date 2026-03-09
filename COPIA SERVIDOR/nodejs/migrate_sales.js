const db = require('./config/db');

async function migrate() {
    try {
        console.log('Starting Sales Module Migration...');
        const connection = await db.getConnection();

        // 1. Add estado_general to animals if not exists
        try {
            // Check if column exists
            const [cols] = await connection.query("SHOW COLUMNS FROM animales LIKE 'estado_general'");
            if (cols.length === 0) {
                console.log('Adding estado_general column to animales...');
                await connection.query("ALTER TABLE animales ADD COLUMN estado_general ENUM('ACTIVO', 'VENDIDO', 'MUERTO', 'CONSUMO') DEFAULT 'ACTIVO'");
            } else {
                console.log('Column estado_general already exists.');
            }
        } catch (err) {
            console.error('Error checking/adding column:', err.message);
        }

        // 2. Create ventas_lotes
        console.log('Creating ventas_lotes table...');
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

        // 3. Create movimientos_salida
        console.log('Creating movimientos_salida table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS movimientos_salida (
                id INT AUTO_INCREMENT PRIMARY KEY,
                venta_lote_id INT,
                animal_id INT,
                fecha_salida DATE,
                peso_salida DECIMAL(10,2),
                precio_kg_real DECIMAL(15,2),
                motivo_salida ENUM('VENTA', 'MUERTE', 'CONSUMO', 'ROBO') DEFAULT 'VENTA',
                FOREIGN KEY (venta_lote_id) REFERENCES ventas_lotes(id) ON DELETE CASCADE,
                FOREIGN KEY (animal_id) REFERENCES animales(id)
            )
        `);

        console.log('Migration completed successfully.');
        connection.release();
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
