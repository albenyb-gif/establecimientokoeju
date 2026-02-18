const db = require('../config/db');

const runMigration = async () => {
    try {
        console.log('Running migration: 004_gastos');
        const connection = await db.getConnection();

        const createGastosTable = `
            CREATE TABLE IF NOT EXISTS gastos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATE NOT NULL,
                categoria ENUM(
                    'ALIMENTACION', 'SANIDAD', 'PERSONAL', 'COMBUSTIBLE',
                    'MANTENIMIENTO', 'TRANSPORTE', 'IMPUESTOS', 'SERVICIOS', 'OTROS'
                ) NOT NULL,
                monto DECIMAL(15,2) NOT NULL,
                descripcion VARCHAR(255),
                proveedor VARCHAR(100),
                comprobante_nro VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createGastosTable);
        console.log('✅ Table "gastos" created.');

        connection.release();
        console.log('✅ Migration 004_gastos completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
