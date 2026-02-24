import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, PlusCircle, Users, DollarSign, Receipt, Clock, MapPin, Edit2, Trash2, LayoutDashboard } from 'lucide-react';
import PageHeader from './common/PageHeader';
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
            } else {
                await agendaService.create(eventData);
            }
            resetForm();
            loadEvents();
        } catch (error) {
            console.error('Error al agendar:', error);
            alert('Error al guardar el evento.');
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
        const d = new Date(event.fecha_hora);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

        setDate(formattedDate);
        setDescription(event.descripcion || '');
        setLocation(event.ubicacion || '');
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
            case 'SANIDAD': return <Clock size={14} />; // Fixed for better semantic
            default: return <Users size={14} />;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="Agenda Interna"
                subtitle="Gestión de actividades y compromisos del establecimiento."
                icon={CalendarIcon}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-2 flex items-center gap-2">
                            {editingId ? <Edit2 size={16} /> : <PlusCircle size={16} />}
                            {editingId ? 'Editar Actividad' : 'Nueva Actividad'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['REUNIÓN', 'VENTA', 'COMPRA', 'SANIDAD'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setEventType(type)}
                                        className={cn(
                                            "py-2.5 px-2 rounded-xl text-[10px] font-black tracking-widest transition-all border uppercase",
                                            eventType === type
                                                ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20"
                                                : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Título / Actividad</label>
                                    <input
                                        type="text"
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 font-bold outline-none"
                                        placeholder="Ej: Vacunación Lote A"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha y Hora</label>
                                        <input
                                            type="datetime-local"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Lugar</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 outline-none pr-12"
                                                placeholder="Ej: Potrero Central"
                                            />
                                            <MapPin size={20} className="absolute right-4 top-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Notas Adicionales</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 outline-none resize-none"
                                        placeholder="Detalles importantes sobre la actividad..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                                >
                                    {loading ? 'Guardando...' : (editingId ? 'Actualizar Evento' : 'Agendar Actividad')}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock size={16} />
                                Actividades Pendientes
                            </h3>
                            <button
                                onClick={loadEvents}
                                disabled={isRefreshing}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 border border-transparent hover:border-slate-100"
                                title="Actualizar"
                            >
                                <LayoutDashboard size={18} className={isRefreshing ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {events.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-20 text-center">
                                <CalendarIcon size={64} className="opacity-5 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">No hay actividades agendadas</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.map((event) => (
                                    <div key={event.id} className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row justify-between gap-6 group hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all">
                                        <div className="flex gap-5">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110 group-hover:-rotate-3",
                                                getTypeColor(event.tipo)
                                            )}>
                                                {getTypeIcon(event.tipo)}
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-black text-slate-800 leading-tight text-lg">
                                                    {event.titulo}
                                                </h4>
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-wider">
                                                        <CalendarIcon size={12} className="text-emerald-500" />
                                                        {new Date(event.fecha_hora).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-wider">
                                                        <Clock size={12} />
                                                        {new Date(event.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {event.ubicacion && (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-widest">
                                                            <MapPin size={12} />
                                                            {event.ubicacion}
                                                        </span>
                                                    )}
                                                </div>
                                                {event.descripcion && (
                                                    <p className="text-sm text-slate-500 mt-3 bg-white/50 p-3 rounded-xl border border-slate-100/50 line-clamp-2">{event.descripcion}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(event)}
                                                className="p-3 bg-white text-blue-500 rounded-xl shadow-sm hover:bg-blue-500 hover:text-white border border-slate-100 transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="p-3 bg-white text-red-500 rounded-xl shadow-sm hover:bg-red-500 hover:text-white border border-slate-100 transition-all"
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
