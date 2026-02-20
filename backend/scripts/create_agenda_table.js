const pool = require('../config/db');

async function createAgendaTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS agenda (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        tipo ENUM('REUNION', 'VENTA', 'COMPRA', 'SANIDAD', 'OTRO') DEFAULT 'OTRO',
        fecha_hora DATETIME NOT NULL,
        ubicacion VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    try {
        await pool.query(sql);
        console.log('✅ Tabla "agenda" creada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear la tabla "agenda":', error);
        process.exit(1);
    }
}

createAgendaTable();
