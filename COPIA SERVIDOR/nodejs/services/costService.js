/**
 * SERVICIO DE CÁLCULO DE COSTOS (Norma Paraguaya)
 */

class CostService {
    /**
     * Calcula el costo total del animal puesto en la estancia.
     * Incluye precio base + comisiones (IVA 10%) + flete (IVA 10%) + tasas.
     */
    static calcularCostoPuestoEstancia(params) {
        const {
            precioCompra,
            comisionFeria,
            flete,
            tasasMunicipales,
            tasaSenacsa
        } = params;

        // Las comisiones y fletes suelen facturarse con IVA 10%
        const comisionConIva = comisionFeria * 1.10;
        const fleteConIva = flete * 1.10;

        return precioCompra + comisionConIva + fleteConIva + tasasMunicipales + tasaSenacsa;
    }

    /**
     * Calcula la liquidación neta de venta.
     * Descuentos: Gastos + IVA Agropecuario (5% en Paraguay para ganado en pie).
     */
    static calcularLiquidacionVenta(precioVenta, otrosGastos) {
        const subtotal = precioVenta - otrosGastos;
        const ivaAgro = subtotal * 0.05; // 5% IVA Agropecuario

        return subtotal - ivaAgro;
    }
}

module.exports = CostService;
