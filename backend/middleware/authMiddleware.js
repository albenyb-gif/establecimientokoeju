const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.API_KEY || 'kg92jK_dev_secret_2024';

/**
 * Middleware de seguridad básico para proteger los endpoints del backend.
 * Verifica la presencia de x-api-key en el header.
 */
const authMiddleware = (req, res, next) => {
    // Permitir ciertos métodos u opciones si es necesario (ej: public assets si los hubiera)
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== API_KEY) {
        console.warn(`[SECURITY] Intento de acceso no autorizado desde: ${req.ip}`);
        return res.status(401).json({ 
            error: 'No autorizado. Se requiere API Key válida.',
            message: 'Acceso denegado.'
        });
    }

    next();
};

module.exports = authMiddleware;
