
const db = require('./config/db');

async function diagnostic() {
    try {
        console.log('--- DIAGNÓSTICO DE DESCUADRE ---');

        const [totalAnimales] = await db.query("SELECT COUNT(*) as c FROM animales");
        console.log('Total de animales en tabla:', totalAnimales[0].c);

        const [totalActivos] = await db.query("SELECT COUNT(*) as c FROM animales WHERE estado_general = 'ACTIVO'");
        console.log('Animales ACTIVOS:', totalActivos[0].c);

        const [totalMovs] = await db.query("SELECT COUNT(*) as c FROM movimientos_ingreso");
        console.log('Total de movimientos de ingreso:', totalMovs[0].c);

        const [totalHeadsPurchased] = await db.query("SELECT SUM(cantidad_animales) as s FROM compras_lotes");
        console.log('Total cabezas compradas (SUM):', totalHeadsPurchased[0].s);

        const [orphans] = await db.query(`
            SELECT mi.id, mi.compra_lote_id, mi.animal_id 
            FROM movimientos_ingreso mi 
            LEFT JOIN animales a ON a.id = mi.animal_id 
            WHERE a.id IS NULL
        `);
        console.log('Movimientos con animal_id INEXISTENTE:', orphans.length);

        const [duplicates] = await db.query(`
            SELECT animal_id, COUNT(*) as c 
            FROM movimientos_ingreso 
            GROUP BY animal_id 
            HAVING c > 1
        `);
        console.log('Animales con más de un movimiento de ingreso:', duplicates.length);

        const [lotsInfo] = await db.query(`
            SELECT c.id, c.cantidad_animales, COUNT(mi.id) as movs_count
            FROM compras_lotes c
            LEFT JOIN movimientos_ingreso mi ON mi.compra_lote_id = c.id
            GROUP BY c.id
            HAVING c.cantidad_animales != movs_count
        `);
        console.log('Lotes con descuadre entre cantidad y movimientos:', lotsInfo.length);
        if (lotsInfo.length > 0) console.log('Detalle de lotes:', JSON.stringify(lotsInfo));

        process.exit(0);
    } catch (err) {
        console.error('Error en diagnóstico:', err);
        process.exit(1);
    }
}

diagnostic();
