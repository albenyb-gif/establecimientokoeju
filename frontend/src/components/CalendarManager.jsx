import React, { useState, useEffect } from 'react';
import { Calendar, PlusCircle, Users, DollarSign, Receipt, Info, LogOut, CheckCircle2, Clock, MapPin, Tag, ChevronRight, LayoutDashboard } from 'lucide-react';
import calendarService from '../services/calendarService';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const CalendarManager = () => {
    const [tokens, setTokens] = useState(null);
    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [eventType, setEventType] = useState('REUNIÓN'); // REUNIÓN, VENTA, COMPRA, SANIDAD
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tokensParam = params.get('tokens');

        if (tokensParam) {
            try {
                const parsedTokens = JSON.parse(decodeURIComponent(tokensParam));
                setTokens(parsedTokens);
                localStorage.setItem('google_tokens', JSON.stringify(parsedTokens));
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
                console.error("Error parsing tokens", e);
            }
        } else {
            const savedTokens = localStorage.getItem('google_tokens');
            if (savedTokens) {
                setTokens(JSON.parse(savedTokens));
            }
        }
    }, []);

    const handleConnect = () => {
        calendarService.login();
    };

    const handleDisconnect = () => {
        if (window.confirm('¿Estás seguro de que deseas desconectar tu cuenta de Google?')) {
            localStorage.removeItem('google_tokens');
            setTokens(null);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!tokens) return;

        setLoading(true);

        // Formatear el resumen según el tipo
        let finalSummary = summary;
        if (eventType === 'VENTA') finalSummary = `[VENTA] ${summary}`;
        if (eventType === 'COMPRA') finalSummary = `[COMPRA] ${summary}`;
        if (eventType === 'SANIDAD') finalSummary = `[SANIDAD] ${summary}`;

        const eventDetails = {
            summary: finalSummary,
            description: description || `Evento agendado desde Gestión Ganadera - Tipo: ${eventType}`,
            start: `${date}:00`,
            end: `${date}:00`, // Simplificado, idealmente +1 hora
            location: location
        };

        try {
            await calendarService.createEvent(tokens, eventDetails);
            setSummary('');
            setDate('');
            setDescription('');
            setLocation('');
            loadEvents();
            // Podríamos usar un toast aquí en vez de alert
            alert('Evento agendado con éxito en Google Calendar');
        } catch (error) {
            console.error('Error al agendar:', error);
            alert('Error al agendar el evento. Posiblemente los tokens expiraron.');
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async () => {
        if (!tokens) return;
        setIsRefreshing(true);
        try {
            const data = await calendarService.listEvents(tokens);
            setEvents(data || []);
        } catch (error) {
            console.error('Error al cargar eventos:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (tokens) {
            loadEvents();
        }
    }, [tokens]);

    const getTypeColor = (summary = '') => {
        if (summary.includes('[VENTA]')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (summary.includes('[COMPRA]')) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (summary.includes('[SANIDAD]')) return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const getTypeIcon = (summary = '') => {
        if (summary.includes('[VENTA]')) return <DollarSign size={14} />;
        if (summary.includes('[COMPRA]')) return <Receipt size={14} />;
        if (summary.includes('[SANIDAD]')) return <PlusCircle size={14} />;
        return <Users size={14} />;
    };

    const cleanSummary = (text = '') => {
        return text.replace(/\[VENTA\]|\[COMPRA\]|\[SANIDAD\]/g, '').trim();
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Calendar className="text-blue-600" size={32} />
                        Agenda <span className="text-slate-400">Google Calendar</span>
                    </h1>
                    <p className="text-slate-500">Sincroniza tus actividades del establecimiento con tu calendario personal.</p>
                </div>
                {tokens && (
                    <button
                        onClick={handleDisconnect}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-100 text-red-600 hover:bg-red-50 transition-colors text-sm font-bold shadow-sm"
                    >
                        <LogOut size={16} />
                        Desconectar
                    </button>
                )}
            </div>

            {!tokens ? (
                /* Empty State / Connection Prompt */
                <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center max-w-2xl mx-auto">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Calendar size={48} className="text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Conecta tu Calendario</h2>
                    <p className="text-slate-500 mb-8 max-w-md">
                        Integrando Google Calendar podrás recibir recordatorios automáticos sobre ventas pesajes, y visitas sanitarias directamente en tu celular.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-blue-200 active:scale-95 flex items-center gap-3"
                    >
                        <span>Conectar con Google Account</span>
                        <ChevronRight size={20} />
                    </button>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left w-full">
                        <div className="flex gap-3 items-start p-4 bg-slate-50 rounded-2xl">
                            <CheckCircle2 size={18} className="text-emerald-500 mt-1 shrink-0" />
                            <p className="text-sm text-slate-600">Sincronización bidireccional de eventos críticos.</p>
                        </div>
                        <div className="flex gap-3 items-start p-4 bg-slate-50 rounded-2xl">
                            <CheckCircle2 size={18} className="text-emerald-500 mt-1 shrink-0" />
                            <p className="text-sm text-slate-600">Notificaciones automáticas en tu Smartphone.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <PlusCircle size={20} className="text-emerald-500" />
                                Agendar Nuevo Evento
                            </h3>

                            <form onSubmit={handleCreateEvent} className="space-y-5">
                                {/* Type Selector */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {['REUNIÓN', 'VENTA', 'COMPRA', 'SANIDAD'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setEventType(type)}
                                            className={cn(
                                                "py-2 px-1 rounded-xl text-[10px] font-black tracking-wider transition-all border",
                                                eventType === type
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Resumen / Título</label>
                                        <input
                                            type="text"
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 outline-none"
                                            placeholder={eventType === 'VENTA' ? 'Ej: 50 Terneros destetados' : 'Ej: Visita Veterinaria'}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fecha y Hora</label>
                                            <div className="relative">
                                                <input
                                                    type="datetime-local"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ubicación</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 outline-none"
                                                    placeholder="Ej: Potrero 5"
                                                />
                                                <MapPin size={18} className="absolute right-4 top-3.5 text-slate-300" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descripción (Opcional)</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={2}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 outline-none resize-none"
                                            placeholder="Detalles adicionales del evento..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Clock className="animate-spin" size={20} />
                                            Agendando...
                                        </>
                                    ) : (
                                        <>
                                            <Calendar size={20} />
                                            Agendar en mi Calendario
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex gap-4">
                            <Info size={24} className="text-blue-500 shrink-0" />
                            <div className="text-sm text-blue-700">
                                <p className="font-bold mb-1">Nota de Sincronización</p>
                                <p className="opacity-80">Los eventos se agendarán en tu calendario principal de Google con zona horaria de Paraguay.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: List */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Clock size={20} className="text-slate-400" />
                                    Próximos en tu Agenda
                                </h3>
                                <button
                                    onClick={loadEvents}
                                    disabled={isRefreshing}
                                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                                >
                                    <Activity size={18} className={isRefreshing ? "animate-pulse" : ""} />
                                </button>
                            </div>

                            {events.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
                                    <LayoutDashboard size={48} className="opacity-10 mb-4" />
                                    <p className="italic">No se encontraron eventos próximos para hoy.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {events.map((event) => (
                                        <div key={event.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row justify-between gap-4 group hover:border-blue-200 transition-all">
                                            <div className="flex gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-sm",
                                                    getTypeColor(event.summary)
                                                )}>
                                                    {getTypeIcon(event.summary)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-slate-800 leading-tight">
                                                            {cleanSummary(event.summary)}
                                                        </h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-xs text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {new Date(event.start.dateTime || event.start.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {event.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin size={12} />
                                                                {event.location}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {new Date(event.start.dateTime || event.start.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <div className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-tighter",
                                                    getTypeColor(event.summary)
                                                )}>
                                                    {event.summary?.includes('[VENTA]') ? 'Venta' :
                                                        event.summary?.includes('[COMPRA]') ? 'Compra' :
                                                            event.summary?.includes('[SANIDAD]') ? 'Sanidad' : 'Gral'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {events.length > 0 && (
                                <p className="mt-6 text-xs text-slate-400 text-center">
                                    Mostrando los próximos 10 eventos de tu calendario de Google.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarManager;
