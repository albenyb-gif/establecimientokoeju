import axios from 'axios';

const API_URL = import.meta.env.PROD
    ? '/api/agenda'
    : 'http://localhost:5000/api/agenda';

const agendaService = {
    getAll: async () => {
        const response = await axios.get(API_URL);
        return response.data;
    },

    getUpcoming: async () => {
        const response = await axios.get(`${API_URL}/upcoming`);
        return response.data;
    },

    create: async (eventData) => {
        const response = await axios.post(API_URL, eventData);
        return response.data;
    },

    update: async (id, eventData) => {
        const response = await axios.put(`${API_URL}/${id}`, eventData);
        return response.data;
    },

    delete: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    }
};

export default agendaService;
