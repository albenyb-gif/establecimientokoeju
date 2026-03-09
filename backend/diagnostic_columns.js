require('dotenv').config();
const mysql = require('mysql2/promise');

async function diagnostic() {
    const config = {
        host: '127.0.0.1',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim().replace(/\\/g, '') : '',
        database: process.env.DB_NAME,
        port: 3306
    };

    console.log('--- DIAGNÓSTICO DE COLUMNAS (DETALLE) ---');
    let connection;
    try {
        connection = await mysql.createConnection(config);

        const tables = ['animales', 'insumos_stock'];
        for (const table of tables) {
            console.log(`\n🔍 Estructura de tabla: [${table}]`);
            try {
                const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
                columns.forEach(col => {
                    console.log(`  - ${col.Field} (${col.Type})`);
                });
            } catch (err) {
                console.log(`  ❌ Error al leer tabla: ${err.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

diagnostic();
