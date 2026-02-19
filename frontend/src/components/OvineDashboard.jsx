import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Scissors, Users, TrendingUp, AlertCircle, Calendar, X, Save, Baby, ChevronDown } from 'lucide-react';
import OvineService from '../services/ovineService';

const OvineDashboard = () => {
    const [stats, setStats] = useState({ total: 0, corderos: 0, ovejas: 0, esquila_pendiente: 0, stock_lana: 0, total_pariciones: 0 });
    const [woolData, setWoolData] = useState([]);
    const [pariciones, setPariciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showShearingModal, setShowShearingModal] = useState(false);
    const [showParicionModal, setShowParicionModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [shearingForm, setShearingForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        kilos_totales: '',
        cantidad_animales: '',
        observaciones: ''
    });

    const [paricionForm, setParicionForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        cantidad_crias: '1',
        sexo_crias: 'MIXTO',
        raza: '',
        observaciones: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, historyData, paricionesData] = await Promise.all([
                OvineService.getStats(),
                OvineService.getWoolHistory(),
                OvineService.getPariciones().catch(() => [])
            ]);
            setStats(statsData);

            // Convertir historial para gráfico (agrupar por año si viene detallado)
            if (historyData.length > 0 && historyData[0].fecha) {
                // Viene como registros individuales, agrupar por año
                const byYear = {};
                historyData.forEach(row => {
                    const year = new Date(row.fecha).getFullYear();
                    if (!byYear[year]) byYear[year] = 0;
                    byYear[year] += parseFloat(row.kilos_totales || 0);
                });
                const chartData = Object.entries(byYear).map(([year, kgs]) => ({ year: parseInt(year), kgs: Math.round(kgs * 10) / 10 }));
                setWoolData(chartData);
            } else {
                setWoolData(historyData);
            }

            setPariciones(paricionesData);
        } catch (error) {
            console.error("Error loading ovine data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleShearingSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await OvineService.registerShearing(shearingForm);
            setShowShearingModal(false);
            setShearingForm({
                fecha: new Date().toISOString().split('T')[0],
                kilos_totales: '',
                cantidad_animales: '',
                observaciones: ''
            });
            loadData();
            alert('✅ Esquila registrada exitosamente');
        } catch (error) {
            console.error(error);
            alert('❌ Error al registrar esquila');
        } finally {
            setSaving(false);
        }
    };

    const handleParicionSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const result = await OvineService.registerParicion(paricionForm);
            setShowParicionModal(false);
            setParicionForm({
                fecha: new Date().toISOString().split('T')[0],
                cantidad_crias: '1',
                sexo_crias: 'MIXTO',
                raza: '',
                observaciones: ''
            });
            loadData();
            alert(`✅ ${result.message || 'Parición registrada'}`);
        } catch (error) {
            console.error(error);
            alert('❌ Error al registrar parición');
        } finally {
            setSaving(false);
        }
    };

    const calendar = [
        { month: 'Ene', evento: 'Dosificación (H. contortus)', status: 'done' },
        { month: 'Mar', evento: 'Vacuna Clostridial (Pre-parto)', status: 'done' },
        { month: 'Abr', evento: 'Parición (Inicio)', status: 'active' },
        { month: 'Jun', evento: 'Señalada / Descole', status: 'pending' },
        { month: 'Sep', evento: 'Esquila Pre-parto', status: 'pending' },
        { month: 'Nov', evento: 'Baño Sarnicida', status: 'pending' }
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <span className="text-3xl">🐑</span>
                        Módulo Ovino
                    </h1>
                    <p className="text-slate-500 mt-1">Gestión especializada de majada: Lana, Carne y Cría.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowShearingModal(true)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Scissors size={18} /> Registrar Esquila
                    </button>
                    <button
                        onClick={() => setShowParicionModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                    >
                        <Activity size={18} /> Nueva Parición
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Total Majada"
                    value={stats.total}
                    unit="Cabezas"
                    icon={<Users size={24} className="text-blue-600" />}
                    color="text-blue-600"
                    trend={stats.total > 0 ? `${stats.ovejas} ovejas adultas` : ''}
                />
                <KpiCard
                    title="Corderos al Pie"
                    value={stats.corderos}
                    unit="Nacidos"
                    icon={<Activity size={24} className="text-emerald-500" />}
                    color="text-emerald-500"
                    trend={stats.total_pariciones > 0 ? `${stats.total_pariciones} pariciones` : ''}
                />
                <KpiCard
                    title="Esquila Pendiente"
                    value={stats.esquila_pendiente}
                    unit="Cabezas"
                    icon={<Scissors size={24} className="text-amber-500" />}
                    color="text-amber-600"
                    alert={stats.esquila_pendiente > 0}
                />
                <KpiCard
                    title="Stock Lana"
                    value={stats.stock_lana || 0}
                    unit="Kg"
                    icon={<TrendingUp size={24} className="text-purple-500" />}
                    color="text-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sanitary Calendar */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Calendar className="text-indigo-500" size={20} />
                        Calendario Sanitario 2026
                    </h3>
                    <div className="space-y-4">
                        {calendar.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors
                                    ${item.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                                        item.status === 'active' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' : 'bg-slate-50 text-slate-400'}
                                `}>
                                    {item.month}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-bold ${item.status === 'active' ? 'text-slate-800' : 'text-slate-600'}`}>{item.evento}</p>
                                    <p className="text-xs text-slate-400 capitalize">{item.status === 'done' ? 'Realizado' : item.status === 'active' ? 'En Curso' : 'Pendiente'}</p>
                                </div>
                                {item.status === 'active' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Pariciones */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            🐣 Últimas Pariciones
                        </h3>
                        {pariciones.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Baby size={32} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No hay pariciones registradas aún.</p>
                                <button
                                    onClick={() => setShowParicionModal(true)}
                                    className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors"
                                >
                                    Registrar Primera Parición
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {pariciones.slice(0, 10).map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">
                                                {p.cantidad_crias} cría(s) - {p.sexo_crias}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(p.fecha).toLocaleDateString('es-PY')}
                                                {p.raza && ` · ${p.raza}`}
                                                {p.madre_caravana && ` · Madre: ${p.madre_caravana}`}
                                            </p>
                                        </div>
                                        {p.observaciones && (
                                            <span className="text-xs text-slate-400 max-w-[200px] truncate">{p.observaciones}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Wool Production History */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6">Histórico Producción de Lana (Kg)</h3>
                        {woolData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                                <div className="text-center">
                                    <Scissors size={32} className="mx-auto mb-2 opacity-40" />
                                    <p>No hay registros de esquila aún.</p>
                                    <button
                                        onClick={() => setShowShearingModal(true)}
                                        className="mt-3 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                                    >
                                        Registrar Primera Esquila
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={woolData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorWool" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="year" />
                                        <YAxis />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="kgs" stroke="#8884d8" fillOpacity={1} fill="url(#colorWool)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shearing Modal */}
            {showShearingModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Scissors size={22} className="text-amber-500" /> Registrar Esquila
                            </h2>
                            <button onClick={() => setShowShearingModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleShearingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Esquila</label>
                                <input
                                    type="date" required
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                                    value={shearingForm.fecha}
                                    onChange={e => setShearingForm({ ...shearingForm, fecha: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Kilos (Lana)</label>
                                    <input
                                        type="number" step="0.1" required
                                        className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                                        placeholder="0.0"
                                        value={shearingForm.kilos_totales}
                                        onChange={e => setShearingForm({ ...shearingForm, kilos_totales: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Animales Esquilados</label>
                                    <input
                                        type="number" required
                                        className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                                        placeholder="0"
                                        value={shearingForm.cantidad_animales}
                                        onChange={e => setShearingForm({ ...shearingForm, cantidad_animales: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                                <textarea
                                    rows="3"
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                                    placeholder="Calidad de lana, lugar, esquilador, etc."
                                    value={shearingForm.observaciones}
                                    onChange={e => setShearingForm({ ...shearingForm, observaciones: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                            >
                                <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Esquila'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Paricion Modal */}
            {showParicionModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                🐣 Registrar Nueva Parición
                            </h2>
                            <button onClick={() => setShowParicionModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleParicionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Nacimiento</label>
                                <input
                                    type="date" required
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                    value={paricionForm.fecha}
                                    onChange={e => setParicionForm({ ...paricionForm, fecha: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad de Crías</label>
                                    <input
                                        type="number" required min="1" max="5"
                                        className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                        value={paricionForm.cantidad_crias}
                                        onChange={e => setParicionForm({ ...paricionForm, cantidad_crias: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sexo de las Crías</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none appearance-none bg-white"
                                        value={paricionForm.sexo_crias}
                                        onChange={e => setParicionForm({ ...paricionForm, sexo_crias: e.target.value })}
                                    >
                                        <option value="MACHO">Macho(s)</option>
                                        <option value="HEMBRA">Hembra(s)</option>
                                        <option value="MIXTO">Mixto</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Raza</label>
                                <select
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none appearance-none bg-white"
                                    value={paricionForm.raza}
                                    onChange={e => setParicionForm({ ...paricionForm, raza: e.target.value })}
                                >
                                    <option value="">Seleccionar raza</option>
                                    <option value="Santa Inés">Santa Inés</option>
                                    <option value="Dorper">Dorper</option>
                                    <option value="Texel">Texel</option>
                                    <option value="Criolla">Criolla</option>
                                    <option value="Hampshire">Hampshire</option>
                                    <option value="Corriedale">Corriedale</option>
                                    <option value="Mestiza">Mestiza</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                                <textarea
                                    rows="3"
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                    placeholder="Estado de la madre, dificultad del parto, etc."
                                    value={paricionForm.observaciones}
                                    onChange={e => setParicionForm({ ...paricionForm, observaciones: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                            >
                                <Save size={20} /> {saving ? 'Guardando...' : 'Registrar Parición'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const KpiCard = ({ title, value, unit, icon, color, trend, alert }) => (
    <div className={`p-6 rounded-3xl shadow-sm border transition-all hover:shadow-md relative overflow-hidden bg-white ${alert ? 'border-amber-200 bg-amber-50' : 'border-slate-100'}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${alert ? 'bg-white' : 'bg-slate-50'}`}>
                {icon}
            </div>
            {trend && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className={`text-3xl font-black tracking-tight ${color} flex items-baseline gap-1`}>
                {value}
                <span className="text-sm font-medium text-slate-400 ml-1">{unit}</span>
            </h3>
        </div>
        {alert && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-400"></div>}
    </div>
);

export default OvineDashboard;
