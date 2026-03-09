const db = require('./config/db');

async function check() {
    try {
        console.log('--- DIAGNÓSTICO DE DATOS ---');

        const [animals] = await db.query('SELECT COUNT(*) as total FROM animales');
        const [activeAnimals] = await db.query('SELECT COUNT(*) as total FROM animales WHERE estado_general = "ACTIVO"');
        const [lotes] = await db.query('SELECT COUNT(*) as total FROM compras_lotes');
        const [cabezasCompradas] = await db.query('SELECT SUM(cantidad_animales) as total FROM compras_lotes');

        console.log('Animales en tabla (Total):', animals[0].total);
        console.log('Animales Activos:', activeAnimals[0].total);
        console.log('Lotes de Compra:', lotes[0].total);
        console.log('Cabezas Compradas (Suma Lotes):', cabezasCompradas[0].total);

        // Intentar agregar columnas si no existen
        console.log('\n--- ACTUALIZANDO ESQUEMA ---');
        try {
            await db.query('ALTER TABLE compras_lotes ADD COLUMN comparador VARCHAR(20) AFTER vendedor');
            console.log('Columna comparador agregada a compras_lotes');
        } catch (e) {
            console.log('Info: Columna comparador ya existe o error en compras_lotes:', e.message);
        }

        try {
            await db.query('ALTER TABLE animales ADD COLUMN comparador VARCHAR(20) AFTER negocio_destino');
            console.log('Columna comparador agregada a animales');
        } catch (e) {
            console.log('Info: Columna comparador ya existe o error en animales:', e.message);
        }

    } catch (err) {
        console.error('Error durante el diagnóstico:', err);
    } finally {
        process.exit();
    }
}

check();
