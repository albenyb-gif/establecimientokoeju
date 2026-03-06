const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

async function test() {
    console.log('--- DB TEST ---');
    console.log('User:', process.env.DB_USER);
    console.log('DB:', process.env.DB_NAME);

    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    };

    // Try socket if production
    const socketPaths = [
        '/tmp/mysql.sock',
        '/tmp/mysqld.sock',
        '/var/lib/mysql/mysql.sock',
        '/run/mysqld/mysqld.sock',
        '/var/run/mysqld/mysqld.sock'
    ];

    for (const s of socketPaths) {
        if (require('fs').existsSync(s)) {
            config.socketPath = s;
            break;
        }
    }

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connection Successful');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));

        const [comprasCount] = await connection.query('SELECT COUNT(*) as count FROM compras_lotes');
        console.log('Compras Lotes Count:', comprasCount[0].count);

        const [clientesCount] = await connection.query('SELECT COUNT(*) as count FROM clientes');
        console.log('Clientes Count:', clientesCount[0].count);

        await connection.end();
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    }
}

test();
