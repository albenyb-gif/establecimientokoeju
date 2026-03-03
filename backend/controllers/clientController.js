const db = require('../config/db');

class ClientController {
    static async getAll(req, res) {
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS clientes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    ruc VARCHAR(20),
                    telefono VARCHAR(50),
                    email VARCHAR(100),
                    direccion TEXT,
                    tipo ENUM('PARTICULAR', 'FRIGORIFICO', 'FERIA', 'PROVEEDOR') DEFAULT 'PARTICULAR',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            try {
                // Remove unique constraint if it exists from previous versions
                await db.query('ALTER TABLE clientes DROP INDEX ruc');
            } catch (e) {
                // Ignore if index doesn't exist
            }
            const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre');
            res.json(rows);
        } catch (error) {
            console.error('Error in ClientController.getAll:', error.message);
            res.json([]);
        }
    }

    static async getById(req, res) {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
            res.json(rows[0]);
        } catch (error) {
            console.error(`Error in ClientController.getById(${id}):`, error.message);
            res.status(500).json({ error: 'Error al obtener cliente' });
        }
    }

    static async create(req, res) {
        const { nombre, ruc, telefono, email, direccion, tipo } = req.body;
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS clientes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    ruc VARCHAR(20),
                    telefono VARCHAR(50),
                    email VARCHAR(100),
                    direccion TEXT,
                    tipo ENUM('PARTICULAR', 'FRIGORIFICO', 'FERIA', 'PROVEEDOR') DEFAULT 'PARTICULAR',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            try {
                await db.query('ALTER TABLE clientes DROP INDEX ruc');
            } catch (e) {
                // Ignorar si el índice no existe
            }

            // 1. Check if name matches exactly first
            const [byName] = await db.query('SELECT id FROM clientes WHERE nombre = ?', [nombre]);
            if (byName.length > 0) {
                return res.status(200).json({ message: 'Cliente ya existía', id: byName[0].id });
            }

            // 2. Check if RUC matches (if provided and not generic 'S/N')
            if (ruc && ruc !== 'S/N' && ruc !== '0') {
                const [byRuc] = await db.query('SELECT id FROM clientes WHERE ruc = ?', [ruc]);
                if (byRuc.length > 0) {
                    return res.status(200).json({ message: 'RUC ya registrado', id: byRuc[0].id });
                }
            }

            const [result] = await db.query(
                'INSERT INTO clientes (nombre, ruc, telefono, email, direccion, tipo) VALUES (?, ?, ?, ?, ?, ?)',
                [nombre, ruc, telefono, email, direccion, tipo]
            );
            res.status(201).json({ message: 'Cliente creado correctamente', id: result.insertId });
        } catch (error) {
            console.error('Error creating client:', error.message);
            res.status(500).json({
                error: 'Error al crear cliente',
                message: error.message,
                details: error.code === 'ER_DUP_ENTRY' ? 'El RUC o Nombre ya está registrado' : error.message
            });
        }
    }

    static async update(req, res) {
        const { id } = req.params;
        const { nombre, ruc, telefono, email, direccion, tipo } = req.body;
        try {
            await db.query(
                'UPDATE clientes SET nombre = ?, ruc = ?, telefono = ?, email = ?, direccion = ?, tipo = ? WHERE id = ?',
                [nombre, ruc, telefono, email, direccion, tipo, id]
            );
            res.json({ message: 'Cliente actualizado correctamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al actualizar cliente' });
        }
    }

    static async delete(req, res) {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM clientes WHERE id = ?', [id]);
            res.json({ message: 'Cliente eliminado correctamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar cliente' });
        }
    }
}

module.exports = ClientController;
