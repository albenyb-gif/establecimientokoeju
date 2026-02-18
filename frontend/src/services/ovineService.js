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
    }
};

export default OvineService;
