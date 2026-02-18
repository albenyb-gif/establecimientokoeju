import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Users, Activity, AlertTriangle, DollarSign } from 'lucide-react';
import RankingReport from './RankingReport';

const Dashboard = ({ potreros }) => {
    // Calcular Estadísticas Globales
    const stats = useMemo(() => {
        const totalAnimales = potreros.reduce((acc, p) => acc + p.animales_total, 0);
        const totalHectareas = potreros.reduce((acc, p) => acc + p.superficie_ha, 0);
        const cargaPromedio = totalHectareas > 0 ? (totalAnimales / totalHectareas).toFixed(2) : 0;
        const alertasCarga = potreros.filter(p => (p.animales_total / p.superficie_ha) > 3).length;

        return { totalAnimales, totalHectareas, cargaPromedio, alertasCarga };
    }, [potreros]);

    // Datos para Gráfico (Mock Distribution)
    const dataDistribution = [
        { name: 'Novillos', value: 450, color: '#3b82f6' },
        { name: 'Vaquillas', value: 300, color: '#ec4899' },
        { name: 'Terneros', value: 200, color: '#f59e0b' },
        { name: 'Toros', value: 20, color: '#ef4444' },
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* Header de Bienvenida */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        Panel General
                    </h1>
                    <p className="text-slate-500">Resumen de actividad y estado del establecimiento.</p>
                </div>
                <div className="flex gap-2 text-sm font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                    <span className="text-slate-400">Última actualización:</span>
                    <span className="text-emerald-600">Hace 5 minutos</span>
                </div>
            </div>

            {/* Alertas de Oportunidad de Venta */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <DollarSign size={32} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">Oportunidad de Venta Detectada</h3>
                            <p className="text-emerald-50 opacity-90">Detectamos <span className="font-black text-white">45 Novillos</span> con peso de faena (+450kg).</p>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-sm">
                        Simular Venta
                    </button>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute left-20 bottom-0 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            </div>

            {/* Tarjetas de Resumen (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Total Hacienda"
                    value={stats.totalAnimales}
                    unit="Cabezas"
                    icon={<Users size={24} className="text-blue-600" />}
                    trend="+12% vs mes anterior"
                    trendColor="text-emerald-500"
                />
                <KpiCard
                    title="Carga Media"
                    value={stats.cargaPromedio}
                    unit="Cab/Ha"
                    icon={<Activity size={24} className="text-purple-600" />}
                    trend="Óptimo (Meta: 2.5)"
                    trendColor="text-blue-500"
                />
                <KpiCard
                    title="Superficie Uso"
                    value={stats.totalHectareas}
                    unit="Hectáreas"
                    icon={<TrendingUp size={24} className="text-emerald-600" />}
                    trend="100% Operativo"
                    trendColor="text-slate-400"
                />
                <KpiCard
                    title="Alertas Carga"
                    value={stats.alertasCarga}
                    unit="Potreros"
                    icon={<AlertTriangle size={24} className="text-orange-600" />}
                    trend="Requiere Atención"
                    trendColor="text-orange-500"
                    alert={stats.alertasCarga > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico de Distribución */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-1 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-slate-800 w-full mb-4">Composición del Hato</h3>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataDistribution}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dataDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        {dataDistribution.map((d) => (
                            <div key={d.name} className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-slate-600">{d.name}</span>
                                <span className="font-bold ml-auto">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lista de Potreros (Estado de Carga) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Estado de Potreros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {potreros.map((p) => {
                            const carga = (p.animales_total / p.superficie_ha).toFixed(2);
                            const isOverloaded = carga > 3;

                            return (
                                <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-colors">
                                    <div>
                                        <h4 className="font-bold text-slate-700">{p.nombre}</h4>
                                        <p className="text-xs text-slate-400">{p.superficie_ha} Ha</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-slate-800">{p.animales_total}</p>
                                        <div className={`text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 ${isOverloaded ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {carga} UA/Ha
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Informe de Rendimiento (Cattler-PY Ranking) */}
            <RankingReport />
        </div>
    );
};

const KpiCard = ({ title, value, unit, icon, trend, trendColor, alert }) => (
    <div className={`bg-white p-6 rounded-3xl shadow-sm border ${alert ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${alert ? 'bg-red-100' : 'bg-slate-50'}`}>
                {icon}
            </div>
            {alert && <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>}
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {value} <span className="text-base font-medium text-slate-400">{unit}</span>
            </h3>
            <p className={`text-xs font-bold mt-3 ${trendColor}`}>
                {trend}
            </p>
        </div>
    </div>
);

export default Dashboard;
