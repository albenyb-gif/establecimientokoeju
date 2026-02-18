const db = require('../config/db');

class ClientController {
    static async getAll(req, res) {
        try {
            const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre');
            res.json(rows);
        } catch (error) {
            console.warn('DB Error in ClientController.getAll, returning Mock Data');
            const mockClients = [
                { id: 1, nombre: 'Frigorífico Concepción', ruc: '80012345-0', telefono: '021-123456', tipo: 'FRIGORIFICO' },
                { id: 2, nombre: 'Juan Pérez (Particular)', ruc: '1234567-8', telefono: '0981-000111', tipo: 'PARTICULAR' },
                { id: 3, nombre: 'Feria Los Amigos', ruc: '80055566-1', telefono: '0331-444555', tipo: 'FERIA' }
            ];
            res.json(mockClients);
        }
    }

    static async getById(req, res) {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
            res.json(rows[0]);
        } catch (error) {
            res.json({ id, nombre: 'Cliente Mock', ruc: '000-0', tipo: 'PARTICULAR' });
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
