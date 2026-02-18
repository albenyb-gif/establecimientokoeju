const db = require('../config/db');

class ClientController {
    static async getAll(req, res) {
        try {
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
            const [result] = await db.query(
                'INSERT INTO clientes (nombre, ruc, telefono, email, direccion, tipo) VALUES (?, ?, ?, ?, ?, ?)',
                [nombre, ruc, telefono, email, direccion, tipo]
            );
            res.status(201).json({ message: 'Cliente creado correctamente', id: result.insertId });
        } catch (error) {
            console.error('Error creating client:', error);
            res.status(500).json({ error: 'Error al crear cliente', details: error.message });
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
