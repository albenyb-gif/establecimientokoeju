const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDb() {
    let connection;
    try {
        // Connect without database selected
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        const dbName = process.env.DB_NAME || 'gestion_ganadera';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Database '${dbName}' ready.`);

        await connection.changeUser({ database: dbName });

        const sqlPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to get individual statements, filtering out empty ones
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

        console.log(`Executing ${statements.length} statements...`);

        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
            }
        }

        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

initDb();
