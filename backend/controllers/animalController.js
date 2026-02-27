const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/marcas');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}


class AnimalController {

    /**
     * SIAP: Actualización Masiva de Identificación
     */
    static async batchUpdateIds(req, res) {
        const { updates } = req.body; // Array of { id, caravana_visual, caravana_rfid }

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        const connection = await db.getConnection();
        const resultados = { exitosos: 0, errores: 0 };

        try {
            await connection.beginTransaction();

            for (const item of updates) {
                try {
                    // Update Query
                    // Note: caravana_visual must be unique. If conflict, it will throw error.
                    await connection.query(
                        'UPDATE animales SET caravana_visual = ?, caravana_rfid = ? WHERE id = ?',
                        [item.caravana_visual, item.caravana_rfid || null, item.id]
                    );
                    resultados.exitosos++;
                } catch (innerError) {
                    console.error(`Error updating animal ${item.id}:`, innerError.message);
                    resultados.errores++;
                }
            }

            await connection.commit();
            res.json({ message: 'Proceso finalizado', resultados });

        } catch (error) {
            await connection.rollback();
            console.error('Error in batchUpdateIds:', error);
            res.status(500).json({ error: 'Error al actualizar identificaciones' });
        } finally {
            connection.release();
        }
    }

    /**
     * Módulo de Compras (Planilla / Lotes)
     * Registra un lote de compra y genera automáticamente los animales.
     */
    static async registrarCompraLote(req, res) {
        const {
            fecha, cantidad, pelaje, kilos_compra, vendedor, lugar,
            documento, observaciones, costo_unitario, peso_total,
            ganancia_estimada, nro_cot, nro_guia,
            comision_feria, flete, tasas, porcentaje_ganancia
        } = req.body;

        // 1. Procesar Imagen Global/Documento
        let foto_marca_path = null;
        const globalFile = req.files?.find(f => f.fieldname === 'file');

        if (globalFile) {
            const fileName = `marca_${Date.now()}.webp`;
            const filePath = path.join(uploadsDir, fileName);
            try {
                await sharp(globalFile.buffer).resize(800).webp({ quality: 80 }).toFile(filePath);
                foto_marca_path = `/uploads/marcas/${fileName}`;
            } catch (err) {
                console.error("Error processing document image:", err);
            }
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Insertar Lote de Compra
            const [loteResult] = await connection.query(
                `INSERT INTO compras_lotes 
                (fecha, cantidad_animales, pelaje, peso_promedio_compra, peso_total, costo_unitario, ganancia_estimada, vendedor, lugar_procedencia, tipo_documento, observaciones, nro_cot)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [fecha, cantidad, pelaje, kilos_compra, peso_total, costo_unitario, ganancia_estimada, vendedor, lugar, documento, observaciones, nro_cot]
            );
            const loteId = loteResult.insertId;

            // 1.1 Insertar Gastos Automáticos
            const baseCost = parseFloat(cantidad) * parseFloat(costo_unitario);
            await connection.query(
                'INSERT INTO gastos (fecha, categoria, monto, descripcion, proveedor) VALUES (?, "OTROS", ?, ?, ?)',
                [fecha, baseCost, `Compra de Lote #${loteId} (${cantidad} animales)`, vendedor]
            );

            if (parseFloat(comision_feria) > 0) {
                await connection.query(
                    'INSERT INTO gastos (fecha, categoria, monto, descripcion, proveedor) VALUES (?, "SERVICIOS", ?, ?, ?)',
                    [fecha, parseFloat(comision_feria) * 1.10, `Comisión Compra Lote #${loteId}`, 'Feria/Intermediario']
                );
            }

            if (parseFloat(flete) > 0) {
                await connection.query(
                    'INSERT INTO gastos (fecha, categoria, monto, descripcion, proveedor) VALUES (?, "TRANSPORTE", ?, ?, ?)',
                    [fecha, parseFloat(flete) * 1.10, `Flete Lote #${loteId}`, 'Transportista']
                );
            }

            if (parseFloat(tasas) > 0) {
                await connection.query(
                    'INSERT INTO gastos (fecha, categoria, monto, descripcion, proveedor) VALUES (?, "IMPUESTOS", ?, ?, ?)',
                    [fecha, tasas, `Tasas Municipales/SENACSA Lote #${loteId}`, 'Estado']
                );
            }

            // 2. Procesar Animales Individuales
            const qty = parseInt(cantidad);
            const tipoIngreso = req.body.tipo_ingreso || 'masivo';
            let animalesDetalle = [];

            if (tipoIngreso === 'detallado' && req.body.animales) {
                try {
                    animalesDetalle = JSON.parse(req.body.animales);
                } catch (e) {
                    console.error('Error parsing animals detail:', e);
                }
            }

            // Categoria ID por defecto
            let defaultCatId = req.body.categoria_id ? parseInt(req.body.categoria_id) : null;
            if (!defaultCatId) {
                let categoriaDefecto = 'VAQUILLA';
                if (kilos_compra < 180) categoriaDefecto = 'TERNERO MACHO';
                else if (kilos_compra < 250) categoriaDefecto = 'DESMAMANTE MACHO';
                try {
                    const [catResult] = await connection.query('SELECT id FROM categorias WHERE descripcion = ?', [categoriaDefecto]);
                    defaultCatId = catResult.length > 0 ? catResult[0].id : null;
                } catch (catErr) {
                    console.error('Error auto-selecting category:', catErr);
                }
            }

            for (let i = 0; i < qty; i++) {
                const det = animalesDetalle[i] || {};
                let caravana = det.caravana_visual || `L${loteId}-${(i + 1).toString().padStart(3, '0')}`;
                let rfid = det.caravana_rfid || null;
                let pesoIndividual = det.peso || kilos_compra;
                let costoIndividual = det.costo || costo_unitario;
                let catIndividual = det.categoria_id || defaultCatId;
                let pelajeIndividual = det.pelaje || req.body.pelaje || 'SIN ESPECIFICAR';

                // Insert Animal
                const [animResult] = await connection.query(
                    `INSERT INTO animales (caravana_visual, caravana_electronica, peso_actual, peso_inicial, precio_compra, categoria_id, pelaje, negocio_destino, estado_sanitario)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'ENGORDE', 'ACTIVO')`,
                    [caravana, rfid, pesoIndividual, pesoIndividual, costoIndividual, catIndividual, pelajeIndividual]
                );
                const animalId = animResult.insertId;

                // 2.1 Registrar Pesaje Inicial para GDP
                await connection.query(
                    'INSERT INTO pesajes (animal_id, peso_kg, fecha) VALUES (?, ?, ?)',
                    [animalId, pesoIndividual, fecha]
                );

                // 2.2 Procesar Múltiples Marcas/Fotos para este animal
                const animalFiles = req.files?.filter(f => f.fieldname === `marcas_animal_${i}`);
                if (animalFiles && animalFiles.length > 0) {
                    for (const fileObj of animalFiles) {
                        const mFileName = `marca_anim_${animalId}_${Date.now()}_${Math.floor(Math.random() * 1000)}.webp`;
                        const mFilePath = path.join(uploadsDir, mFileName);
                        try {
                            await sharp(fileObj.buffer).resize(800).webp({ quality: 80 }).toFile(mFilePath);
                            const fotoPath = `/uploads/marcas/${mFileName}`;
                            await connection.query(
                                'INSERT INTO animales_marcas (animal_id, foto_path, tipo_marca) VALUES (?, ?, ?)',
                                [animalId, fotoPath, 'VENDEDOR']
                            );
                        } catch (imgErr) {
                            console.error(`Error processing image for animal ${animalId}:`, imgErr);
                        }
                    }
                }

                // 3. Registrar Movimiento de Ingreso
                const cotReal = nro_cot || `LOTE-${loteId}`;
                await connection.query(
                    `INSERT INTO movimientos_ingreso (compra_lote_id, fecha_ingreso, origen, animal_id, nro_cot, nro_guia_traslado, foto_marca_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [loteId, fecha, lugar, animalId, cotReal, nro_guia, foto_marca_path]
                );
            }

            await connection.commit();
            res.json({ message: 'Lote de compra registrado exitosamente', loteId, animales_creados: qty });

        } catch (error) {
            await connection.rollback();
            console.error('Error registrarCompraLote:', error);
            res.status(500).json({ error: 'Error al procesar la compra', details: error.message });
        } finally {
            connection.release();
        }
    }

    /**
     * Listar Historial de Compras
     */
    static async getPurchaseHistory(req, res) {
        try {
            const [rows] = await db.query('SELECT * FROM compras_lotes ORDER BY fecha DESC');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching purchase history:', error);
            res.status(500).json({ error: 'Error al obtener historial de compras' });
        }
    }

    /**
     * Eliminar Lote de Compra
     */
    static async deletePurchaseLote(req, res) {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM compras_lotes WHERE id = ?', [id]);
            res.json({ message: 'Registro de lote eliminado' });
        } catch (error) {
            console.error('Error deleting purchase lote:', error);
            res.status(500).json({ error: 'Error al eliminar lote' });
        }
    }
    static async registrarIngreso(req, res) {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            const { nro_cot, nro_guia, fecha, origen, cantidad, categoria_id, especie } = req.body;
            let foto_marca_path = null;

            // 1. Procesamiento de Imagen
            if (req.file) {
                const fileName = `marca_${Date.now()}.webp`;
                const filePath = path.join(uploadsDir, fileName);
                await sharp(req.file.buffer).resize(800).webp({ quality: 80 }).toFile(filePath);
                foto_marca_path = `/uploads/marcas/${fileName}`;
            }

            // 2. Generar Animales y Movimientos
            const qty = parseInt(cantidad) || 0;
            const catId = categoria_id ? parseInt(categoria_id) : null;
            const createdIds = [];

            // Si quantity > 0, creamos fichas individuales
            if (qty > 0) {
                for (let i = 0; i < qty; i++) {
                    const tempCaravana = `ING-${Date.now()}-${i}`;

                    // Insert Animal
                    const [animResult] = await connection.query(
                        'INSERT INTO animales (caravana_visual, categoria_id, especie, estado_general) VALUES (?, ?, ?, ?)',
                        [tempCaravana, catId, especie || 'BOVINO', 'ACTIVO']
                    );
                    // Actually, let's double check schema for `fecha_ingreso` in `animales`.
                    // Schema: 
                    // 38: CREATE TABLE IF NOT EXISTS animales (
                    // ... 
                    // 45: fecha_nacimiento DATE,
                    // ...
                    // 9: created_at TIMESTAMP

                    // It does NOT have fecha_ingreso. The movement holds the date.

                    const animalId = animResult.insertId;
                    createdIds.push(animalId);

                    // Insert Movement
                    await connection.query(
                        'INSERT INTO movimientos_ingreso (nro_cot, nro_guia_traslado, fecha_ingreso, origen, foto_marca_path, animal_id) VALUES (?, ?, ?, ?, ?, ?)',
                        [nro_cot, nro_guia, fecha, origen, foto_marca_path, animalId]
                    );
                }
            } else {
                // If qty 0 (just document logging?), insert one movement with null animal?
                // Or error? IngresoForm requires quantity > 0.
                // We'll assuming qty > 0.
            }

            await connection.commit();
            res.status(201).json({
                message: `Ingreso registrado. ${qty} animales creados.`,
                count: qty,
                cot: nro_cot
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error en registrarIngreso:', error);
            res.status(500).json({ error: 'Error interno del servidor', details: error.message });
        } finally {
            connection.release();
        }
    }

    /**
     * Importación Masiva (Excel/CSV) con Lógica Upsert
     */
    static async importMasiva(req, res) {
        const data = req.body; // Array de objetos desde el parser de Excel
        const resultados = { creados: 0, actualizados: 0, errores: 0 };

        try {
            for (const item of data) {
                const { caravana, peso, campo, lote, rodeo, categoria, negocio } = item;

                try {
                    // Lógica UPSERT:
                    const [existing] = await db.query('SELECT id, peso_actual FROM animales WHERE caravana_visual = ?', [caravana]);

                    // Resolver IDs for foreign keys (rodeos, categorias) - Simplified: Assuming they exist or passed as IDs
                    // If names are passed, we'd need to lookup IDs here. For simplicity, assume IDs or simple logic.
                    // Let's assume input needs to be mapped to IDs if they are names.

                    // Fetch category ID by name if needed, or default
                    // This part depends on how specific the business logic is. For now, we will handle basic upsert.

                    if (existing.length > 0) {
                        // Si existe: Actualizar
                        // Calcular ganancia diaria antes de actualizar if needed
                        // const ganancia = peso - existing[0].peso_actual;

                        await db.query(
                            'UPDATE animales SET peso_actual = ?, negocio_destino = ? WHERE id = ?',
                            [peso, negocio, existing[0].id]
                        );
                        resultados.actualizados++;
                    } else {
                        // Si no existe: Crear
                        await db.query(
                            'INSERT INTO animales (caravana_visual, peso_actual, negocio_destino) VALUES (?, ?, ?)',
                            [caravana, peso, negocio]
                        );
                        resultados.creados++;
                    }
                } catch (innerError) {
                    console.error(`Error processing item ${caravana}:`, innerError);
                    resultados.errores++;
                }
            }

            res.json({ message: 'Procesamiento masivo finalizado', resultados });
        } catch (error) {
            console.error('Error en importMasiva:', error);
            res.status(500).json({ error: 'Error durante la importación masiva' });
        }
    }
    /**
     * Dashboard: Obtener estadísticas de carga por potrero.
     */
    static async getDashboardStats(req, res) {
        try {
            const query = `
                SELECT 
                    p.id, 
                    p.nombre, 
                    p.superficie_ha, 
                    COUNT(a.id) as animales_total 
                FROM potreros p 
                LEFT JOIN rodeos r ON r.potrero_id = p.id 
                LEFT JOIN animales a ON a.rodeo_id = r.id 
                GROUP BY p.id
            `;
            const [rows] = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error in getDashboardStats:', error.message);
            res.json([]);
        }
    }
    /**
     * Listado: Obtener lista completa de animales.
     */
    static async getAnimals(req, res) {
        try {
            const { estado } = req.query;
            let query = `
                SELECT 
                    a.id, 
                    a.caravana_visual, 
                    c.descripcion as categoria, 
                    r.nombre as rodeo, 
                    a.peso_actual, 
                    a.negocio_destino as negocio,
                    a.estado_sanitario,
                    a.estado_general,
                    a.fecha_liberacion_carencia
                FROM animales a
                LEFT JOIN categorias c ON c.id = a.categoria_id
                LEFT JOIN rodeos r ON r.id = a.rodeo_id
            `;

            const params = [];
            if (estado) {
                query += ' WHERE a.estado_general = ?';
                params.push(estado);
            } else {
                // Default to showing all or just active? Let's show all if no filter, or maybe LIMIT if no filter.
                // If filter is present, maybe we want all of them for selection?
            }

            query += ' ORDER BY a.id DESC';

            if (!estado) {
                query += ' LIMIT 50';
            }

            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error('Error in getAnimals:', error.message);
            res.json([]);
        }
    }
    /**
     * Detalle: Obtener un animal por ID.
     */
    static async getAnimalById(req, res) {
        const { id } = req.params;
        try {
            const query = `
                SELECT 
                    a.*,
                    c.descripcion as categoria, 
                    r.nombre as rodeo,
                    (SELECT gdp_calculado FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as ultimo_gdp
                FROM animales a
                LEFT JOIN categorias c ON c.id = a.categoria_id
                LEFT JOIN rodeos r ON r.id = a.rodeo_id
                WHERE a.id = ?
            `;
            const [rows] = await db.query(query, [id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Animal no encontrado' });

            const animal = rows[0];
            // Fetch multiple brands
            const [brands] = await db.query('SELECT foto_path, tipo_marca FROM animales_marcas WHERE animal_id = ?', [id]);
            animal.marcas = brands || [];

            res.json(animal);
        } catch (error) {
            console.error(`Error in getAnimalById(${id}):`, error.message);
            res.status(500).json({ error: 'Error al obtener animal' });
        }
    }
    /**
     * Edición: Actualizar datos de un animal.
     */
    static async updateAnimal(req, res) {
        const { id } = req.params;
        const { peso_actual, rodeo_id, estado_sanitario, categoria_id } = req.body;

        try {
            // Try actual update
            await db.query(
                'UPDATE animales SET peso_actual = ?, rodeo_id = ?, estado_sanitario = ?, categoria_id = ? WHERE id = ?',
                [peso_actual, rodeo_id, estado_sanitario, categoria_id, id]
            );
            res.json({ message: 'Animal actualizado correctamente', id });
        } catch (error) {
            console.error(`Error in updateAnimal(${id}):`, error.message);
            res.status(500).json({ error: 'Error al actualizar animal' });
        }
    }
    /**
     * Análisis de Costos y Rentabilidad (Mock)
     */
    static async getCostAnalysis(req, res) {
        try {
            // 1. Calculate Total Income (Ventas)
            const [salesRows] = await db.query('SELECT SUM(total_neto) as total FROM ventas_lotes');
            const totalIncome = parseFloat(salesRows[0].total || 0);

            // 2. Calculate Total Expenses (Compras)
            // Note: We calculate total as quantity * unit_cost because we didn't save total_cost in some rows
            const [purchaseRows] = await db.query('SELECT SUM(cantidad_animales * costo_unitario) as total FROM compras_lotes');
            const totalPurchases = parseFloat(purchaseRows[0].total || 0);

            // 3. Other Expenses (Mock/Placeholder for now, or assume 0 if not tracked)
            // Ideally we would have an 'expenses' table for salaries, maintenance, etc.
            // For now, let's include a fixed estimate or relevant calculated costs from 'sanidad_eventos' if we had costs there.
            // Let's assume 0 for now to keep it "REAL" based on entered data, or maybe a small fixed overhead if requested.
            // User complained "Nothing appears", so let's show the data we have.
            const otherExpenses = 0;

            const totalExpenses = totalPurchases + otherExpenses;
            const rentabilidad = totalIncome - totalExpenses;
            const margin = totalIncome > 0 ? ((rentabilidad / totalIncome) * 100).toFixed(1) : 0;

            // 4. Breakdown for Charts
            // Real Purchase Cost vs Others
            const gastos_por_categoria = [
                { name: 'Compra Hacienda', value: totalPurchases },
                { name: 'Sanidad', value: 0 }, // Placeholder
                { name: 'Alimentación', value: 0 }, // Placeholder
                { name: 'Operativos', value: 0 } // Placeholder
            ];

            // 5. Monthly Trend (Mocked for visual, or calculate from sales history)
            // Let's try to get real sales per month for the chart?
            // Simple query for sales per month
            const [monthlySales] = await db.query(`
                SELECT DATE_FORMAT(fecha, '%b') as mes, SUM(total_neto) as total 
                FROM ventas_lotes 
                GROUP BY DATE_FORMAT(fecha, '%Y-%m') 
                ORDER BY fecha DESC LIMIT 6
            `);
            // This is Income, not "Cost per Kilo". 
            // The chart asks for "Costo por Kg Producido". This is hard to calc without more data.
            // Let's keep the mock trend for that specific chart but labeled "Simulado" or return empty if we want to be strict.
            // Better to return 0s if no data, or a flat line.
            const costo_kilo_producido = [
                { mes: 'Actual', costo: 0 }
            ];

            const analysis = {
                resumen: {
                    gastos_totales: totalExpenses,
                    ingresos_totales: totalIncome,
                    rentabilidad: rentabilidad,
                    margen: margin
                },
                gastos_por_categoria,
                costo_kilo_producido
            };
            res.json(analysis);

        } catch (error) {
            console.error('Error in getCostAnalysis:', error);
            res.status(500).json({ error: 'Error al calcular costos' });
        }
    }

    // Registra Pesaje y Calcula GDP (Cattler-PY Logic)
    static async registerWeight(req, res) {
        const { id } = req.params;
        const { peso_kg } = req.body;

        try {
            // 1. Obtener último pesaje y datos del animal
            const [lastWeights] = await db.query(
                'SELECT * FROM pesajes WHERE animal_id = ? ORDER BY fecha DESC LIMIT 1',
                [id]
            );

            const [animalData] = await db.query(
                'SELECT a.*, c.descripcion as categoria_desc FROM animales a JOIN categorias c ON c.id = a.categoria_id WHERE a.id = ?',
                [id]
            );

            let gdp = 0;
            if (lastWeights.length > 0) {
                const prev = lastWeights[0];
                const daysDiff = (new Date() - new Date(prev.fecha)) / (1000 * 60 * 60 * 24);

                if (daysDiff > 0) {
                    gdp = (peso_kg - prev.peso_kg) / daysDiff;
                }
            }

            // 2. Insertar nuevo pesaje
            await db.query(
                'INSERT INTO pesajes (animal_id, peso_kg, gdp_calculado) VALUES (?, ?, ?)',
                [id, peso_kg, gdp]
            );

            // 3. Actualizar animal y Verificar Cambio de Categoría (Auto-Upgrade)
            let newCategoryMessage = null;
            let updateQuery = 'UPDATE animales SET peso_actual = ? WHERE id = ?';
            let updateParams = [peso_kg, id];

            // Regla de Negocio: Desmamante Macho > 250kg -> Novillo 1-2
            if (animalData[0] && animalData[0].categoria_desc === 'DESMAMANTE_M' && peso_kg > 250) {
                // Buscar ID de Novillo 1-2
                const [catRow] = await db.query("SELECT id FROM categorias WHERE descripcion = 'NOVILLO_1_2'");
                if (catRow.length > 0) {
                    updateQuery = 'UPDATE animales SET peso_actual = ?, categoria_id = ? WHERE id = ?';
                    updateParams = [peso_kg, catRow[0].id, id];
                    newCategoryMessage = 'Animal promovido a NOVILLO 1-2 por peso > 250kg';
                }
            }

            await db.query(updateQuery, updateParams);

            res.json({
                message: 'Pesaje registrado',
                gdp: gdp.toFixed(3),
                category_upgrade: newCategoryMessage
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al registrar peso' });
        }
    }

    // Registrar Evento Sanitario (Vacunación/Tratamiento)
    static async registerHealthEvent(req, res) {
        const { id } = req.params;
        const { tipo_evento, fecha_aplicacion, producto, dias_carencia, detalles } = req.body;

        try {
            // Calcular Fecha Liberación si hay carencia
            let fecha_liberacion = null;
            let estado_sanitario = 'ACTIVO';

            if (dias_carencia > 0) {
                const fechaApp = new Date(fecha_aplicacion);
                fechaApp.setDate(fechaApp.getDate() + parseInt(dias_carencia));
                fecha_liberacion = fechaApp.toISOString().split('T')[0];
                estado_sanitario = 'CUARENTENA'; // O BLOQUEADO
            }

            // 1. Insertar Evento
            // Nota: simplificado, 'producto' se guarda como string en mock o ID si existiera tabla productos
            // Para este MVP usaremos nro_acta como campo genérico de detalle si no hay ID producto
            await db.query(
                'INSERT INTO sanidad_eventos (tipo_evento, animal_id, fecha_aplicacion, fecha_fin_carencia, lote_vencimiento) VALUES (?, ?, ?, ?, ?)',
                [tipo_evento, id, fecha_aplicacion, fecha_liberacion, detalles] // detalles = lote/acta
            );

            // 2. Actualizar Estado del Animal si hay carencia
            if (fecha_liberacion) {
                await db.query(
                    'UPDATE animales SET estado_sanitario = ?, fecha_liberacion_carencia = ? WHERE id = ?',
                    [estado_sanitario, fecha_liberacion, id]
                );
            }

            res.json({
                message: 'Evento sanitario registrado',
                bloqueo: fecha_liberacion ? `Animal bloqueado hasta ${fecha_liberacion}` : 'Sin restricciones'
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al registrar evento sanitario' });
        }
    }
    // Informe Ranking GDP (Cabeza vs Cola)
    static async getGDPRanking(req, res) {
        try {
            // Ranking Cabeza (Top 5)
            const [top] = await db.query(`
                SELECT p.animal_id, a.caravana_visual, p.gdp_calculado, p.fecha 
                FROM pesajes p
                JOIN animales a ON a.id = p.animal_id
                WHERE p.gdp_calculado > 0
                ORDER BY p.gdp_calculado DESC
                LIMIT 5
            `);

            // Ranking Cola (Bottom 5)
            const [bottom] = await db.query(`
                SELECT p.animal_id, a.caravana_visual, p.gdp_calculado, p.fecha 
                FROM pesajes p
                JOIN animales a ON a.id = p.animal_id
                WHERE p.gdp_calculado > 0
                ORDER BY p.gdp_calculado ASC
                LIMIT 5
            `);

            res.json({ cabeza: top, cola: bottom });

        } catch (error) {
            console.error('Error fetching ranking:', error);
            res.status(500).json({ error: 'Error al obtener ranking' });
        }
    }

    /**
     * Historial completo de un animal (Pesajes, Sanidad, Movimientos)
     */
    static async getAnimalHistory(req, res) {
        const { id } = req.params;
        try {
            // 1. Pesajes
            const [pesajes] = await db.query(
                'SELECT "PESAJE" as type, peso_kg, gdp_calculado, fecha as date FROM pesajes WHERE animal_id = ? ORDER BY fecha DESC',
                [id]
            );

            // 2. Sanidad
            const [sanidad] = await db.query(
                `SELECT "SANIDAD" as type, e.tipo_evento, e.fecha_aplicacion as date, e.nro_acta, e.fecha_fin_carencia, i.nombre_comercial as producto
                 FROM sanidad_eventos e
                 LEFT JOIN insumos_stock i ON e.producto_id = i.id
                 WHERE e.animal_id = ? ORDER BY e.fecha_aplicacion DESC`,
                [id]
            );

            // 3. Movimientos (Ingreso/Salida)
            const [ingresos] = await db.query(
                'SELECT "INGRESO" as type, origen, fecha_ingreso as date, nro_cot FROM movimientos_ingreso WHERE animal_id = ?',
                [id]
            );
            const [salidas] = await db.query(
                'SELECT "SALIDA" as type, motivo_salida, fecha_salida as date FROM movimientos_salida WHERE animal_id = ?',
                [id]
            );

            // 4. Traslados Internos
            let traslados = [];
            try {
                [traslados] = await db.query(
                    `SELECT "TRASLADO" as type, m.fecha as date, m.motivo, r1.nombre as origen, r2.nombre as destino
                     FROM movimientos_internos m
                     LEFT JOIN rodeos r1 ON m.origen_rodeo_id = r1.id
                     LEFT JOIN rodeos r2 ON m.destino_rodeo_id = r2.id
                     WHERE m.animal_id = ? ORDER BY m.fecha DESC`,
                    [id]
                );
            } catch (e) {
                console.warn('movimientos_internos table might not exist yet');
            }

            // Combinar y ordenar por fecha descendente
            const history = [...pesajes, ...sanidad, ...ingresos, ...salidas, ...traslados].sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            res.json(history);
        } catch (error) {
            console.error('Error in getAnimalHistory:', error.message);
            res.json([]);
        }
    }

    /**
     * Obtener lista de rodeos
     */
    static async getRodeos(req, res) {
        try {
            const [rows] = await db.query('SELECT * FROM rodeos ORDER BY nombre');
            res.json(rows);
        } catch (error) {
            console.error('Error in getRodeos:', error.message);
            res.json([]);
        }
    }

    /**
     * Registrar Traslado Interno
     */
    static async registerMovement(req, res) {
        const { id } = req.params;
        const { fecha, origen_rodeo_id, destino_rodeo_id, motivo } = req.body;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Registrar el movimiento
            await connection.query(
                `INSERT INTO movimientos_internos (animal_id, fecha, origen_rodeo_id, destino_rodeo_id, motivo)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, fecha, origen_rodeo_id, destino_rodeo_id, motivo]
            );

            // 2. Actualizar el rodeo del animal
            await connection.query(
                'UPDATE animales SET rodeo_id = ? WHERE id = ?',
                [destino_rodeo_id, id]
            );

            await connection.commit();
            res.json({ message: 'Movimiento registrado correctamente' });
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error in registerMovement:', error.message);
            res.status(500).json({ error: 'Error al registrar movimiento' });
        } finally {
            if (connection) connection.release();
        }
    }
    /**
     * Módulo de Ventas (Salida)
     */
    static async registrarVenta(req, res) {
        const { fecha, cliente, destino, animales_ids, precio_promedio, total_bruto, descuentos, total_neto, observaciones } = req.body;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Insertar Venta
            // Calculate aggregates if not provided or double check
            const cant = animales_ids.length;

            // Get total weight from animals (optional, or provided by frontend)
            // For now, we trust frontend 'peso_total' if passed, or we calculate it?
            // Let's assume frontend sends calculated totals for simplicity in this MVP.
            // But strict design checks DB.

            // Fetch animals to sum weight?
            // const [animRows] = await connection.query('SELECT SUM(peso_actual) as total_kg FROM animals WHERE id IN (?)', [animales_ids]);
            // const pesoTotal = animRows[0].total_kg;
            // For now, let's accept totals from frontend to support "Boleto" logic where maybe weight is agreed upon differently.

            const [ventaResult] = await connection.query(
                `INSERT INTO ventas_lotes 
                (fecha, cliente, destino, cantidad_animales, precio_promedio_kg, total_bruto, descuentos_total, total_neto, observaciones)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [fecha, cliente, destino, cant, precio_promedio, total_bruto, descuentos, total_neto, observaciones]
            );
            const ventaId = ventaResult.insertId;

            // 2. Procesar Animales (Salida)
            for (const animalId of animales_ids) {
                // Get current data for historical record
                const [animData] = await connection.query('SELECT peso_actual FROM animales WHERE id = ?', [animalId]);
                const peso = animData[0]?.peso_actual || 0;

                // Insert Generic Movement
                await connection.query(
                    `INSERT INTO movimientos_salida (venta_lote_id, animal_id, fecha_salida, peso_salida, precio_kg_real, motivo_salida)
                    VALUES (?, ?, ?, ?, ?, 'VENTA')`,
                    [ventaId, animalId, fecha, peso, precio_promedio]
                );

                // Update Animal Status
                await connection.query(
                    "UPDATE animales SET estado_general = 'VENDIDO', negocio_destino = 'VENDIDO' WHERE id = ?",
                    [animalId]
                );
            }

            await connection.commit();
            res.json({ message: 'Venta registrada exitosamente', ventaId, animales_vendidos: cant });

        } catch (error) {
            await connection.rollback();
            console.error('Error registrarVenta:', error);
            res.status(500).json({ error: 'Error al registrar la venta' });
        } finally {
            connection.release();
        }
    }
    static async getCategories(req, res) {
        try {
            // Check connection first
            await db.query('SELECT 1');
            const [rows] = await db.query('SELECT * FROM categorias ORDER BY descripcion');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                error: 'Error al obtener categorías',
                details: error.message,
                code: error.code,
                sqlState: error.sqlState
            });
        }
    }

    static async migrateCategories(req, res) {
        try {
            const newCategories = ['TERNERO M', 'TERNERO H', 'VAQUILLA', 'TORO', 'DESMAMANTE M', 'DESMAMANTE H'];
            const added = [];
            for (const cat of newCategories) {
                const [res] = await db.query('INSERT IGNORE INTO categorias (descripcion) VALUES (?)', [cat]);
                if (res.affectedRows > 0) added.push(cat);
            }
            res.json({ message: 'Migration checked', added });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    static async createCategory(req, res) {
        const { descripcion } = req.body;
        if (!descripcion) return res.status(400).json({ error: 'Descripción requerida' });
        try {
            const [result] = await db.query('INSERT INTO categorias (descripcion) VALUES (?)', [descripcion.toUpperCase()]);
            res.status(201).json({ id: result.insertId, descripcion: descripcion.toUpperCase() });
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ error: 'Error al crear categoría' });
        }
    }
}

module.exports = AnimalController;
