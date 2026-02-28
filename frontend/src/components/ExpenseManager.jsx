import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingDown, Calendar, PlusCircle, Trash2, Filter, Receipt, Wallet, ArrowUpRight, ArrowDownRight, PieChart } from 'lucide-react';
import PageHeader from './common/PageHeader';
import ExpenseService from '../services/expenseService';

const CATEGORIAS = [
    { value: 'ALIMENTACION', label: 'Alimentación', emoji: '🌾' },
    { value: 'SANIDAD', label: 'Sanidad', emoji: '💉' },
    { value: 'PERSONAL', label: 'Personal', emoji: '👷' },
    { value: 'COMBUSTIBLE', label: 'Combustible', emoji: '⛽' },
    { value: 'MANTENIMIENTO', label: 'Mantenimiento', emoji: '🔧' },
    { value: 'TRANSPORTE', label: 'Transporte/Flete', emoji: '🚚' },
    { value: 'IMPUESTOS', label: 'Impuestos/Tasas', emoji: '🏛️' },
    { value: 'SERVICIOS', label: 'Servicios', emoji: '💡' },
    { value: 'OTROS', label: 'Otros', emoji: '📦' },
];

const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value || 0).replace('PYG', '₲');

const ExpenseManager = () => {
    const [tab, setTab] = useState('dashboard');
    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ desde: '', hasta: '', categoria: '' });
    const [form, setForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        categoria: '',
        monto: '',
        descripcion: '',
        proveedor: '',
        comprobante_nro: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [summaryData, expenseData] = await Promise.all([
                ExpenseService.getSummary(new Date().getFullYear()),
                ExpenseService.getAll()
            ]);
            setSummary(summaryData);
            setExpenses(expenseData);
        } catch (error) {
            console.error('Error loading expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.categoria || !form.monto) {
            setStatus({ type: 'error', message: 'Categoría y monto son obligatorios' });
            return;
        }
        try {
            await ExpenseService.create({ ...form, monto: parseFloat(form.monto) });
            setStatus({ type: 'success', message: 'Gasto registrado correctamente' });
            setForm({
                fecha: new Date().toISOString().split('T')[0],
                categoria: '',
                monto: '',
                descripcion: '',
                proveedor: '',
                comprobante_nro: ''
            });
            loadData();
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Error al registrar' });
        }
    };

    const handleFilter = async () => {
        try {
            const data = await ExpenseService.getAll(filters);
            setExpenses(data);
        } catch (error) {
            console.error('Error filtering:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Desea eliminar este registro de gasto?')) return;
        try {
            await ExpenseService.remove(id);
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-red-500 rounded-full animate-spin"></div>
            <p className="font-black uppercase tracking-[0.2em] text-xs">Cargando Gestión de Egresos</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Gastos Operativos"
                subtitle="Control administrativo y financiero del establecimiento."
                icon={Receipt}
                actions={
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200/50 shadow-inner">
                        <button
                            onClick={() => setTab('dashboard')}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'dashboard' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            📊 Resumen
                        </button>
                        <button
                            onClick={() => setTab('registrar')}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'registrar' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            ➕ Registrar
                        </button>
                        <button
                            onClick={() => setTab('historial')}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'historial' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            📋 Historial
                        </button>
                    </div>
                }
            />

            {tab === 'dashboard' && summary && (
                <div className="space-y-8">
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard
                            title="Operativo este Mes"
                            value={formatCurrency(summary.kpis.gasto_mes)}
                            icon={<ArrowDownRight size={22} />}
                            trend="Gasto Mensual"
                            color="text-red-500"
                            bg="bg-white"
                        />
                        <KpiCard
                            title="Total Gestión 2024"
                            value={formatCurrency(summary.kpis.gasto_anual)}
                            icon={<TrendingDown size={22} />}
                            trend="Consolidado Anual"
                            color="text-slate-800"
                            bg="bg-white"
                        />
                        <KpiCard
                            title="Promedio Estimado"
                            value={formatCurrency(summary.kpis.promedio_mensual)}
                            icon={<Wallet size={22} />}
                            trend="Carga Mensual"
                            color="text-blue-500"
                            bg="bg-white"
                        />
                        <KpiCard
                            title={summary.kpis.top_categoria.nombre}
                            value={formatCurrency(summary.kpis.top_categoria.total)}
                            icon={<PieChart size={22} />}
                            trend="Categoría Principal"
                            color="text-amber-600"
                            bg="bg-white"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4">Inversión por Categoría</h3>
                            {summary.por_categoria.length > 0 ? (
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={summary.por_categoria} layout="vertical" margin={{ left: 20, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(v) => formatCurrency(v)} />
                                            <Bar dataKey="value" fill="#0f172a" radius={[0, 12, 12, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-80 flex flex-col items-center justify-center text-slate-200">
                                    <BarChart size={48} className="opacity-20 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin datos consolidados</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4">Curva de Gastos Mensual</h3>
                            {summary.tendencia_mensual.length > 0 ? (
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={summary.tendencia_mensual} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis hide />
                                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(v) => formatCurrency(v)} />
                                            <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={5} dot={{ r: 6, fill: '#ef4444', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-80 flex flex-col items-center justify-center text-slate-200">
                                    <LineChart size={48} className="opacity-20 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">A la espera de registros</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'registrar' && (
                <div className="max-w-3xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                        <PlusCircle size={24} className="text-red-500" /> Registro de nuevo Egreso
                    </h2>

                    {status.message && (
                        <div className={`p-4 mb-8 rounded-2xl flex items-center gap-2 border font-bold text-xs uppercase tracking-widest ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha del Comprobante</label>
                                <input type="date" required className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Total (Gs)</label>
                                <input type="number" required min="0" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white outline-none font-black text-red-600 text-2xl transition-all" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="0" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clasificación de Gasto</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {CATEGORIAS.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, categoria: cat.value })}
                                        className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all flex flex-col items-center gap-2 ${form.categoria === cat.value
                                            ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-900/20 scale-105'
                                            : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <span className="text-2xl">{cat.emoji}</span>
                                        <span className="truncate w-full text-center">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Notas</label>
                            <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white outline-none font-bold text-slate-800" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej. Detalle de la compra o servicio..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white outline-none font-bold" value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nro. de Comprobante</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white outline-none font-mono font-bold" value={form.comprobante_nro} onChange={(e) => setForm({ ...form, comprobante_nro: e.target.value })} />
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-slate-900 hover:bg-red-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                            <Save size={24} /> Confirmar Gasto
                        </button>
                    </form>
                </div>
            )}

            {tab === 'historial' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px] space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desde</label>
                            <input type="date" className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} />
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hasta</label>
                            <input type="date" className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} />
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                            <select className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold bg-white" value={filters.categoria} onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}>
                                <option value="">Todas las categorías</option>
                                {CATEGORIAS.map(c => (<option key={c.value} value={c.value}>{c.emoji} {c.label}</option>))}
                            </select>
                        </div>
                        <button onClick={handleFilter} className="bg-slate-900 text-white h-[44px] px-8 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg shadow-slate-900/10"><Filter size={14} /> Filtrar</button>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        {expenses.length === 0 ? (
                            <div className="p-20 text-center text-slate-200">
                                <Receipt size={64} className="mx-auto mb-4 opacity-5" />
                                <p className="font-black uppercase tracking-widest text-xs">Sin registros que mostrar</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {expenses.map(exp => {
                                    const cat = CATEGORIAS.find(c => c.value === exp.categoria);
                                    return (
                                        <div key={exp.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-slate-50 transition-colors group gap-4 md:gap-0">
                                            <div className="flex items-start md:items-center gap-4 md:gap-6">
                                                <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-inner border border-slate-100 group-hover:bg-white group-hover:rotate-6 transition-all shrink-0">
                                                    {cat?.emoji || '📦'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-slate-800 text-base md:text-lg leading-tight tracking-tight group-hover:text-red-600 transition-colors break-words">
                                                        {exp.descripcion || cat?.label}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                                            {new Date(exp.fecha).toLocaleDateString('es-PY')}
                                                        </span>
                                                        {exp.proveedor && (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[120px] md:max-w-none">
                                                                Prov: {exp.proveedor}
                                                            </span>
                                                        )}
                                                        {exp.comprobante_nro && (
                                                            <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                                                #{exp.comprobante_nro}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 pt-4 border-t border-slate-50 md:border-0 md:pt-0 pl-16 md:pl-0">
                                                <div className="text-left md:text-right">
                                                    <p className="font-black text-red-600 text-xl tracking-tighter">{formatCurrency(exp.monto)}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{cat?.label}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    className="p-3 flex-shrink-0 rounded-xl bg-slate-50 text-slate-300 hover:text-white hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20 transition-all border border-slate-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FAB for Mobile */}
            {isMobile && tab !== 'registrar' && (
                <button
                    onClick={() => setTab('registrar')}
                    className="fixed bottom-24 right-5 z-50 w-16 h-16 bg-red-500 text-white rounded-[2rem] shadow-2xl shadow-red-500/30 flex items-center justify-center hover:bg-red-600 transition-colors active:scale-95"
                >
                    <PlusCircle size={28} />
                </button>
            )}
        </div>
    );
};

const KpiCard = ({ title, value, icon, trend, color, bg }) => (
    <div className={`${bg} p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all`}>
        <div className="absolute -top-4 -right-4 p-8 opacity-5 text-slate-900 group-hover:scale-110 transition-transform">{icon}</div>
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${color.replace('text', 'bg')}/10 ${color}`}>{icon}</div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
            </div>
            <div>
                <p className={`text-3xl font-black tracking-tighter leading-none ${color}`}>{value}</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">{trend}</p>
            </div>
        </div>
    </div>
);

export default ExpenseManager;
