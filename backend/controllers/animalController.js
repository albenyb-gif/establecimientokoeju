const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/marcas');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const parseSafely = (val, isInt = false) => {
    if (val === undefined || val === null || val === '') return 0;
    const parsed = isInt ? parseInt(val) : parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
};


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
            comision_feria, flete, tasas, porcentaje_ganancia, comparador, tipo_ingreso
        } = req.body;

        const numCantidad = parseSafely(cantidad, true);
        const numCostoUnit = parseSafely(costo_unitario);
        const numPesoTotal = parseSafely(peso_total);
        const numKilosCompra = parseSafely(kilos_compra);
        const numGanancia = parseSafely(ganancia_estimada);
        const numComision = parseSafely(comision_feria);
        const numFlete = parseSafely(flete);
        const numTasas = parseSafely(tasas);
        const totalCostCalculated = numCantidad * numCostoUnit;

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

            const numPorcentaje = parseSafely(porcentaje_ganancia);

            // Calculation Logic (Matches Frontend and CostService)
            // Comisiones y fletes con IVA 10%
            const totalCostCalculated = (numCantidad * numCostoUnit) + (numComision * 1.10) + (numFlete * 1.10) + numTasas;

            // 1. Insertar Lote de Compra
            const [loteResult] = await connection.query(
                `INSERT INTO compras_lotes 
                (fecha, cantidad_animales, pelaje, peso_promedio_compra, peso_total, costo_unitario, costo_total, ganancia_estimada, vendedor, lugar_procedencia, tipo_documento, observaciones, nro_cot, nro_guia, comision_feria, flete, tasas, porcentaje_ganancia, comparador, tipo_ingreso)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [fecha, numCantidad, pelaje, numKilosCompra, numPesoTotal, numCostoUnit, totalCostCalculated, numGanancia, vendedor, lugar, documento, observaciones, nro_cot, nro_guia, numComision, numFlete, numTasas, numPorcentaje, comparador, tipo_ingreso || 'masivo']
            );
            const loteId = loteResult.insertId;

            // 1.1 Insertar Gastos Automáticos
            const baseCost = numCantidad * numCostoUnit;
            if (baseCost > 0) {
                await connection.query(
                    'INSERT INTO gastos (fecha, categoria, monto, descripcion, proveedor) VALUES (?, "OTROS", ?, ?, ?)',
                    [fecha, baseCost, `Compra de Lote #${loteId} (${numCantidad} animales)`, vendedor]
                );
            }

            if (numComision > 0) {
                await connection.query(
                    'INSERT INTO gastos (fecha, categoria, monto, descripcion, proveedor) VALUES (?, "SERVICIOS", ?, ?, ?)',
                    [fecha, numComision * 1.10, `Comisión Compra Lote #${loteId}`, 'Feria/Intermediario']
                );
            }

            if (numFlete > 0) {
                await connection.query(
                    'INSERT INTO gastos (fecha, categoria, monto, descripcion, proveedor) VALUES (?, "TRANSPORTE", ?, ?, ?)',
                    [fecha, numFlete * 1.10, `Flete Lote #${loteId}`, 'Transportista']
                );
            }

            if (numTasas > 0) {
                await connection.query(
                    'INSERT INTO gastos (fecha, categoria, monto, descripcion, proveedor) VALUES (?, "IMPUESTOS", ?, ?, ?)',
                    [fecha, numTasas, `Tasas Municipales/SENACSA Lote #${loteId}`, 'Estado']
                );
            }

            // 2. Procesar Animales Individuales
            const qty = numCantidad;
            const tipoIngreso = req.body.tipo_ingreso || 'masivo';
            let animalesDetalle = [];

            if (tipoIngreso === 'detallado' && req.body.animales) {
                try {
                    animalesDetalle = JSON.parse(req.body.animales);
                } catch (e) {
                    console.error('Error parsing animals detail:', e);
                }
            }

            // Helper function to get or create category by name
            const getOrCreateCategory = async (desc) => {
                if (!desc) return null;
                const [existing] = await connection.query('SELECT id FROM categorias WHERE descripcion = ?', [desc.toUpperCase()]);
                if (existing.length > 0) return existing[0].id;

                const [created] = await connection.query('INSERT INTO categorias (descripcion) VALUES (?)', [desc.toUpperCase()]);
                return created.insertId;
            };

            // Categoria ID por defecto
            let defaultCatId = null;
            if (req.body.categoria_id) {
                if (!isNaN(req.body.categoria_id)) {
                    defaultCatId = parseInt(req.body.categoria_id);
                } else {
                    // Si es un string (manual), buscarlo o crearlo
                    defaultCatId = await getOrCreateCategory(req.body.categoria_id);
                }
            }

            if (!defaultCatId) {
                let categoriaDefecto = 'VAQUILLA';
                if (kilos_compra < 180) categoriaDefecto = 'TERNERO MACHO';
                else if (kilos_compra < 250) categoriaDefecto = 'DESMAMANTE MACHO';
                defaultCatId = await getOrCreateCategory(categoriaDefecto);
            }

            for (let i = 0; i < qty; i++) {
                const det = animalesDetalle[i] || {};
                let caravana = det.caravana_visual || `L${loteId}-${(i + 1).toString().padStart(3, '0')}`;
                let rfid = det.caravana_rfid || null;
                let pesoIndividual = parseSafely(det.peso) || numKilosCompra;
                let costoIndividual = parseSafely(det.costo) || numCostoUnit;
                let catIndividual = defaultCatId;
                if (det.categoria_id) {
                    if (!isNaN(det.categoria_id) && det.categoria_id !== '') {
                        catIndividual = parseInt(det.categoria_id);
                    } else if (typeof det.categoria_id === 'string' && det.categoria_id.trim() !== '') {
                        catIndividual = await getOrCreateCategory(det.categoria_id);
                    }
                }
                let pelajeIndividual = det.pelaje || pelaje || 'SIN ESPECIFICAR';
                let comparadorIndividual = det.comparador || comparador || null;

                // Check for duplicate caravan to avoid crash
                const [dup] = await connection.query('SELECT id FROM animales WHERE caravana_visual = ?', [caravana]);
                let animalId;
                if (dup.length > 0) {
                    animalId = dup[0].id;
                    // Update existing animal with new purchase data? 
                    // For now, let's just update its state and weight as it's coming back "into" the system.
                    await connection.query(
                        "UPDATE animales SET estado_general = 'ACTIVO', peso_actual = ?, peso_inicial = ?, precio_compra = ?, categoria_id = ?, pelaje = ?, comparador = ? WHERE id = ?",
                        [pesoIndividual, pesoIndividual, costoIndividual, catIndividual, pelajeIndividual, comparadorIndividual, animalId]
                    );
                } else {
                    // Insert New Animal
                    const [animResult] = await connection.query(
                        `INSERT INTO animales (caravana_visual, caravana_rfid, peso_actual, peso_inicial, precio_compra, categoria_id, pelaje, negocio_destino, estado_general, estado_sanitario, comparador)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'ENGORDE', 'ACTIVO', 'ACTIVO', ?)`,
                        [caravana, rfid, pesoIndividual, pesoIndividual, costoIndividual, catIndividual, pelajeIndividual, comparadorIndividual]
                    );
                    animalId = animResult.insertId;
                }

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
            console.error('Error fetching purchase history:', error.message || error);
            res.status(500).json({ error: 'Error al obtener historial de compras', details: error.message });
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

    /**
     * Editar Lote de Compra
     */
    static async updatePurchaseLote(req, res) {
        const { id } = req.params;
        const {
            fecha, vendedor, lugar_procedencia, nro_guia, costo_unitario, observaciones,
            cantidad_animales, peso_promedio_compra, comision_feria, flete, tasas, nro_cot,
            comparador
        } = req.body;
        try {
            await db.query(
                `UPDATE compras_lotes SET 
                    fecha=?, vendedor=?, lugar_procedencia=?, nro_guia=?, costo_unitario=?, 
                    observaciones=?, cantidad_animales=?, peso_promedio_compra=?, 
                    comision_feria=?, flete=?, tasas=?, nro_cot=?, comparador=?
                 WHERE id=?`,
                [
                    fecha, vendedor, lugar_procedencia, nro_guia, costo_unitario,
                    observaciones, cantidad_animales, peso_promedio_compra,
                    comision_feria, flete, tasas, nro_cot, comparador || null, id
                ]
            );

            // If comparador was set, update all animals in this lot too
            if (comparador) {
                try {
                    await db.query(
                        `UPDATE animales a
                         INNER JOIN movimientos_ingreso mi ON mi.animal_id = a.id
                         SET a.comparador = ?
                         WHERE mi.compra_lote_id = ?`,
                        [comparador, id]
                    );
                } catch (e) {
                    console.warn('Could not bulk-update animal comparador:', e.message);
                }
            }

            res.json({ message: 'Lote actualizado correctamente' });
        } catch (error) {
            console.error('Error updating purchase lote:', error);
            res.status(500).json({ error: error.message });
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
            let catId = null;
            if (categoria_id) {
                if (!isNaN(categoria_id)) {
                    catId = parseInt(categoria_id);
                } else {
                    catId = await getOrCreateCategory(categoria_id);
                }
            }
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
     * Sincroniza animales faltantes desde lotes de compras (ej. importados por SQL)
     */
    static async syncAnimalesFromCompras(req, res) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. DATA CLEANUP: Identify and decouple animals shared across multiple lots/movements
            // This ensures sync can generate unique animals for each lot slot.
            await connection.query(`
                UPDATE movimientos_ingreso 
                SET animal_id = NULL 
                WHERE id IN (
                    SELECT id FROM (
                        SELECT id, ROW_NUMBER() OVER(PARTITION BY animal_id ORDER BY id ASC) as rn
                        FROM movimientos_ingreso
                        WHERE animal_id IS NOT NULL
                    ) t WHERE rn > 1
                )
            `);

            const [lotes] = await connection.query(`
                SELECT c.*, COUNT(DISTINCT mi.animal_id) as actual_animals
                FROM compras_lotes c
                LEFT JOIN movimientos_ingreso mi ON mi.compra_lote_id = c.id
                GROUP BY c.id
                HAVING actual_animals < c.cantidad_animales
            `);

            let generados = 0;

            for (const lote of lotes) {
                const existingCount = lote.actual_animals || 0;
                const qtyToGenerate = lote.cantidad_animales - existingCount;

                if (qtyToGenerate <= 0) continue;

                const loteId = lote.id;
                const numKilosCompra = lote.peso_promedio_compra || 0;
                const numCostoUnit = lote.costo_unitario || 0;

                let categoriaDefecto = 'VAQUILLONA';
                if (numKilosCompra > 0 && numKilosCompra < 180) categoriaDefecto = 'TERNERO';
                else if (numKilosCompra > 0 && numKilosCompra < 250) categoriaDefecto = 'DESMAMANTE_M';

                let defaultCatId = null;
                const [existingCat] = await connection.query('SELECT id FROM categorias WHERE descripcion = ?', [categoriaDefecto]);
                if (existingCat.length > 0) {
                    defaultCatId = existingCat[0].id;
                } else {
                    const [createdCat] = await connection.query('INSERT INTO categorias (descripcion) VALUES (?)', [categoriaDefecto]);
                    defaultCatId = createdCat.insertId;
                }

                for (let i = existingCount; i < lote.cantidad_animales; i++) {
                    const caravana = `L${loteId}-${(i + 1).toString().padStart(3, '0')}`;
                    // Avoid duplicate caravana_visual via UPSERT or check
                    const [dupCheck] = await connection.query('SELECT id FROM animales WHERE caravana_visual = ?', [caravana]);
                    let animalId;

                    if (dupCheck.length > 0) {
                        animalId = dupCheck[0].id;
                    } else {
                        const [animResult] = await connection.query(
                            `INSERT INTO animales (caravana_visual, peso_actual, peso_inicial, precio_compra, categoria_id, pelaje, negocio_destino, estado_general, estado_sanitario)
                            VALUES (?, ?, ?, ?, ?, ?, 'ENGORDE', 'ACTIVO', 'ACTIVO')`,
                            [caravana, numKilosCompra, numKilosCompra, numCostoUnit, defaultCatId, lote.pelaje || 'SIN ESPECIFICAR']
                        );
                        animalId = animResult.insertId;
                    }

                    await connection.query(
                        'INSERT IGNORE INTO pesajes (animal_id, peso_kg, fecha) VALUES (?, ?, ?)',
                        [animalId, numKilosCompra, lote.fecha]
                    );

                    const cotReal = lote.nro_cot || `LOTE-${loteId}`;
                    await connection.query(
                        `INSERT INTO movimientos_ingreso (compra_lote_id, fecha_ingreso, origen, animal_id, nro_cot, nro_guia_traslado)
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        [loteId, lote.fecha, lote.lugar_procedencia, animalId, cotReal, lote.nro_guia]
                    );
                    generados++;
                }
            }

            await connection.commit();
            res.json({ message: `Sincronización completada. ${generados} animales generados de ${lotes.length} lotes incompletos.` });
        } catch (error) {
            await connection.rollback();
            console.error('Error in syncAnimalesFromCompras:', error);
            res.status(500).json({ error: 'Error al sincronizar', details: error.message });
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

                    if (existing.length > 0) {
                        await db.query(
                            'UPDATE animales SET peso_actual = ?, negocio_destino = ? WHERE id = ?',
                            [peso, negocio, existing[0].id]
                        );
                        resultados.actualizados++;
                    } else {
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
     * Panel de Control: Estadísticas completas en una sola consulta.
     */
    static async getPanelStats(req, res) {
        try {
            const [[totales]] = await db.query(`
                SELECT
                    SUM(CASE WHEN estado_general = 'ACTIVO' THEN 1 ELSE 0 END) as total_animales,
                    SUM(CASE WHEN estado_general = 'ACTIVO' AND estado_sanitario = 'ACTIVO' THEN 1 ELSE 0 END) as sanitario_activo,
                    SUM(CASE WHEN estado_general = 'ACTIVO' AND estado_sanitario = 'BLOQUEADO' THEN 1 ELSE 0 END) as sanitario_bloqueado,
                    SUM(CASE WHEN estado_general = 'ACTIVO' AND estado_sanitario = 'CUARENTENA' THEN 1 ELSE 0 END) as sanitario_cuarentena,
                    SUM(CASE WHEN estado_general = 'ACTIVO' AND negocio_destino = 'ENGORDE' THEN 1 ELSE 0 END) as negocio_engorde,
                    SUM(CASE WHEN estado_general = 'ACTIVO' AND negocio_destino = 'CRIA' THEN 1 ELSE 0 END) as negocio_cria,
                    SUM(CASE WHEN estado_general = 'ACTIVO' AND negocio_destino = 'CABAÑA' THEN 1 ELSE 0 END) as negocio_cabana,
                    ROUND(AVG(CASE WHEN estado_general = 'ACTIVO' THEN peso_actual ELSE NULL END), 1) as peso_promedio,
                    ROUND(SUM(CASE WHEN estado_general = 'ACTIVO' THEN COALESCE(precio_compra, 0) ELSE 0 END), 0) as inversion_total,
                    SUM(CASE WHEN estado_general = 'VENDIDO' THEN 1 ELSE 0 END) as total_vendidos
                FROM animales
            `);

            const safeTotales = totales || {
                total_animales: 0,
                sanitario_activo: 0,
                sanitario_bloqueado: 0,
                sanitario_cuarentena: 0,
                negocio_engorde: 0,
                negocio_cria: 0,
                negocio_cabana: 0,
                peso_promedio: 0,
                inversion_total: 0,
                total_vendidos: 0
            };

            const [porCategoria] = await db.query(`
                SELECT c.descripcion as categoria, COUNT(a.id) as total
                FROM animales a
                LEFT JOIN categorias c ON c.id = a.categoria_id
                WHERE a.estado_general = 'ACTIVO'
                GROUP BY c.descripcion
                ORDER BY total DESC
                `);

            const [porRodeo] = await db.query(`
                SELECT r.nombre as rodeo, p.nombre as potrero, COUNT(a.id) as total, p.superficie_ha
                FROM animales a
                INNER JOIN rodeos r ON r.id = a.rodeo_id
                LEFT JOIN potreros p ON p.id = r.potrero_id
                WHERE a.estado_general = 'ACTIVO'
                GROUP BY r.id, r.nombre, p.nombre, p.superficie_ha
                ORDER BY total DESC
                LIMIT 10
                `);

            const [[comprasStats]] = await db.query(`
            SELECT
            COUNT(*) as total_lotes,
                SUM(cantidad_animales) as total_cabezas_compradas,
                ROUND(SUM(COALESCE(costo_total, 0)), 0) as total_invertido,
                MAX(fecha) as ultima_compra
                FROM compras_lotes
                `);

            const [ultimasCompras] = await db.query(`
                SELECT id, fecha, cantidad_animales, vendedor, costo_total, lugar_procedencia
                FROM compras_lotes
                ORDER BY fecha DESC
                LIMIT 3
                `);

            const [[gdpStats]] = await db.query(`
                SELECT ROUND(AVG(gdp_calculado), 3) as gdp_promedio
                FROM pesajes
                WHERE gdp_calculado > 0
                `);

            res.json({
                totales: safeTotales,
                porCategoria: porCategoria || [],
                porRodeo: porRodeo || [],
                comprasStats: comprasStats || { total_lotes: 0, total_cabezas_compradas: 0, total_invertido: 0, ultima_compra: null },
                ultimasCompras: ultimasCompras || [],
                gdpStats: gdpStats || { gdp_promedio: 0 }
            });
        } catch (error) {
            console.error('Error in getPanelStats:', error.message || error);
            res.status(500).json({ error: error.message, details: 'Error al procesar estadísticas del panel' });
        }
    }
    /**
     * Listado: Obtener lista completa de animales.
     */
    static async getAnimals(req, res) {
        try {
            const { estado, lote_id } = req.query;
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
                a.fecha_liberacion_carencia,
                a.comparador,
                a.peso_inicial,
                mi.compra_lote_id as lote_id,
                mi.fecha_ingreso as fecha_ingreso,
                mi.origen,
                cl.vendedor
                FROM animales a
                LEFT JOIN categorias c ON c.id = a.categoria_id
                LEFT JOIN rodeos r ON r.id = a.rodeo_id
                LEFT JOIN movimientos_ingreso mi ON mi.animal_id = a.id
                LEFT JOIN compras_lotes cl ON cl.id = mi.compra_lote_id
                `;

            const params = [];

            if (estado) {
                query += ' WHERE a.estado_general = ?';
                params.push(estado);
            } else {
                query += " WHERE a.estado_general = 'ACTIVO'";
            }

            if (lote_id) {
                query += ' AND mi.compra_lote_id = ?';
                params.push(lote_id);
            }

            // ORDER BY id descending to get newest first
            query += ' GROUP BY a.id ORDER BY a.id DESC';

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
                mi.fecha_ingreso,
                DATEDIFF(CURRENT_DATE, COALESCE(mi.fecha_ingreso, a.created_at, CURRENT_DATE)) as dias_en_stock,
                (SELECT gdp_calculado FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as ultimo_gdp
                FROM animales a
                LEFT JOIN categorias c ON c.id = a.categoria_id
                LEFT JOIN rodeos r ON r.id = a.rodeo_id
                LEFT JOIN(
                    SELECT animal_id, MIN(fecha_ingreso) as fecha_ingreso 
                    FROM movimientos_ingreso 
                    GROUP BY animal_id
                ) mi ON mi.animal_id = a.id
                WHERE a.id = ?
                `;
            const [rows] = await db.query(query, [id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Animal no encontrado' });

            const animal = rows[0];
            // Fetch multiple brands (wrapped in try-catch - table may not exist yet)
            try {
                const [brands] = await db.query('SELECT id, foto_path, tipo_marca FROM animales_marcas WHERE animal_id = ?', [id]);
                animal.marcas = brands || [];
            } catch (e) {
                console.warn('animales_marcas table not available:', e.message);
                animal.marcas = [];
            }

            res.json(animal);
        } catch (error) {
            console.error(`Error in getAnimalById(${id}): `, error.message);
            res.status(500).json({ error: 'Error al obtener animal' });
        }
    }
    /**
     * Edición Total: Actualizar absolutamente todos los datos de la ficha.
     */
    static async updateAnimal(req, res) {
        const { id } = req.params;
        const { 
            peso_actual, peso_inicial, precio_compra, rodeo_id, 
            estado_sanitario, estado_general, categoria_id, pelaje, raza, especie, 
            negocio_destino, comparador, caravana_visual, caravana_rfid,
            fecha_ingreso, origen, vendedor
        } = req.body;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const finalRodeoId = rodeo_id === "" ? null : rodeo_id;
            const finalCategoriaId = categoria_id === "" ? null : categoria_id;
            const finalRfid = caravana_rfid === "" ? null : (caravana_rfid || null);

            // 1. Actualizar tabla principal 'animales'
            await connection.query(
                `UPDATE animales 
                 SET peso_actual = ?, peso_inicial = ?, precio_compra = ?, rodeo_id = ?, 
                     estado_sanitario = ?, estado_general = ?, categoria_id = ?, 
                     pelaje = ?, raza = ?, especie = ?, negocio_destino = ?, 
                     comparador = ?, caravana_visual = ?, caravana_rfid = ?
                 WHERE id = ?`,
                [
                    peso_actual, peso_inicial, precio_compra, finalRodeoId, 
                    estado_sanitario, estado_general, finalCategoriaId, 
                    pelaje, raza, especie, negocio_destino, 
                    comparador, caravana_visual, finalRfid, id
                ]
            );

            // 2. Actualizar datos de ingreso vinculados (si existen)
            // Solo actuamos sobre el primer movimiento de ingreso (el origen)
            if (fecha_ingreso || origen || vendedor) {
                // Primero ver si existe el registro en movimientos_ingreso
                const [movs] = await connection.query('SELECT id FROM movimientos_ingreso WHERE animal_id = ? ORDER BY id ASC LIMIT 1', [id]);
                if (movs.length > 0) {
                    await connection.query(
                        'UPDATE movimientos_ingreso SET fecha_ingreso = ?, origen = ? WHERE id = ?',
                        [fecha_ingreso, origen, movs[0].id]
                    );
                }

                // Si hay vendedor, también podemos actualizar el lote de compra vinculado
                const [loteLink] = await connection.query('SELECT compra_lote_id FROM movimientos_ingreso WHERE animal_id = ? LIMIT 1', [id]);
                if (loteLink.length > 0 && loteLink[0].compra_lote_id && vendedor) {
                    await connection.query('UPDATE compras_lotes SET vendedor = ? WHERE id = ?', [vendedor, loteLink[0].compra_lote_id]);
                }
            }

            // 3. Si se cambió el peso actual o inicial y no hay pesajes previos, crear el inicial
            const [pesajes] = await connection.query('SELECT id FROM pesajes WHERE animal_id = ?', [id]);
            if (pesajes.length === 0 && peso_inicial) {
                await connection.query('INSERT INTO pesajes (animal_id, peso_kg, fecha) VALUES (?, ?, ?)', [id, peso_inicial, fecha_ingreso || new Date()]);
            }

            await connection.commit();
            res.json({ message: 'Animal actualizado correctamente', id });

        } catch (error) {
            await connection.rollback();
            console.error(`Error in updateAnimal(${id}): `, error.message);
            res.status(500).json({ error: 'Error al actualizar animal: ' + error.message });
        } finally {
            connection.release();
        }
    }

    // Eliminar: Baja de un animal del inventario.
    static async deleteAnimal(req, res) {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT caravana_visual FROM animales WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Animal no encontrado' });
            await db.query('DELETE FROM animales WHERE id = ?', [id]);
            res.json({ message: `Animal ${rows[0].caravana_visual} eliminado del inventario` });
        } catch (error) {
            console.error(`Error in deleteAnimal(${id}): `, error.message);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Análisis de Costos y Rentabilidad (Mock)
     */
    static async getCostAnalysis(req, res) {
        try {
            // 1. Ingresos Reales (Ventas Liquidadas)
            const [[salesRows]] = await db.query('SELECT SUM(total_neto) as total FROM ventas_lotes');
            const totalIncome = parseFloat(salesRows.total || 0);

            // 2. Egresos por Compra de Hacienda
            const [[purchaseRows]] = await db.query('SELECT SUM(costo_total) as total FROM compras_lotes');
            const totalPurchases = parseFloat(purchaseRows.total || 0);

            // 3. Gastos Operativos Reales (desde tabla gastos)
            const [[expenseRows]] = await db.query('SELECT SUM(monto) as total FROM gastos');
            const totalOperatingExpenses = parseFloat(expenseRows.total || 0);

            const totalExpenses = totalPurchases + totalOperatingExpenses;
            const rentabilidad = totalIncome - totalExpenses;
            const margin = totalIncome > 0 ? ((rentabilidad / totalIncome) * 100).toFixed(1) : 0;

            // 4. Desglose de Operativos para Gráfico
            const [expenseBreakdown] = await db.query(`
                SELECT categoria as name, SUM(monto) as value 
                FROM gastos 
                GROUP BY categoria
                `);

            // Merge with Purchases for a unified view
            const gastos_por_categoria = [
                { name: 'Compra Hacienda', value: totalPurchases },
                ...expenseBreakdown
            ];

            // 5. Histórico de Flujo (Ingresos Mensuales)
            const [monthlyTrend] = await db.query(`
                SELECT DATE_FORMAT(fecha, '%b') as mes, SUM(total_neto) as total 
                FROM ventas_lotes 
                WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(fecha, '%Y-%m') 
                ORDER BY fecha ASC
            `);

            // Adapt visualization: return monthlyTrend as 'costo_kilo_producido' for the chart
            // Note: Frontend LineChart expects { mes, costo }
            const trendData = monthlyTrend.map(m => ({
                mes: m.mes,
                costo: parseFloat(m.total)
            }));

            const analysis = {
                resumen: {
                    gastos_totales: totalExpenses,
                    ingresos_totales: totalIncome,
                    rentabilidad: rentabilidad,
                    margen: margin
                },
                gastos_por_categoria,
                costo_kilo_producido: trendData.length > 0 ? trendData : [{ mes: 'S/D', costo: 0 }]
            };
            res.json(analysis);

        } catch (error) {
            console.error('Error in getCostAnalysis:', error);
            res.status(500).json({ error: 'Error al calcular reporte financiero' });
        }
    }

    // Actualizar un pesaje existente
    static async updateWeight(req, res) {
        const { pesajeId } = req.params;
        const { peso_kg } = req.body;
        const numPeso = parseFloat(peso_kg);

        if (isNaN(numPeso)) return res.status(400).json({ error: 'Peso no válido' });

        try {
            // Obtener el registro para saber el animal_id
            const [rows] = await db.query('SELECT animal_id, fecha FROM pesajes WHERE id = ?', [pesajeId]);
            if (rows.length === 0) return res.status(404).json({ error: 'Pesaje no encontrado' });

            const animalId = rows[0].animal_id;

            // 1. Actualizar el pesaje
            await db.query('UPDATE pesajes SET peso_kg = ? WHERE id = ?', [numPeso, pesajeId]);

            // 2. Recalcular GDPs para ese animal (simplificado: recalculamos el GDP de este pesaje)
            // Para un cálculo real, se deberían recalcular todos los subsiguientes, pero aquí
            // al menos actualizamos el peso_actual del animal si es el último pesaje.
            const [lastWeight] = await db.query('SELECT id FROM pesajes WHERE animal_id = ? ORDER BY fecha DESC LIMIT 1', [animalId]);
            if (lastWeight[0].id == pesajeId) {
                await db.query('UPDATE animales SET peso_actual = ? WHERE id = ?', [numPeso, animalId]);
            }

            res.json({ message: 'Pesaje actualizado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar pesaje' });
        }
    }

    // Registra Pesaje y Calcula GDP (Cattler-PY Logic)
    static async registerWeight(req, res) {
        const { id } = req.params;
        const { peso_kg } = req.body;
        const numPeso = parseSafely(peso_kg);

        if (!numPeso) {
            return res.status(400).json({ error: 'Peso no válido' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Obtener último pesaje y datos del animal
            const [lastRows] = await connection.query(
                'SELECT peso_kg, fecha FROM pesajes WHERE animal_id = ? ORDER BY fecha DESC LIMIT 1',
                [id]
            );

            const [animalData] = await connection.query(
                'SELECT a.*, c.descripcion as categoria_desc FROM animales a JOIN categorias c ON c.id = a.categoria_id WHERE a.id = ?',
                [id]
            );

            let gdp = 0;
            if (lastRows.length > 0) {
                const lastPeso = parseFloat(lastRows[0].peso_kg);
                const lastFecha = new Date(lastRows[0].fecha);
                const diffDays = Math.max(1, (new Date() - lastFecha) / (1000 * 60 * 60 * 24));
                gdp = (numPeso - lastPeso) / diffDays;
            }

            // 2. Insertar nuevo pesaje
            await connection.query(
                'INSERT INTO pesajes (animal_id, peso_kg, gdp_calculado) VALUES (?, ?, ?)',
                [id, numPeso, gdp]
            );

            // 3. Actualizar animal y Verificar Cambio de Categoría (Auto-Upgrade)
            let newCategoryMessage = null;
            let updateQuery = 'UPDATE animales SET peso_actual = ? WHERE id = ?';
            let updateParams = [numPeso, id];

            // Regla de Negocio: Desmamante Macho > 250kg -> Novillo 1-2
            if (animalData[0] && animalData[0].categoria_desc === 'DESMAMANTE_M' && numPeso > 250) {
                // Buscar ID de Novillo 1-2
                const [catRow] = await connection.query("SELECT id FROM categorias WHERE descripcion = 'NOVILLO_1_2'");
                if (catRow.length > 0) {
                    updateQuery = 'UPDATE animales SET peso_actual = ?, categoria_id = ? WHERE id = ?';
                    updateParams = [numPeso, catRow[0].id, id];
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
        const { tipo_evento, fecha_aplicacion, producto, producto_id, dias_carencia, detalles, nro_acta, lote_vencimiento } = req.body;

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
            await db.query(
                'INSERT INTO sanidad_eventos (tipo_evento, animal_id, fecha_aplicacion, fecha_fin_carencia, nro_acta, lote_vencimiento, producto_id, responsable) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [tipo_evento, id, fecha_aplicacion, fecha_liberacion, nro_acta || detalles, lote_vencimiento || detalles, producto_id || null, req.body.responsable || 'Administración']
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
                bloqueo: fecha_liberacion ? `Animal bloqueado hasta ${fecha_liberacion} ` : 'Sin restricciones'
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
     * Historial completo de un animal (Pesajes, Sanidad, Movimientos, Marcas)
     */
    static async getAnimalHistory(req, res) {
        const { id } = req.params;
        try {
            // 1. Pesajes
            const [pesajes] = await db.query(
                'SELECT id, "PESAJE" as type, peso_kg, gdp_calculado, fecha as date FROM pesajes WHERE animal_id = ? ORDER BY fecha DESC',
                [id]
            );

            // 2. Sanidad
            let sanidad = [];
            try {
                [sanidad] = await db.query(
                    `SELECT e.id, "SANIDAD" as type, e.tipo_evento, e.fecha_aplicacion as date,
                COALESCE(e.nro_acta, e.lote_vencimiento) as nro_acta,
                e.fecha_fin_carencia, i.nombre_comercial as producto
                     FROM sanidad_eventos e
                     LEFT JOIN insumos_stock i ON e.producto_id = i.id
                     WHERE e.animal_id = ? ORDER BY e.fecha_aplicacion DESC`,
                    [id]
                );
            } catch (e) { console.warn('Error en query sanidad:', e.message); }

            // 3. Movimientos (Ingreso/Salida)
            let ingresos = [];
            try {
                [ingresos] = await db.query(
                    'SELECT id, "INGRESO" as type, origen, fecha_ingreso as date, nro_cot FROM movimientos_ingreso WHERE animal_id = ?',
                    [id]
                );
            } catch (e) { console.warn('Error en query ingresos:', e.message); }

            let salidas = [];
            try {
                [salidas] = await db.query(
                    'SELECT id, "SALIDA" as type, motivo_salida, fecha_salida as date FROM movimientos_salida WHERE animal_id = ?',
                    [id]
                );
            } catch (e) { console.warn('Error en query salidas:', e.message); }

            // 4. Traslados Internos
            let traslados = [];
            try {
                [traslados] = await db.query(
                    `SELECT id, "TRASLADO" as type, m.fecha as date, m.motivo, r1.nombre as origen, r2.nombre as destino
                     FROM movimientos_internos m
                     LEFT JOIN rodeos r1 ON m.origen_rodeo_id = r1.id
                     LEFT JOIN rodeos r2 ON m.destino_rodeo_id = r2.id
                     WHERE m.animal_id = ? ORDER BY m.fecha DESC`,
                    [id]
                );
            } catch (e) { console.warn('Error en query traslados:', e.message); }

            // 5. Marcas
            let marcas = [];
            try {
                [marcas] = await db.query(
                    'SELECT id, "MARCA" as type, foto_path, tipo_marca, created_at as date FROM animales_marcas WHERE animal_id = ? ORDER BY created_at DESC',
                    [id]
                );
            } catch (e) { console.warn('Error en query marcas:', e.message); }

            // Combinar y ordenar por fecha descendente
            const history = [...pesajes, ...sanidad, ...ingresos, ...salidas, ...traslados, ...marcas].sort((a, b) =>
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
                `INSERT INTO movimientos_internos(animal_id, fecha, origen_rodeo_id, destino_rodeo_id, motivo)
            VALUES(?, ?, ?, ?, ?)`,
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

        const numPrecio = parseSafely(precio_promedio);
        const numBruto = parseSafely(total_bruto);
        const numDesc = parseSafely(descuentos);
        const numNeto = parseSafely(total_neto);

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
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [fecha, cliente, destino, cant, numPrecio, numBruto, numDesc, numNeto, observaciones]
            );
            const ventaId = ventaResult.insertId;

            // 2. Procesar Animales (Salida)
            for (const animalId of animales_ids) {
                // Get current data for historical record
                const [animData] = await connection.query('SELECT peso_actual FROM animales WHERE id = ?', [animalId]);
                const peso = animData[0]?.peso_actual || 0;

                // Insert Generic Movement
                await connection.query(
                    `INSERT INTO movimientos_salida(venta_lote_id, animal_id, fecha_salida, peso_salida, precio_kg_real, motivo_salida)
            VALUES(?, ?, ?, ?, ?, 'VENTA')`,
                    [ventaId, animalId, fecha, peso, numPrecio]
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
        const hardcodedCategories = [
            { id: 1, descripcion: 'DESMAMANTE MACHO' },
            { id: 2, descripcion: 'DESMAMANTE HEMBRA' },
            { id: 3, descripcion: 'TERNERO MACHO' },
            { id: 4, descripcion: 'TERNERO HEMBRA' },
            { id: 5, descripcion: 'VAQUILLA' },
            { id: 6, descripcion: 'TORO' }
        ];

        try {
            // Asegurar que la tabla existe (opcional, pero útil para persistencia)
            try {
                await db.query(`
                    CREATE TABLE IF NOT EXISTS categorias(
                id INT AUTO_INCREMENT PRIMARY KEY,
                descripcion VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
            `);

                // Sembrar si está vacía
                const [countRows] = await db.query('SELECT COUNT(*) as count FROM categorias');
                if (countRows[0].count === 0) {
                    for (const cat of hardcodedCategories) {
                        await db.query('INSERT IGNORE INTO categorias (descripcion) VALUES (?)', [cat.descripcion]);
                    }
                }

                const [rows] = await db.query('SELECT * FROM categorias ORDER BY descripcion');
                if (rows.length > 0) {
                    return res.json(rows);
                }
            } catch (dbErr) {
                console.warn('Database error in getCategories, falling back to hardcoded list:', dbErr.message);
            }

            // Si falla la DB o está vacía, retornar lista hardcodeada
            res.json(hardcodedCategories);

        } catch (error) {
            console.error('Fatal error in getCategories:', error);
            // IMPORTANTE: Incluso en el error más grave, devolver la lista hardcodeada con status 200
            res.json(hardcodedCategories);
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

    /**
     * Upload brand photo for an animal
     */
    static async uploadMarca(req, res) {
        const { id } = req.params;
        const tipo_marca = req.body.tipo_marca || 'PROPIA';
        try {
            if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

            const fs = require('fs');
            const path = require('path');
            const uploadDir = uploadsDir || path.join(__dirname, '../../uploads/marcas');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const filename = `marca_${id}_${Date.now()}.jpg`;
            const filepath = path.join(uploadDir, filename);

            // Try to compress with sharp, fallback to raw save
            try {
                const sharp = require('sharp');
                await sharp(req.file.buffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toFile(filepath);
            } catch (sharpErr) {
                fs.writeFileSync(filepath, req.file.buffer);
            }

            const fotoPath = `/uploads/marcas/${filename}`;
            const [result] = await db.query(
                'INSERT INTO animales_marcas (animal_id, foto_path, tipo_marca) VALUES (?, ?, ?)',
                [id, fotoPath, tipo_marca]
            );

            res.status(201).json({ id: result.insertId, foto_path: fotoPath, tipo_marca });
        } catch (error) {
            console.error('Error uploading marca:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Delete a brand photo
     */
    static async deleteMarca(req, res) {
        const { marcaId } = req.params;
        try {
            const [rows] = await db.query('SELECT foto_path FROM animales_marcas WHERE id = ?', [marcaId]);
            if (rows.length > 0) {
                const fs = require('fs');
                const path = require('path');
                const filepath = path.join(__dirname, '..', 'public', rows[0].foto_path);
                try { fs.unlinkSync(filepath); } catch (e) { }
            }
            await db.query('DELETE FROM animales_marcas WHERE id = ?', [marcaId]);
            res.json({ message: 'Marca eliminada' });
        } catch (error) {
            console.error('Error deleting marca:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Obtener historial de ventas (lotes vendidos)
     */
    static async getSalesHistory(req, res) {
        try {
            const [ventas] = await db.query('SELECT * FROM ventas_lotes ORDER BY fecha DESC');
            
            // Para cada venta, obtener los animales vinculados
            const ventasConDetalle = await Promise.all(ventas.map(async (v) => {
                const [animales] = await db.query(
                    `SELECT a.caravana_visual, c.descripcion as categoria, ms.peso_salida, ms.precio_kg_real 
                     FROM movimientos_salida ms
                     JOIN animales a ON ms.animal_id = a.id
                     LEFT JOIN categorias c ON a.categoria_id = c.id
                     WHERE ms.venta_lote_id = ?`,
                    [v.id]
                );
                return { ...v, animales };
            }));

            res.json(ventasConDetalle);
        } catch (error) {
            console.error('Error in getSalesHistory: ', error.message);
            res.status(500).json({ error: 'Error al obtener historial de ventas' });
        }
    }
}

module.exports = AnimalController;
