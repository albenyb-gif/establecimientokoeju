const db = require('../config/db');

const agendaController = {
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM agenda ORDER BY fecha_hora ASC');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getUpcoming: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM agenda WHERE fecha_hora >= NOW() ORDER BY fecha_hora ASC LIMIT 10');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    create: async (req, res) => {
        const { titulo, descripcion, tipo, fecha_hora, ubicacion } = req.body;
        try {
            const [result] = await db.query(
                'INSERT INTO agenda (titulo, descripcion, tipo, fecha_hora, ubicacion) VALUES (?, ?, ?, ?, ?)',
                [titulo, descripcion, tipo, fecha_hora, ubicacion]
            );
            res.status(201).json({ id: result.insertId, message: 'Evento creado exitosamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const { titulo, descripcion, tipo, fecha_hora, ubicacion } = req.body;
        try {
            await db.query(
                'UPDATE agenda SET titulo = ?, descripcion = ?, tipo = ?, fecha_hora = ?, ubicacion = ? WHERE id = ?',
                [titulo, descripcion, tipo, fecha_hora, ubicacion, id]
            );
            res.json({ message: 'Evento actualizado exitosamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM agenda WHERE id = ?', [id]);
            res.json({ message: 'Evento eliminado exitosamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = agendaController;
