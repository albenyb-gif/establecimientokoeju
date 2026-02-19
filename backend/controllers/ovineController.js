const db = require('../config/db');

class OvineController {

    // --- ESTADISTICAS ---
    static async getStats(req, res) {
        try {
            // Total ovinos activos
            const [rows] = await db.query("SELECT COUNT(*) as total FROM animales WHERE especie = 'OVINO' AND estado_general = 'ACTIVO'");
            const total = rows[0].total;

            // Corderos al pie
            const [cordRows] = await db.query("SELECT COUNT(*) as corderos FROM animales WHERE especie = 'OVINO' AND estado_general = 'ACTIVO' AND categoria_id IN (SELECT id FROM categorias WHERE descripcion IN ('CORDERO', 'CORDERA'))");
            const corderos = cordRows[0].corderos;

            // Ovejas adultas
            const [ovejaRows] = await db.query("SELECT COUNT(*) as ovejas FROM animales WHERE especie = 'OVINO' AND estado_general = 'ACTIVO' AND categoria_id IN (SELECT id FROM categorias WHERE descripcion = 'OVEJA')");
            const ovejas = ovejaRows[0].ovejas;

            // Esquila pendiente: adultos ovinos no esquilados en últimos 10 meses
            const adultos = total - corderos;
            const [lastEsquila] = await db.query(
                "SELECT SUM(cantidad_animales) as esquilados FROM produccion_lana WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 10 MONTH)"
            );
            const esquiladosReciente = parseInt(lastEsquila[0].esquilados || 0);
            const esquila_pendiente = Math.max(0, adultos - esquiladosReciente);

            // Stock de lana total acumulado
            const [woolStock] = await db.query("SELECT SUM(kilos_totales) as total_kg FROM produccion_lana");
            const stock_lana = parseFloat(woolStock[0].total_kg || 0);

            // Total pariciones
            let total_pariciones = 0;
            try {
                const [parRows] = await db.query("SELECT COUNT(*) as total_pariciones FROM pariciones_ovinas");
                total_pariciones = parRows[0].total_pariciones;
            } catch (e) {
                // Table might not exist yet
            }

            res.json({
                total,
                corderos,
                ovejas,
                esquila_pendiente,
                stock_lana,
                total_pariciones
            });
        } catch (error) {
            console.error('Error in ovine stats:', error.message);
            res.json({
                total: 0,
                corderos: 0,
                ovejas: 0,
                esquila_pendiente: 0,
                stock_lana: 0,
                total_pariciones: 0
            });
        }
    }

    // --- ESQUILA (LANA) ---
    static async registerShearing(req, res) {
        const { fecha, kilos_totales, cantidad_animales, observaciones } = req.body;
        try {
            const [result] = await db.query(
                `INSERT INTO produccion_lana (fecha, cantidad_animales, kilos_totales, observaciones) VALUES (?, ?, ?, ?)`,
                [fecha, cantidad_animales, kilos_totales, observaciones]
            );
            res.json({ message: 'Esquila registrada exitosamente', id: result.insertId });
        } catch (error) {
            console.error('Error en registerShearing:', error);
            res.status(500).json({ error: 'Error al registrar esquila' });
        }
    }

    static async getWoolHistory(req, res) {
        try {
            const [rows] = await db.query(
                `SELECT id, fecha, cantidad_animales, kilos_totales, observaciones 
                 FROM produccion_lana 
                 ORDER BY fecha DESC`
            );
            res.json(rows);
        } catch (error) {
            console.error('Error en getWoolHistory:', error);
            res.json([]);
        }
    }

    // --- PARICIONES ---
    static async registerParicion(req, res) {
        const { fecha, madre_id, cantidad_crias, sexo_crias, raza, observaciones } = req.body;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Registrar evento de parición
            const [parResult] = await connection.query(
                `INSERT INTO pariciones_ovinas (fecha, madre_id, cantidad_crias, sexo_crias, raza, observaciones) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [fecha, madre_id || null, cantidad_crias, sexo_crias || 'MIXTO', raza || null, observaciones]
            );
            const paricionId = parResult.insertId;

            // 2. Crear animales corderos/corderas
            const qty = parseInt(cantidad_crias) || 1;
            const createdIds = [];

            for (let i = 0; i < qty; i++) {
                // Determinar sexo y categoría
                let categoria = 'CORDERO';
                if (sexo_crias === 'HEMBRA' || (sexo_crias === 'MIXTO' && i % 2 === 1)) {
                    categoria = 'CORDERA';
                }

                // Buscar ID de categoría
                const [catRows] = await connection.query(
                    'SELECT id FROM categorias WHERE descripcion = ?', [categoria]
                );
                const catId = catRows.length > 0 ? catRows[0].id : null;

                // Caravana temporal
                const caravana = `PAR-${paricionId}-${(i + 1).toString().padStart(2, '0')}`;

                // Insertar animal
                const [animResult] = await connection.query(
                    `INSERT INTO animales (caravana_visual, categoria_id, especie, raza, fecha_nacimiento, estado_general) 
                     VALUES (?, ?, 'OVINO', ?, ?, 'ACTIVO')`,
                    [caravana, catId, raza || null, fecha]
                );
                createdIds.push(animResult.insertId);
            }

            await connection.commit();
            res.json({
                message: `Parición registrada: ${qty} cría(s) creada(s)`,
                paricion_id: paricionId,
                animales_creados: createdIds.length
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error en registerParicion:', error);
            res.status(500).json({ error: 'Error al registrar parición' });
        } finally {
            connection.release();
        }
    }

    static async getPariciones(req, res) {
        try {
            const [rows] = await db.query(
                `SELECT p.*, m.caravana_visual as madre_caravana 
                 FROM pariciones_ovinas p 
                 LEFT JOIN animales m ON p.madre_id = m.id 
                 ORDER BY p.fecha DESC`
            );
            res.json(rows);
        } catch (error) {
            console.error('Error en getPariciones:', error);
            res.json([]);
        }
    }
}

module.exports = OvineController;
