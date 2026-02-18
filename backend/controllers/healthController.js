const db = require('../config/db');

class HealthController {

    // --- INSUMOS / STOCK MANAGEMENT ---

    static async getStock(req, res) {
        try {
            const [rows] = await db.query('SELECT * FROM insumos_stock ORDER BY nombre_comercial');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching stock:', error);
            res.status(500).json({ error: 'Error al obtener stock de insumos' });
        }
    }

    static async getStockById(req, res) {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM insumos_stock WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Insumo no encontrado' });
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener insumo' });
        }
    }

    static async createInsumo(req, res) {
        const { nombre_comercial, principio_activo, descripcion, dias_carencia, lote, vencimiento, stock_actual, unidad_medida, costo_unitario } = req.body;
        try {
            const [result] = await db.query(
                `INSERT INTO insumos_stock 
                (nombre_comercial, principio_activo, descripcion, dias_carencia, lote, vencimiento, stock_actual, unidad_medida, costo_unitario) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nombre_comercial, principio_activo, descripcion, dias_carencia, lote, vencimiento, stock_actual, unidad_medida, costo_unitario]
            );
            res.status(201).json({ message: 'Insumo registrado', id: result.insertId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al registrar insumo' });
        }
    }

    static async updateInsumo(req, res) {
        const { id } = req.params;
        const { nombre_comercial, principio_activo, descripcion, dias_carencia, lote, vencimiento, stock_actual, unidad_medida, costo_unitario } = req.body;
        try {
            await db.query(
                `UPDATE insumos_stock 
                SET nombre_comercial=?, principio_activo=?, descripcion=?, dias_carencia=?, lote=?, vencimiento=?, stock_actual=?, unidad_medida=?, costo_unitario=?
                WHERE id=?`,
                [nombre_comercial, principio_activo, descripcion, dias_carencia, lote, vencimiento, stock_actual, unidad_medida, costo_unitario, id]
            );
            res.json({ message: 'Insumo actualizado' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar insumo' });
        }
    }

    static async deleteInsumo(req, res) {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM insumos_stock WHERE id = ?', [id]);
            res.json({ message: 'Insumo eliminado' });
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar insumo' });
        }
    }

    // --- SANITARY EVENTS / HISTORY ---

    static async getEvents(req, res) {
        try {
            const query = `
                SELECT e.*, i.nombre_comercial as producto_nombre, count(a.id) as cantidad_animales
                FROM sanidad_eventos e
                LEFT JOIN insumos_stock i ON i.id = e.producto_id
                LEFT JOIN animales a ON a.id = e.animal_id -- This join is tricky if event is 1-to-1. 
                -- Current schema is 1 event row per animal? Or 1 event row per "Action"?
                -- Schema says: animal_id INT. So it is 1 row per animal per event.
                -- For listing "Events" as Batches (e.g. "Vaccination Total Herd"), we might want to group by date/type.
                GROUP BY e.fecha_aplicacion, e.tipo_evento, e.producto_id
                ORDER BY e.fecha_aplicacion DESC
            `;
            // Simplified view: Just list individual events for now or group manually in frontend?
            // Let's return raw list for now to keep it simple, or improved query?
            // Let's trigger a query that joins with animals to show details.
            const rawQuery = `
                SELECT e.id, e.fecha_aplicacion, e.tipo_evento, e.nro_acta, e.lote_vencimiento,
                       i.nombre_comercial as producto,
                       a.caravana_visual as animal
                FROM sanidad_eventos e
                LEFT JOIN insumos_stock i ON i.id = e.producto_id
                LEFT JOIN animales a ON a.id = e.animal_id
                ORDER BY e.fecha_aplicacion DESC
                LIMIT 100
            `;
            const [rows] = await db.query(rawQuery);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener eventos' });
        }
    }

    static async registerGroupEvent(req, res) {
        // Register event for multiple animals (e.g. Lote Terneros)
        const { fecha_aplicacion, tipo_evento, producto_id, animales_ids, nro_acta, responsable } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Get Product info for Carencia
            let dias_carencia = 0;
            if (producto_id) {
                const [prodRows] = await connection.query('SELECT dias_carencia, stock_actual, nombre_comercial FROM insumos_stock WHERE id = ?', [producto_id]);
                if (prodRows.length > 0) {
                    dias_carencia = prodRows[0].dias_carencia || 0;

                    // Deduct Stock (1 dosis per animal logic?) 
                    // Assuming 1 unit per animal for simplicity, or we could ask for "dosis_total"
                    const newStock = prodRows[0].stock_actual - animales_ids.length;
                    await connection.query('UPDATE insumos_stock SET stock_actual = ? WHERE id = ?', [newStock, producto_id]);
                }
            }

            // 2. Calc Carencia Date
            let fecha_fin_carencia = null;
            if (dias_carencia > 0) {
                const f = new Date(fecha_aplicacion);
                f.setDate(f.getDate() + dias_carencia);
                fecha_fin_carencia = f.toISOString().split('T')[0];
            }

            // 3. Insert Events per Animal
            for (const animalId of animales_ids) {
                await connection.query(
                    `INSERT INTO sanidad_eventos 
                    (tipo_evento, animal_id, producto_id, fecha_aplicacion, fecha_fin_carencia, nro_acta) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [tipo_evento, animalId, producto_id, fecha_aplicacion, fecha_fin_carencia, nro_acta]
                );

                // 4. Update Animal Status if Carencia
                if (fecha_fin_carencia) {
                    await connection.query(
                        "UPDATE animales SET estado_sanitario = 'CUARENTENA', fecha_liberacion_carencia = ? WHERE id = ?",
                        [fecha_fin_carencia, animalId]
                    );
                }
            }

            await connection.commit();
            res.json({ message: 'Evento sanitario registrado exitosamente', cantidad: animales_ids.length });

        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ error: 'Error al registrar evento grupal' });
        } finally {
            connection.release();
        }
    }
}

module.exports = HealthController;
