
const db = require('./config/db');

async function fixDuplicates() {
    try {
        console.log('--- REPARACIÓN DE ANIMALES COMPARTIDOS ---');

        // 1. Encontrar animales con más de un movimiento de ingreso
        const [dupes] = await db.query(`
            SELECT animal_id, COUNT(*) as c 
            FROM movimientos_ingreso 
            WHERE animal_id IS NOT NULL 
            GROUP BY animal_id 
            HAVING c > 1
        `);

        console.log(`Encontrados ${dupes.length} animales compartidos.`);

        for (const dupe of dupes) {
            const animalId = dupe.animal_id;
            console.log(`Reparando animal ID: ${animalId}...`);

            // Obtener todos los movimientos de este animal
            const [movs] = await db.query('SELECT id, compra_lote_id FROM movimientos_ingreso WHERE animal_id = ? ORDER BY id ASC', [animalId]);

            // Mantener el primero, desvincular el resto
            for (let i = 1; i < movs.length; i++) {
                const movId = movs[i].id;
                console.log(`  - Desvinculando movimiento ID ${movId} del lote ${movs[i].compra_lote_id}`);
                await db.query('UPDATE movimientos_ingreso SET animal_id = NULL WHERE id = ?', [movId]);
            }
        }

        console.log('✅ Desvinculación completada. Ahora se puede ejecutar el Sync para generar animales únicos.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

fixDuplicates();
