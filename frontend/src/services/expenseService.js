import api from '../api/axios';
import { queueOfflineAction } from '../db/db';

const ExpenseService = {
    getAll: async (filters = {}) => {
        const response = await api.get('/gastos', { params: filters });
        return response.data;
    },

    create: async (data) => {
        if (!navigator.onLine) {
            await queueOfflineAction('POST', '/gastos', data);
            return { message: 'Gasto guardado localmente' };
        }
        const response = await api.post('/gastos', data);
        return response.data;
    },

    getSummary: async (year) => {
        const response = await api.get('/gastos/resumen', { params: { year } });
        return response.data;
    },

    remove: async (id) => {
        const response = await api.delete(`/gastos/${id}`);
        return response.data;
    }
};

export default ExpenseService;
