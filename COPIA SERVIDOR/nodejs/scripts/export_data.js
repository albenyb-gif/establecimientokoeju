const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function exportData() {
    try {
        console.log('🚀 Iniciando exportación de datos para Hostinger...');

        const tables = [
            'establecimientos',
            'potreros',
            'rodeos',
            'categorias',
            'clientes',
            'compras_lotes',
            'animales',
            'pesajes',
            'ventas_lotes',
            'movimientos_salida',
            'movimientos_ingreso',
            'movimientos_internos',
            'insumos_stock',
            'sanidad_eventos',
            'agenda',
            'animales_marcas'
        ];

        let sqlDump = '-- Exportación de datos para Hostinger\n';
        sqlDump += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';

        for (const table of tables) {
            console.log(`📦 Procesando tabla: ${table}...`);
            const [rows] = await db.query(`SELECT * FROM ${table}`);

            if (rows.length > 0) {
                sqlDump += `-- Datos para ${table}\n`;
                sqlDump += `TRUNCATE TABLE ${table};\n`;

                const columns = Object.keys(rows[0]).join(', ');

                for (const row of rows) {
                    const values = Object.values(row).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        return val;
                    }).join(', ');

                    sqlDump += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
                }
                sqlDump += '\n';
            }
        }

        sqlDump += 'SET FOREIGN_KEY_CHECKS = 1;\n';

        const outputPath = path.join(__dirname, '../migrations/data_sync_export.sql');
        fs.writeFileSync(outputPath, sqlDump);

        console.log(`\n✅ ¡ÉXITO! Archivo generado en: ${outputPath}`);
        console.log('👉 Sube este archivo en el phpMyAdmin de tu Hostinger para sincronizar los datos.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error durante la exportación:', err);
        process.exit(1);
    }
}

exportData();
