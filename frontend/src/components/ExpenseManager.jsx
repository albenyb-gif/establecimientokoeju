import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingDown, Calendar, PlusCircle, Trash2, Filter, Receipt, Wallet } from 'lucide-react';
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
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value || 0);

const ExpenseManager = () => {
    const [tab, setTab] = useState('dashboard'); // dashboard | registrar | historial
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
            setStatus({ type: 'success', message: 'Gasto registrado exitosamente' });
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
            setStatus({ type: 'error', message: error.response?.data?.error || 'Error al registrar gasto' });
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
        if (!confirm('¿Eliminar este gasto?')) return;
        try {
            await ExpenseService.remove(id);
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    if (loading) return <div className="text-center mt-20 text-slate-400">Cargando módulo de gastos...</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Receipt size={32} className="text-red-500" /> Gastos del Establecimiento
                </h1>
                <p className="text-slate-500 mt-1">Control administrativo de egresos operativos.</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                {[
                    { id: 'dashboard', label: '📊 Resumen', icon: null },
                    { id: 'registrar', label: '➕ Registrar', icon: null },
                    { id: 'historial', label: '📋 Historial', icon: null },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${tab === t.id
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Dashboard Tab */}
            {tab === 'dashboard' && summary && (
                <div className="space-y-8">
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            title="Gasto del Mes"
                            value={formatCurrency(summary.kpis.gasto_mes)}
                            icon={<Calendar size={22} className="text-blue-600" />}
                            color="text-blue-700"
                            bg="bg-blue-50"
                        />
                        <KpiCard
                            title="Gasto Anual"
                            value={formatCurrency(summary.kpis.gasto_anual)}
                            icon={<TrendingDown size={22} className="text-red-600" />}
                            color="text-red-700"
                            bg="bg-red-50"
                        />
                        <KpiCard
                            title="Promedio Mensual"
                            value={formatCurrency(summary.kpis.promedio_mensual)}
                            icon={<Wallet size={22} className="text-amber-600" />}
                            color="text-amber-700"
                            bg="bg-amber-50"
                        />
                        <KpiCard
                            title={`Top: ${summary.kpis.top_categoria.nombre}`}
                            value={formatCurrency(summary.kpis.top_categoria.total)}
                            icon={<DollarSign size={22} className="text-purple-600" />}
                            color="text-purple-700"
                            bg="bg-purple-50"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Por Categoría */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4">Distribución por Categoría</h3>
                            {summary.por_categoria.length > 0 ? (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={summary.por_categoria} layout="vertical" margin={{ left: 10, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                            <Tooltip formatter={(v) => formatCurrency(v)} />
                                            <Bar dataKey="value" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={18} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-center py-12">Sin datos aún</p>
                            )}
                        </div>

                        {/* Tendencia */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4">Tendencia Mensual</h3>
                            {summary.tendencia_mensual.length > 0 ? (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={summary.tendencia_mensual}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="mes" />
                                            <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                            <Tooltip formatter={(v) => formatCurrency(v)} />
                                            <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: '#ef4444' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-center py-12">Sin datos aún</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Registrar Tab */}
            {tab === 'registrar' && (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PlusCircle size={22} className="text-red-500" /> Nuevo Gasto
                    </h2>

                    {status.message && (
                        <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    value={form.fecha}
                                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monto (Gs)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    value={form.monto}
                                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                                    placeholder="Ej. 500000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIAS.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, categoria: cat.value })}
                                        className={`p-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5 ${form.categoria === cat.value
                                                ? 'bg-red-50 border-red-300 text-red-700 ring-2 ring-red-200'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        <span>{cat.emoji}</span>
                                        <span className="truncate">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                value={form.descripcion}
                                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                placeholder="Ej. Compra de 20 bolsas de ración"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    value={form.proveedor}
                                    onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                                    placeholder="Opcional"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nro. Comprobante</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    value={form.comprobante_nro}
                                    onChange={(e) => setForm({ ...form, comprobante_nro: e.target.value })}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-red-500/30"
                        >
                            Registrar Gasto
                        </button>
                    </form>
                </div>
            )}

            {/* Historial Tab */}
            {tab === 'historial' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
                                <input
                                    type="date"
                                    className="p-2 border border-slate-200 rounded-lg text-sm"
                                    value={filters.desde}
                                    onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
                                <input
                                    type="date"
                                    className="p-2 border border-slate-200 rounded-lg text-sm"
                                    value={filters.hasta}
                                    onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Categoría</label>
                                <select
                                    className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                    value={filters.categoria}
                                    onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
                                >
                                    <option value="">Todas</option>
                                    {CATEGORIAS.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleFilter}
                                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-slate-700"
                            >
                                <Filter size={14} /> Filtrar
                            </button>
                            <button
                                onClick={() => { setFilters({ desde: '', hasta: '', categoria: '' }); loadData(); }}
                                className="text-slate-500 px-3 py-2 text-sm hover:text-slate-700"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    {/* Expense List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {expenses.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <Receipt size={40} className="mx-auto mb-3 opacity-40" />
                                <p>No hay gastos registrados</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {expenses.map(exp => {
                                    const cat = CATEGORIAS.find(c => c.value === exp.categoria);
                                    return (
                                        <div key={exp.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{cat?.emoji || '📦'}</span>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">
                                                        {exp.descripcion || cat?.label || exp.categoria}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(exp.fecha).toLocaleDateString('es-PY')}
                                                        {exp.proveedor && ` · ${exp.proveedor}`}
                                                        {exp.comprobante_nro && ` · #${exp.comprobante_nro}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-red-600 text-sm">
                                                    {formatCurrency(exp.monto)}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
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

                    {expenses.length > 0 && (
                        <div className="text-right text-sm text-slate-500">
                            Total filtrado: <span className="font-bold text-red-600">{formatCurrency(expenses.reduce((s, e) => s + Number(e.monto), 0))}</span>
                            {' · '}{expenses.length} registro(s)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const KpiCard = ({ title, value, icon, color, bg }) => (
    <div className={`${bg} p-5 rounded-2xl border border-white/50`}>
        <div className="flex items-center gap-3 mb-2">
            {icon}
            <span className="text-sm font-medium text-slate-600">{title}</span>
        </div>
        <p className={`text-xl font-black tracking-tight ${color}`}>{value}</p>
    </div>
);

export default ExpenseManager;
