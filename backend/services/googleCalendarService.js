const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
);

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

/**
 * Genera la URL de autenticación para que el usuario inicie sesión con Google.
 */
const getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
};

/**
 * Intercambia el código de autorización por tokens.
 */
const getTokens = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
};

/**
 * Crea un evento en el calendario de Google.
 */
const createEvent = async (tokens, eventDetails) => {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: {
            dateTime: eventDetails.start,
            timeZone: 'America/Asuncion', // Ajustado a Paraguay
        },
        end: {
            dateTime: eventDetails.end,
            timeZone: 'America/Asuncion',
        },
        location: eventDetails.location,
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
};

/**
 * Lista los próximos 10 eventos.
 */
const listEvents = async (tokens) => {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });
        return response.data.items;
    } catch (error) {
        console.error('Error listing events:', error);
        throw error;
    }
};

module.exports = {
    getAuthUrl,
    getTokens,
    createEvent,
    listEvents
};
