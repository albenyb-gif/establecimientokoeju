import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Wallet, TrendingDown, Landmark, PieChart, Activity } from 'lucide-react';
import PageHeader from './common/PageHeader';
import AnimalService from '../services/animalService';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value || 0).replace('PYG', '₲');
};

const CostDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await AnimalService.getCostAnalysis();
                setData(result);
            } catch (error) {
                console.error("Error fetching cost analysis:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="font-black uppercase tracking-[0.2em] text-xs">Analizando Datos Económicos</p>
        </div>
    );

    if (!data) return (
        <div className="bg-white p-16 rounded-[2rem] border-2 border-dashed border-slate-100 text-center">
            <Landmark size={48} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sin registros financieros suficientes</p>
        </div>
    );

    const { resumen, gastos_por_categoria, costo_kilo_producido } = data;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Centro de Costos"
                subtitle="Análisis predictivo y rentabilidad operativa por unidad productiva."
                icon={Landmark}
            />

            {/* KPIs Financieros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Ingresos Totales"
                    value={formatCurrency(resumen.ingresos_totales)}
                    icon={<Wallet size={22} />}
                    color="text-emerald-600"
                    trend="Facturación Bruta"
                    bg="bg-white"
                />
                <KpiCard
                    title="Carga Operativa"
                    value={formatCurrency(resumen.gastos_totales)}
                    icon={<TrendingDown size={22} />}
                    color="text-red-500"
                    trend="Egresos Totales"
                    bg="bg-white"
                />
                <KpiCard
                    title="Resultado Neto"
                    value={formatCurrency(resumen.rentabilidad)}
                    icon={<DollarSign size={22} />}
                    color="text-slate-900"
                    trend="Margen de Ganancia"
                    bg="bg-white"
                />
                <KpiCard
                    title="Eficiencia"
                    value={`${resumen.margen}%`}
                    icon={<TrendingUp size={22} />}
                    color="text-indigo-600"
                    trend="Margen Operativo"
                    bg="bg-white"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Desglose de Gastos */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4 flex items-center gap-2">
                        <PieChart size={14} /> Distribución de Inversiones
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gastos_por_categoria} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="value" fill="#0f172a" radius={[0, 12, 12, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Costo por Kilo Producido (Tendencia) */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4 flex items-center gap-2">
                        <Activity size={14} /> Costo por Kg Producido (Punto de Equilibrio)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={costo_kilo_producido}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="costo" stroke="#10b981" strokeWidth={5} dot={{ r: 6, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
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

export default CostDashboard;
