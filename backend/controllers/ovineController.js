const db = require('../config/db');

class OvineController {

    // --- ESTADISTICAS ---
    static async getStats(req, res) {
        try {
            // Totales
            const [rows] = await db.query("SELECT COUNT(*) as total FROM animales WHERE especie = 'OVINO'");
            const total = rows[0].total;

            const [cordRows] = await db.query("SELECT COUNT(*) as corderos FROM animales WHERE especie = 'OVINO' AND categoria_id IN (SELECT id FROM categorias WHERE descripcion IN ('CORDERO', 'CORDERA'))");
            const corderos = cordRows[0].corderos;

            const [ovejaRows] = await db.query("SELECT COUNT(*) as ovejas FROM animales WHERE especie = 'OVINO' AND categoria_id IN (SELECT id FROM categorias WHERE descripcion = 'OVEJA')");
            const ovejas = ovejaRows[0].ovejas;

            // Esquila Pendiente (Ej: todos los adultos con lana > X meses, o manual flag?)
            // Simplificación: Todos los adultos que no se han esquilado en 12 meses.
            // O manual flag 'apto_esquila'.
            // Vamos a devolver 0 por ahora o un mock de "Lista para esquila"
            const esquila_pendiente = 0;

            res.json({
                total,
                corderos,
                ovejas,
                esquila_pendiente
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener estadísticas ovinas' });
        }
    }

    // --- WOOL PRODUCTION ---
    static async registerShearing(req, res) {
        const { fecha, kilos_totales, cantidad_animales, observaciones } = req.body;
        try {
            await db.query(
                `INSERT INTO produccion_lana (fecha, cantidad_animales, kilos_totales, observaciones) VALUES (?, ?, ?, ?)`,
                [fecha, cantidad_animales, kilos_totales, observaciones]
            );
            res.json({ message: 'Esquila registrada exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al registrar esquila' });
        }
    }

    static async getWoolHistory(req, res) {
        try {
            const [rows] = await db.query("SELECT YEAR(fecha) as year, SUM(kilos_totales) as kgs FROM produccion_lana GROUP BY YEAR(fecha) ORDER BY year ASC");
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener historial de lana' });
        }
    }
}

module.exports = OvineController;
