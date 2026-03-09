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

    console.log('--- DIAGNÓSTICO DE TABLAS (TRAZABILIDAD) ---');
    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ Conexión establecida.');

        const tables = [
            'animales',
            'categorias',
            'rodeos',
            'pesajes',
            'sanidad_eventos',
            'movimientos_ingreso',
            'movimientos_salida',
            'movimientos_internos',
            'animales_marcas'
        ];

        for (const table of tables) {
            try {
                const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`📊 Tabla [${table}]: ✅ EXISTE (${rows[0].count} registros)`);
            } catch (err) {
                console.log(`❌ Tabla [${table}]: NO EXISTE o ERROR (${err.message})`);
            }
        }

    } catch (error) {
        console.error('❌ Error general:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

diagnostic();
