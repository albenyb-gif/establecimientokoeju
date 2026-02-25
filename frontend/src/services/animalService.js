import api from '../api/axios';
import { queueOfflineAction } from '../db/db';

const AnimalService = {
    registrarIngreso: async (formData) => {
        if (!navigator.onLine) {
            // FormData is hard to serialize for IDB, so we might need a placeholder or skip it
            return alert('Registro con foto solo disponible con internet');
        }
        const response = await api.post('/animales/ingreso', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    importMasiva: async (data) => {
        const response = await api.post('/animales/import', data);
        return response.data;
    },

    getDashboardStats: async () => {
        const response = await api.get('/animales/dashboard');
        return response.data;
    },

    getAnimals: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/animales', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/animales/${id}`);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/animales/${id}`, data);
        return response.data;
    },

    getCostAnalysis: async () => {
        const response = await api.get('/animales/costos');
        return response.data;
    },

    registerWeight: async (id, weight) => {
        if (!navigator.onLine) {
            await queueOfflineAction('POST', `/animales/pesaje/${id}`, { peso_kg: weight });
            return { message: 'Pesaje guardado localmente' };
        }
        const response = await api.post(`/animales/pesaje/${id}`, { peso_kg: weight });
        return response.data;
    },

    registerHealthEvent: async (id, eventData) => {
        if (!navigator.onLine) {
            await queueOfflineAction('POST', `/animales/sanidad/${id}`, eventData);
            return { message: 'Evento guardado localmente', bloqueo: 'El animal se actualizará al sincronizar' };
        }
        const response = await api.post(`/animales/sanidad/${id}`, eventData);
        return response.data;
    },

    getRanking: async () => {
        const response = await api.get('/animales/ranking');
        return response.data;
    },

    registrarCompraLote: async (data) => {
        const response = await api.post('/animales/compras', data);
        return response.data;
    },
    getPurchaseHistory: async () => {
        const response = await api.get('/animales/compras');
        return response.data;
    },
    deletePurchaseLote: async (id) => {
        const response = await api.delete(`/animales/compras/${id}`);
        return response.data;
    },

    batchUpdateIds: async (updates) => {
        const response = await api.post('/animales/batch-update', { updates });
        return response.data;
    },

    registrarVenta: async (data) => {
        const response = await api.post('/animales/ventas', data);
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get('/animales/categorias');
        return response.data;
    },
    createCategory: async (descripcion) => {
        const response = await api.post('/animales/categorias', { descripcion });
        return response.data;
    },
    getHistory: async (id) => {
        const response = await api.get(`/animales/${id}/historial`);
        return response.data;
    },
    getRodeos: async () => {
        const response = await api.get('/animales/rodeos');
        return response.data;
    },
    registerMovement: async (id, data) => {
        if (!navigator.onLine) {
            await queueOfflineAction('POST', `/animales/movimiento/${id}`, data);
            return { message: 'Movimiento guardado localmente' };
        }
        const response = await api.post(`/animales/movimiento/${id}`, data);
        return response.data;
    }
};

export default AnimalService;
