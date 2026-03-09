const db = require('../config/db');

const runMigration = async () => {
    try {
        console.log('Running migration: 003_ovine_health_update');
        const connection = await db.getConnection();

        // 1. Update Animals Table for Ovine Support
        try {
            await connection.query("ALTER TABLE animales ADD COLUMN especie ENUM('BOVINO', 'OVINO', 'EQUINO', 'CAPRINO') DEFAULT 'BOVINO'");
            console.log('✅ Column "especie" added to "animales".');
        } catch (e) {
            console.log('⚠️ Column "especie" likely already exists.');
        }

        try {
            await connection.query("ALTER TABLE animales ADD COLUMN raza VARCHAR(50) DEFAULT NULL");
            console.log('✅ Column "raza" added to "animales".');
        } catch (e) {
            console.log('⚠️ Column "raza" likely already exists.');
        }

        // 2. Enhance Insumos Stock Table
        try {
            await connection.query("ALTER TABLE insumos_stock ADD COLUMN nombre_comercial VARCHAR(100) NOT NULL AFTER id");
            await connection.query("ALTER TABLE insumos_stock ADD COLUMN unidad_medida VARCHAR(20) DEFAULT 'dosis'"); // ml, dosis, frasco
            await connection.query("ALTER TABLE insumos_stock ADD COLUMN costo_unitario DECIMAL(10,2) DEFAULT 0");
            console.log('✅ Columns added to "insumos_stock".');
        } catch (e) {
            console.log('⚠️ Columns for "insumos_stock" likely already exist.');
        }

        // 3. Create Specific Table for Ovine Management (Optional, but good for specific fields like 'esquila')
        // For now, we fit everything in 'animales' + events.
        // But let's create a 'manejo_ovino' table for specific events if needed?
        // Actually, 'sanidad_eventos' covers vaccinations.
        // We might need 'produccion_events' for things like 'Esquila' (Wool production).

        const createWoolTable = `
            CREATE TABLE IF NOT EXISTS produccion_lana (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATE NOT NULL,
                cantidad_animales INT,
                kilos_totales DECIMAL(10,2),
                observaciones TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createWoolTable);
        console.log('✅ Table "produccion_lana" created.');

        // 4. Default Ovine Categories
        const ovineCategories = ['CORDERO', 'CORDERA', 'BORREGO', 'BORREGA', 'OVEJA', 'CARNERO', 'CAPON'];
        for (const cat of ovineCategories) {
            await connection.query('INSERT IGNORE INTO categorias (descripcion) VALUES (?)', [cat]);
        }
        console.log('✅ Ovine categories inserted.');

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
