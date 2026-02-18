const db = require('../config/db');

class ExpenseController {

    // GET /api/gastos?desde=...&hasta=...&categoria=...
    static async getAll(req, res) {
        try {
            const { desde, hasta, categoria } = req.query;
            let query = 'SELECT * FROM gastos WHERE 1=1';
            const params = [];

            if (desde) {
                query += ' AND fecha >= ?';
                params.push(desde);
            }
            if (hasta) {
                query += ' AND fecha <= ?';
                params.push(hasta);
            }
            if (categoria) {
                query += ' AND categoria = ?';
                params.push(categoria);
            }

            query += ' ORDER BY fecha DESC, created_at DESC';

            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            res.status(500).json({ error: 'Error al obtener gastos' });
        }
    }

    // POST /api/gastos
    static async create(req, res) {
        try {
            const { fecha, categoria, monto, descripcion, proveedor, comprobante_nro } = req.body;

            if (!fecha || !categoria || !monto) {
                return res.status(400).json({ error: 'Fecha, categoría y monto son obligatorios' });
            }

            const [result] = await db.query(
                'INSERT INTO gastos (fecha, categoria, monto, descripcion, proveedor, comprobante_nro) VALUES (?, ?, ?, ?, ?, ?)',
                [fecha, categoria, monto, descripcion || null, proveedor || null, comprobante_nro || null]
            );

            res.status(201).json({
                message: 'Gasto registrado exitosamente',
                id: result.insertId
            });
        } catch (error) {
            console.error('Error creating expense:', error);
            res.status(500).json({ error: 'Error al registrar gasto' });
        }
    }

    // GET /api/gastos/resumen?year=2026
    static async getSummary(req, res) {
        try {
            const year = req.query.year || new Date().getFullYear();

            // Total del mes actual
            const [mesActual] = await db.query(
                'SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())'
            );

            // Total del año
            const [anual] = await db.query(
                'SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE YEAR(fecha) = ?',
                [year]
            );

            // Promedio mensual del año
            const [promedio] = await db.query(
                `SELECT COALESCE(AVG(mes_total), 0) as promedio FROM (
                    SELECT SUM(monto) as mes_total FROM gastos 
                    WHERE YEAR(fecha) = ? 
                    GROUP BY MONTH(fecha)
                ) as meses`,
                [year]
            );

            // Categoría más costosa del año
            const [topCategoria] = await db.query(
                `SELECT categoria, SUM(monto) as total FROM gastos 
                 WHERE YEAR(fecha) = ? 
                 GROUP BY categoria ORDER BY total DESC LIMIT 1`,
                [year]
            );

            // Gastos por categoría (para gráfico de barras)
            const [porCategoria] = await db.query(
                `SELECT categoria as name, SUM(monto) as value FROM gastos 
                 WHERE YEAR(fecha) = ? 
                 GROUP BY categoria ORDER BY value DESC`,
                [year]
            );

            // Tendencia mensual (para gráfico de líneas)
            const [tendencia] = await db.query(
                `SELECT 
                    MONTH(fecha) as mes_num,
                    DATE_FORMAT(fecha, '%b') as mes,
                    SUM(monto) as total
                 FROM gastos 
                 WHERE YEAR(fecha) = ? 
                 GROUP BY mes_num, mes
                 ORDER BY mes_num`,
                [year]
            );

            const categoriasLabels = {
                'ALIMENTACION': 'Alimentación',
                'SANIDAD': 'Sanidad',
                'PERSONAL': 'Personal',
                'COMBUSTIBLE': 'Combustible',
                'MANTENIMIENTO': 'Mantenimiento',
                'TRANSPORTE': 'Transporte/Flete',
                'IMPUESTOS': 'Impuestos/Tasas',
                'SERVICIOS': 'Servicios',
                'OTROS': 'Otros'
            };

            res.json({
                kpis: {
                    gasto_mes: mesActual[0].total,
                    gasto_anual: anual[0].total,
                    promedio_mensual: Math.round(promedio[0].promedio),
                    top_categoria: topCategoria.length > 0
                        ? { nombre: categoriasLabels[topCategoria[0].categoria] || topCategoria[0].categoria, total: topCategoria[0].total }
                        : { nombre: '-', total: 0 }
                },
                por_categoria: porCategoria.map(c => ({
                    name: categoriasLabels[c.name] || c.name,
                    value: Number(c.value)
                })),
                tendencia_mensual: tendencia.map(t => ({
                    mes: t.mes,
                    total: Number(t.total)
                }))
            });
        } catch (error) {
            console.error('Error fetching expense summary:', error);
            res.status(500).json({ error: 'Error al obtener resumen de gastos' });
        }
    }

    // DELETE /api/gastos/:id
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM gastos WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Gasto no encontrado' });
            }

            res.json({ message: 'Gasto eliminado exitosamente' });
        } catch (error) {
            console.error('Error deleting expense:', error);
            res.status(500).json({ error: 'Error al eliminar gasto' });
        }
    }
}

module.exports = ExpenseController;
