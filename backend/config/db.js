const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion_ganadera',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Test Connection (Non-fatal)
pool.getConnection((err, connection) => {
    if (err) {
        console.warn('⚠️ WARNING: Database connection failed. Running in MOCK/OFFLINE mode.');
        console.warn(`   Error Details: ${err.message}`);
    } else {
        console.log('✅ Database connected successfully');
        connection.release();
    }
});

module.exports = promisePool;
