import api from '../api/axios';
import { queueOfflineAction } from '../db/db';

const OvineService = {
    getStats: async () => {
        const response = await api.get('/ovinos/stats');
        return response.data;
    },

    registerShearing: async (data) => {
        if (!navigator.onLine) {
            await queueOfflineAction('POST', '/ovinos/esquila', data);
            return { message: 'Esquila guardada localmente' };
        }
        const response = await api.post('/ovinos/esquila', data);
        return response.data;
    },

    getWoolHistory: async () => {
        const response = await api.get('/ovinos/historial-lana');
        return response.data;
    },

    registerParicion: async (data) => {
        if (!navigator.onLine) {
            await queueOfflineAction('POST', '/ovinos/paricion', data);
            return { message: 'Parición guardada localmente' };
        }
        const response = await api.post('/ovinos/paricion', data);
        return response.data;
    },

    getPariciones: async () => {
        const response = await api.get('/ovinos/pariciones');
        return response.data;
    }
};

export default OvineService;
