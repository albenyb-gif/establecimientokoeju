import axios from 'axios';

const API_URL = import.meta.env.PROD
    ? '/api/calendar'
    : 'http://localhost:5000/api/calendar';

const calendarService = {
    // Iniciar sesión con Google (esto redirigirá la página)
    login: () => {
        window.location.href = `${API_URL}/auth`;
    },

    // Crear un evento
    createEvent: async (tokens, eventDetails) => {
        const response = await axios.post(`${API_URL}/events`, { tokens, eventDetails });
        return response.data;
    },

    // Listar eventos
    listEvents: async (tokens) => {
        const response = await axios.post(`${API_URL}/list-events`, { tokens });
        return response.data;
    }
};

export default calendarService;
