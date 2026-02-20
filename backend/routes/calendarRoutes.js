const express = require('express');
const router = express.Router();
const calendarService = require('../services/googleCalendarService');

// Iniciar proceso de autenticación
router.get('/auth', (req, res) => {
    const url = calendarService.getAuthUrl();
    res.redirect(url);
});

// Callback de Google despues de la autenticación
router.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokens = await calendarService.getTokens(code);
        // Redirigir de vuelta al frontend con los tokens en la URL
        // En producción usamos FRONTEND_URL, en local localhost:5173
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173/calendario';
        const tokensString = encodeURIComponent(JSON.stringify(tokens));
        res.redirect(`${frontendUrl}?tokens=${tokensString}`);
    } catch (error) {
        console.error('Error en callback:', error);
        res.status(500).json({ error: 'Error al obtener tokens' });
    }
});

// Crear un evento
router.post('/events', async (req, res) => {
    const { tokens, eventDetails } = req.body;
    try {
        const result = await calendarService.createEvent(tokens, eventDetails);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear evento' });
    }
});

// Listar eventos
router.post('/list-events', async (req, res) => {
    const { tokens } = req.body;
    try {
        const events = await calendarService.listEvents(tokens);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar eventos' });
    }
});

module.exports = router;
