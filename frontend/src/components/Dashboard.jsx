import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import PageHeader from './common/PageHeader';
import {
    LayoutDashboard, TrendingUp, Users, Activity, AlertTriangle,
    DollarSign, ShoppingCart, Scale, Calendar, MapPin, ChevronRight, Beef
} from 'lucide-react';
import AnimalService from '../services/animalService';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = [
    '#6366f1', '#f43f5e', '#3b82f6', '#ec4899',
    '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444', '#84cc16'
];

const formatGs = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 })
        .format(v || 0).replace('PYG', '₲');

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const EMPTY = { totales: {}, porCategoria: [], porRodeo: [], comprasStats: {}, ultimasCompras: [], gdpStats: {} };

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const now = new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });

    useEffect(() => {
        AnimalService.getPanelStats()
            .then(setData)
            .catch(() => setData(EMPTY))
            .finally(() => setLoading(false));
    }, []);

    const { totales, porCategoria, porRodeo, comprasStats, ultimasCompras, gdpStats } = data;
    const t = totales || {};

    const pieData = (porCategoria || []).map((c, i) => ({
        name: c.categoria || 'Sin Cat.',
        value: Number(c.total),
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
    }));

    const barData = (porRodeo || []).map(r => ({
        name: r.rodeo || 'S/N',
        animales: Number(r.total)
    }));

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-300">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Cargando Panel...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="Panel General"
                subtitle="Resumen de actividad y estado del establecimiento."
                icon={LayoutDashboard}
                actions={
                    <div className="flex gap-2 text-sm font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                        <span className="text-slate-400">Actualizado:</span>
                        <span className="text-emerald-600 font-bold">{now}</span>
                    </div>
                }
            />

            {/* Banner Principal */}
            <div
                onClick={() => navigate('/lista')}
                className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] p-6 shadow-2xl text-white relative overflow-hidden cursor-pointer hover:from-emerald-900 hover:to-slate-800 transition-all group"
            >
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                            <Beef size={36} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Stock Actual</p>
                            <h2 className="font-black text-4xl tracking-tight">{Number(t.total_animales) || 0} <span className="text-xl font-medium text-slate-400">cabezas</span></h2>
                            <p className="text-slate-400 text-sm mt-1">Hacienda activa en el establecimiento</p>
                        </div>
                    </div>
                    <div className="flex gap-3 flex-wrap justify-center">
                        <StatBadge label="Activos" value={t.sanitario_activo || 0} color="emerald" />
                        {Number(t.sanitario_bloqueado) > 0 && <StatBadge label="Bloqueados" value={t.sanitario_bloqueado} color="red" />}
                        {Number(t.sanitario_cuarentena) > 0 && <StatBadge label="Cuarentena" value={t.sanitario_cuarentena} color="amber" />}
                        <StatBadge label="Engorde" value={t.negocio_engorde || 0} color="blue" />
                        <StatBadge label="Cría" value={t.negocio_cria || 0} color="purple" />
                    </div>
                </div>
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute right-20 bottom-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                <div className="absolute top-4 right-4 text-slate-600 group-hover:text-slate-400 transition-colors">
                    <ChevronRight size={24} />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Peso Promedio"
                    value={`${Number(t.peso_promedio || 0).toFixed(0)} kg`}
                    icon={<Scale size={22} className="text-blue-500" />}
                    sub="Por animal activo"
                    color="blue"
                    onClick={() => navigate('/lista')}
                />
                <KpiCard
                    label="GDP Promedio"
                    value={`${Number(gdpStats?.gdp_promedio || 0).toFixed(3)} kg/d`}
                    icon={<TrendingUp size={22} className="text-emerald-500" />}
                    sub="Ganancia diaria"
                    color="emerald"
                    onClick={() => navigate('/lista')}
                />
                <KpiCard
                    label="Lotes Comprados"
                    value={comprasStats?.total_lotes || 0}
                    icon={<ShoppingCart size={22} className="text-indigo-500" />}
                    sub={`${comprasStats?.total_cabezas_compradas || 0} cabezas en total`}
                    color="indigo"
                    onClick={() => navigate('/compras')}
                />
                <KpiCard
                    label="Inversión Total"
                    value={formatGs(comprasStats?.total_invertido)}
                    icon={<DollarSign size={22} className="text-amber-500" />}
                    sub={`Última: ${formatDate(comprasStats?.ultima_compra)}`}
                    color="amber"
                    onClick={() => navigate('/compras')}
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Torta Categorías */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
                        <span className="w-2 h-5 bg-indigo-500 rounded-full" /> Composición del Hato
                    </h3>
                    {pieData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-52 text-slate-300">
                            <Beef size={40} className="mb-3 opacity-30" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sin animales registrados</p>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="w-full md:w-48 h-48 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [`${v} cab.`, n]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                                {pieData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                        <span className="text-xs text-slate-600 flex-1 truncate">{d.name}</span>
                                        <span className="font-black text-slate-800 text-sm">{d.value}</span>
                                        <span className="text-[10px] text-slate-400 w-10 text-right">
                                            {((d.value / (t.total_animales || 1)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bar por Rodeo */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
                        <span className="w-2 h-5 bg-emerald-500 rounded-full" /> Distribución por Rodeo
                    </h3>
                    {barData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-52 text-slate-300">
                            <MapPin size={40} className="mb-3 opacity-30" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sin rodeos asignados</p>
                        </div>
                    ) : (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} barCategoryGap="30%">
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(v) => [`${v} cabezas`]} />
                                    <Bar dataKey="animales" fill="#10b981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Últimas Compras */}
            {(ultimasCompras || []).length > 0 && (
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                            <span className="w-2 h-5 bg-amber-500 rounded-full" /> Últimas Compras
                        </h3>
                        <button onClick={() => navigate('/compras', { state: { tab: 'historial' } })} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                            Ver todas <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {ultimasCompras.map(c => (
                            <div key={c.id} onClick={() => navigate('/compras')} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                    <ShoppingCart size={18} className="text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-800 text-sm">Lote #{c.id} — {c.cantidad_animales} cab.</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{c.vendedor || 'S/N'} · {c.lugar_procedencia || 'S/N'}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-black text-emerald-600 text-sm">{formatGs(c.costo_total)}</p>
                                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end">
                                        <Calendar size={10} />{formatDate(c.fecha)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatBadge = ({ label, value, color }) => {
    const colors = {
        emerald: 'bg-emerald-500/20 text-emerald-300',
        red: 'bg-red-500/20 text-red-300',
        amber: 'bg-amber-500/20 text-amber-300',
        blue: 'bg-blue-500/20 text-blue-300',
        purple: 'bg-purple-500/20 text-purple-300',
    };
    return (
        <div className={`px-4 py-2 rounded-2xl text-center ${colors[color] || colors.emerald}`}>
            <p className="font-black text-lg leading-none">{value}</p>
            <p className="text-[9px] uppercase tracking-widest opacity-80 mt-0.5">{label}</p>
        </div>
    );
};

const KpiCard = ({ label, value, icon, sub, color, onClick }) => {
    const colors = {
        blue: 'bg-blue-50', emerald: 'bg-emerald-50', indigo: 'bg-indigo-50', amber: 'bg-amber-50'
    };
    return (
        <div onClick={onClick} className={`bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
            <div className={`w-10 h-10 ${colors[color] || 'bg-slate-50'} rounded-xl flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="font-black text-slate-900 text-lg tracking-tight leading-tight">{value}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">{sub}</p>
        </div>
    );
};

export default Dashboard;
