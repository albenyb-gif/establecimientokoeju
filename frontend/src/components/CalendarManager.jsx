import React, { useState, useEffect } from 'react';
import { Calendar, PlusCircle, Users, DollarSign, Receipt, Info, CheckCircle2, Clock, MapPin, ChevronRight, LayoutDashboard, Trash2, Edit2 } from 'lucide-react';
import agendaService from '../services/agendaService';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const CalendarManager = () => {
    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [eventType, setEventType] = useState('REUNIÓN');
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const loadEvents = async () => {
        setIsRefreshing(true);
        try {
            const data = await agendaService.getAll();
            setEvents(data || []);
        } catch (error) {
            console.error('Error al cargar agenda:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const eventData = {
            titulo: summary,
            descripcion: description,
            tipo: eventType === 'REUNIÓN' ? 'REUNION' : eventType,
            fecha_hora: date.replace('T', ' '),
            ubicacion: location
        };

        try {
            if (editingId) {
                await agendaService.update(editingId, eventData);
                alert('Evento actualizado con éxito');
            } else {
                await agendaService.create(eventData);
                alert('Evento agendado con éxito');
            }
            resetForm();
            loadEvents();
        } catch (error) {
            console.error('Error al agendar:', error);
            alert('Error al guardar el evento. Asegúrate de que el servidor esté encendido.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este evento?')) return;
        try {
            await agendaService.delete(id);
            loadEvents();
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    const handleEdit = (event) => {
        setEditingId(event.id);
        setSummary(event.titulo);
        // Formatear fecha para el input datetime-local (YYYY-MM-DDTHH:mm)
        const d = new Date(event.fecha_hora);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

        setDate(formattedDate);
        setDescription(event.description || event.descripcion || '');
        setLocation(event.location || event.ubicacion || '');
        setEventType(event.tipo === 'REUNION' ? 'REUNIÓN' : event.tipo);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setSummary('');
        setDate('');
        setDescription('');
        setLocation('');
        setEventType('REUNIÓN');
    };

    const getTypeColor = (tipo) => {
        switch (tipo) {
            case 'VENTA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'COMPRA': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'SANIDAD': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTypeIcon = (tipo) => {
        switch (tipo) {
            case 'VENTA': return <DollarSign size={14} />;
            case 'COMPRA': return <Receipt size={14} />;
            case 'SANIDAD': return <CheckCircle2 size={14} />;
            default: return <Users size={14} />;
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Calendar className="text-emerald-600" size={32} />
                        Agenda <span className="text-slate-400">Interna</span>
                    </h1>
                    <p className="text-slate-500">Gestiona tus actividades sin depender de cuentas externas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            {editingId ? <Edit2 size={20} className="text-blue-500" /> : <PlusCircle size={20} className="text-emerald-500" />}
                            {editingId ? 'Editar Evento' : 'Agendar Nuevo Evento'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Título / Actividad</label>
                                    <input
                                        type="text"
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-700 outline-none"
                                        placeholder="Ej: Vacunación Lote A"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fecha y Hora</label>
                                        <input
                                            type="datetime-local"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-700 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Lugar</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-700 outline-none"
                                                placeholder="Ej: Potrero Central"
                                            />
                                            <MapPin size={18} className="absolute right-4 top-3.5 text-slate-300" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Notas</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-700 outline-none resize-none"
                                        placeholder="Detalles importantes..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Guardando...' : (editingId ? 'Actualizar Evento' : 'Guardar en Agenda')}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: List */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-slate-400" />
                                Próximas Actividades
                            </h3>
                            <button
                                onClick={loadEvents}
                                disabled={isRefreshing}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                            >
                                <LayoutDashboard size={18} className={isRefreshing ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {events.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 text-center">
                                <Calendar size={48} className="opacity-10 mb-4" />
                                <p className="italic">No hay actividades registradas en la agenda.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {events.map((event) => (
                                    <div key={event.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row justify-between gap-4 group hover:border-emerald-200 transition-all">
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                                getTypeColor(event.tipo)
                                            )}>
                                                {getTypeIcon(event.tipo)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 leading-tight">
                                                    {event.titulo}
                                                </h4>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-xs text-slate-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(event.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {event.ubicacion && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {event.ubicacion}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 font-medium text-slate-500">
                                                        <Calendar size={12} />
                                                        {new Date(event.fecha_hora).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {(event.descripcion || event.description) && (
                                                    <p className="text-xs text-slate-600 mt-2 line-clamp-1">{event.descripcion || event.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(event)}
                                                className="p-2 bg-white text-blue-500 rounded-lg shadow-sm hover:bg-blue-50 border border-slate-100"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 border border-slate-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarManager;
