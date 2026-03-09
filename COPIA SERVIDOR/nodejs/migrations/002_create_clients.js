const db = require('../config/db');

const runMigration = async () => {
    try {
        console.log('Running migration: 002_create_clients');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                ruc VARCHAR(20) UNIQUE,
                telefono VARCHAR(50),
                email VARCHAR(100),
                direccion TEXT,
                tipo ENUM('PARTICULAR', 'FRIGORIFICO', 'FERIA', 'PROVEEDOR') DEFAULT 'PARTICULAR',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await db.query(createTableQuery);
        console.log('✅ Table "clientes" created or already exists.');

        // Update ventas_lotes to link to cliente_id if we want, 
        // but for now let's keep it simple and just have the table for management.
        // We can add the column later.

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
