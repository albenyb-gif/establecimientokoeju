/**
 * Lógica de negocio para cálculos financieros y de stock.
 * Extraído de los controladores para mejorar la mantenibilidad (Agente Estructura).
 */

const BusinessLogic = {
    /**
     * Calcula el costo total de un lote de compra incluyendo comisiones, fletes y tasas.
     * @param {number} cantidad - Cantidad de animales.
     * @param {number} costoUnitario - Precio por animal.
     * @param {number} comisionFeria - Comisión (se aplica IVA 10%).
     * @param {number} flete - Costo de transporte (se aplica IVA 10%).
     * @param {number} tasas - Tasas fijas.
     * @returns {number} Costo total del lote.
     */
    calculateTotalPurchaseCost: (cantidad, costoUnitario, comisionFeria, flete, tasas) => {
        const base = (cantidad || 0) * (costoUnitario || 0);
        const comisionConIva = (comisionFeria || 0) * 1.10;
        const fleteConIva = (flete || 0) * 1.10;
        return base + comisionConIva + fleteConIva + (tasas || 0);
    },

    /**
     * Calcula la ganancia estimada basa en el porcentaje y costo total.
     */
    calculateEstimatedProfit: (totalCost, percentage) => {
        return totalCost * ((percentage || 0) / 100);
    },

    /**
     * Determina la categoría por defecto basada en el peso (estilo SENACSA).
     */
    getDefaultCategoryByWeight: (weight) => {
        if (!weight) return 'VAQUILLA';
        if (weight < 180) return 'TERNERO MACHO';
        if (weight < 250) return 'DESMAMANTE MACHO';
        return 'VAQUILLA';
    }
};

module.exports = BusinessLogic;
