const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: '127.0.0.1', // Force IPv4
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion_ganadera'
});

async function migrate_categories() {
    try {
        console.log('Starting Categories Migration...');
        const connection = await db.getConnection();

        // New Categories to Add
        // User requested: DESMAMANTE H, DESMAMANTE M, TERNORO H, TERNERO M, VAQUILLA, TORO.
        // Existing: TERNERO, DESMAMANTE_M, DESMAMANTE_H, NOVILLO_1_2, NOVILLO_2_3, NOVILLO_3_MAS, VAQUILLONA, VACA, TORO
        // Action:
        // - Add 'TERNERO M'
        // - Add 'TERNERO H'
        // - Add 'VAQUILLA' (User specifically asked for it, distinct from VAQUILLONA? Let's add it)

        const newCategories = [
            'TERNERO M',
            'TERNERO H',
            'VAQUILLA'
        ];

        for (const cat of newCategories) {
            await connection.query('INSERT IGNORE INTO categorias (descripcion) VALUES (?)', [cat]);
            console.log(`Ensured category: ${cat}`);
        }

        console.log('Categories migration completed.');
        connection.release();
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate_categories();
