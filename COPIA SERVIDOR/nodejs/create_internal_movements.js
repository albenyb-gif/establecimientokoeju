const db = require('./config/db');

async function createTable() {
    console.log('Attempting to connect to database...');
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        console.log('Database connection test successful:', rows[0].solution === 2);

        console.log('Creating table movimientos_internos...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS movimientos_internos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                animal_id INT,
                fecha DATE NOT NULL,
                origen_rodeo_id INT,
                destino_rodeo_id INT,
                motivo VARCHAR(100),
                FOREIGN KEY (animal_id) REFERENCES animales(id),
                FOREIGN KEY (origen_rodeo_id) REFERENCES rodeos(id),
                FOREIGN KEY (destino_rodeo_id) REFERENCES rodeos(id)
            )
        `);
        console.log('Table movimientos_internos created or already exists');
        process.exit(0);
    } catch (error) {
        console.error('DATABASE ERROR:', error);
        console.error('SQL State:', error.sqlState);
        console.error('SQL Code:', error.code);
        process.exit(1);
    }
}

createTable();
