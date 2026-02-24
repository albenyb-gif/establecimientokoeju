import axios from 'axios';

import { queueOfflineAction } from '../db/db';

const api = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:5000/api' : '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor to handle offline mode
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config } = error;

        // Only queue mutation requests (POST, PUT, DELETE)
        const isMutation = ['post', 'put', 'delete'].includes(config?.method?.toLowerCase());
        const isOffline = !navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error';

        if (isMutation && isOffline) {
            console.warn('Detectado modo offline. Guardando solicitud en la cola de sincronización:', config.url);

            // Avoid queuing certain endpoints if needed (e.g. login)
            if (config.url.includes('/login')) return Promise.reject(error);

            try {
                await queueOfflineAction(
                    config.method.toUpperCase(),
                    config.url.replace(config.baseURL, ''),
                    config.data ? JSON.parse(config.data) : null
                );

                // Return a fake successful response to avoid UI crashes
                return {
                    data: { message: 'Operación guardada localmente para sincronización posterior', offline: true },
                    status: 202,
                    statusText: 'Accepted (Offline)',
                    headers: {},
                    config
                };
            } catch (queueError) {
                console.error('Error al guardar en la cola offline:', queueError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
