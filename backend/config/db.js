const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fs = require('fs');

// Configuración base del pool
const poolConfig = {
    user: (process.env.DB_USER || 'root').trim(),
    password: (process.env.DB_PASSWORD || '').trim().replace(/\\/g, ''),
    database: (process.env.DB_NAME || 'gestion_ganadera').trim(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

// Log simple de conexión exitosa
console.log('✅ Conexión a Base de Datos establecida correctamente.');

// Simplificar host: Forzar 127.0.0.1 en producción para evitar errores de IPv6 (::1)
let dbHost = process.env.DB_HOST || '127.0.0.1';
if (process.env.NODE_ENV === 'production' || dbHost === 'localhost') {
    dbHost = '127.0.0.1';
}
poolConfig.host = dbHost;
poolConfig.port = 3306;
console.log('🔗 Intentando conectar a:', poolConfig.host);

console.log('--- DIAGNÓSTICO DB ---');
console.log('👤', poolConfig.user, '| 🗄️', poolConfig.database);
console.log('🔗', poolConfig.socketPath || poolConfig.host);
console.log('----------------------');

const { runMigrations } = require('./migrations');

const pool = mysql.createPool(poolConfig);
const promisePool = pool.promise();

// Ejecutar migraciones automáticas al iniciar
runMigrations(promisePool);

module.exports = promisePool;
