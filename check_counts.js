const db = require('./backend/config/db');

async function check() {
    try {
        const [[{ activo }]] = await db.query("SELECT COUNT(*) as activo FROM animales WHERE estado_general = 'ACTIVO'");
        const [[{ no_activo }]] = await db.query("SELECT COUNT(*) as no_activo FROM animales WHERE estado_general != 'ACTIVO'");
        const [[{ comprados }]] = await db.query("SELECT SUM(cantidad_animales) as comprados FROM compras_lotes");
        const [estados] = await db.query("SELECT estado_general, COUNT(*) as count FROM animales GROUP BY estado_general");
        
        console.log('--- RESUMEN DE CANTIDADES ---');
        console.log('Animales ACTIVOS:', activo);
        console.log('Animales NO ACTIVOS:', no_activo);
        console.log('Total Comprados (Lotes):', comprados);
        console.log('Desglose por Estado:', estados);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
