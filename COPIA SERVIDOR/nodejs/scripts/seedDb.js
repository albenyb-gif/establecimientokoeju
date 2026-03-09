const db = require('../config/db');

async function seed() {
    try {
        console.log('Seeding database...');

        // 1. Clean existing data (optional, be careful)
        // await db.query('DELETE FROM movimientos_ingreso');
        // await db.query('DELETE FROM animales');
        // await db.query('DELETE FROM rodeos');
        // await db.query('DELETE FROM potreros');
        // await db.query('DELETE FROM establecimientos');

        // 1. Establecimiento
        const [est] = await db.query('INSERT INTO establecimientos (nombre, ruc, ubicacion_gps) VALUES (?, ?, ?)',
            ['Estancia El Amanecer', '8000000-1', '-25.2637, -57.5759']);
        const estId = est.insertId;

        // Categories
        await db.query("INSERT IGNORE INTO categorias (id, descripcion) VALUES (1, 'NOVILLO'), (2, 'VAQUILLA')");

        // 2. Potreros
        const potrerosData = [
            { nombre: 'Potrero Norte', superficie: 100 },
            { nombre: 'Bajo Río', superficie: 150 },
            { nombre: 'Monte Alto', superficie: 80 },
            { nombre: 'La Esperanza', superficie: 200 }
        ];

        for (const p of potrerosData) {
            const [resPot] = await db.query('INSERT INTO potreros (establecimiento_id, nombre, superficie_ha) VALUES (?, ?, ?)',
                [estId, p.nombre, p.superficie]);
            const potId = resPot.insertId;

            // 3. Rodeos (1 por potrero para simplificar)
            const [resRod] = await db.query('INSERT INTO rodeos (potrero_id, nombre) VALUES (?, ?)',
                [potId, `Rodeo ${p.nombre}`]);
            const rodeoId = resRod.insertId;

            // 4. Animales (Random count)
            const count = Math.floor(Math.random() * 50) + 10;
            console.log(`Seeding ${count} animals for ${p.nombre}...`);

            for (let i = 0; i < count; i++) {
                await db.query(`
                    INSERT INTO animales (
                        caravana_visual, peso_actual, rodeo_id, categoria_id, negocio_destino
                    ) VALUES (?, ?, ?, ?, ?)
                `, [
                    `V${Math.floor(Math.random() * 9000) + 1000}`,
                    Math.floor(Math.random() * 300) + 150,
                    rodeoId,
                    1, // Asumiendo ID 1 existe o es NULL, schema says int. We didn't seed categories.
                    ['ENGORDE', 'CRIA'][Math.floor(Math.random() * 2)]
                ]);
            }
        }

        console.log('Seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
}

seed();
