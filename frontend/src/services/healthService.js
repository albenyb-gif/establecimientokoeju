import api from '../api/axios';
import { queueOfflineAction } from '../db/db';

const HealthService = {
    // Insumos / Stock
    getStock: async () => {
        const response = await api.get('/sanidad/insumos');
        return response.data;
    },

    createInsumo: async (data) => {
        if (!navigator.onLine) {
            await queueOfflineAction('POST', '/sanidad/insumos', data);
            return { message: 'Insumo guardado localmente' };
        }
        const response = await api.post('/sanidad/insumos', data);
        return response.data;
    },

    updateInsumo: async (id, data) => {
        if (!navigator.onLine) {
            await queueOfflineAction('PUT', `/sanidad/insumos/${id}`, data);
            return { message: 'Cambio guardado localmente' };
        }
        const response = await api.put(`/sanidad/insumos/${id}`, data);
        return response.data;
    },

    deleteInsumo: async (id) => {
        const response = await api.delete(`/sanidad/insumos/${id}`);
        return response.data;
    },

    // Eventos
    getEvents: async () => {
        const response = await api.get('/sanidad/eventos');
        return response.data;
    },

    registerGroupEvent: async (data) => {
        if (!navigator.onLine) {
            await queueOfflineAction('POST', '/sanidad/eventos/grupal', data);
            return { message: 'Evento grupal guardado localmente' };
        }
        const response = await api.post('/sanidad/eventos/grupal', data);
        return response.data;
    }
};

export default HealthService;
