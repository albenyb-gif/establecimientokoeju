/**
 * SEMÁFORO SANITARIO (Middleware de Negocio)
 * Reglas de bloqueo según normativa SENACSA y periodos de carencia.
 */

const HealthMiddleware = (req, res, next) => {
    const { animal, configGlobal } = req.body; // Se asume que el animal viene cargado por un middleware previo

    if (!animal) {
        return res.status(404).json({ error: 'Animal no encontrado' });
    }

    const fechaActual = new Date();
    const fechaLiberacion = new Date(animal.fecha_liberacion_carencia);

    // 1. Regla de Carencia: No se puede vender si está bajo efecto de medicamentos
    if (fechaActual < fechaLiberacion) {
        return res.status(403).json({
            error: 'VENTA DENEGADA',
            motivo: 'PERIODO_CARENCIA',
            detalles: `El animal aún se encuentra bajo periodo de carencia hasta el ${animal.fecha_liberacion_carencia}.`
        });
    }

    // 2. Regla de Aftosa: Bloqueo si hay campaña vigente y el animal no está vacunado
    if (configGlobal.campaña_aftosa_vigente && !animal.vacunado_aftosa) {
        return res.status(403).json({
            error: 'VENTA DENEGADA',
            motivo: 'AFTOSA_BLOQUEO',
            detalles: 'Campaña de vacunación contra Aftosa vigente. Animal no cuenta con acta de vacunación oficial registrada.'
        });
    }

    next();
};

module.exports = HealthMiddleware;
