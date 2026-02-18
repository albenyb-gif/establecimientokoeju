import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Wallet, TrendingDown } from 'lucide-react';
import AnimalService from '../services/animalService';

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

    if (loading) return <div className="text-center mt-20 text-slate-400">Cargando análisis de costos...</div>;
    if (!data) return <div className="text-center mt-20 text-slate-400">No hay datos disponibles.</div>;

    const { resumen, gastos_por_categoria, costo_kilo_producido } = data;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        Gestión de Costos
                    </h1>
                    <p className="text-slate-500">Análisis financiero y rentabilidad operativa.</p>
                </div>
            </div>

            {/* KPIs Financieros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Ingresos Totales"
                    value={formatCurrency(resumen.ingresos_totales)}
                    icon={<Wallet size={24} className="text-green-600" />}
                    color="text-green-600"
                />
                <KpiCard
                    title="Gastos Totales"
                    value={formatCurrency(resumen.gastos_totales)}
                    icon={<TrendingDown size={24} className="text-red-600" />}
                    color="text-red-600"
                />
                <KpiCard
                    title="Rentabilidad Neta"
                    value={formatCurrency(resumen.rentabilidad)}
                    icon={<DollarSign size={24} className="text-blue-600" />}
                    color="text-slate-800"
                />
                <KpiCard
                    title="Margen Operativo"
                    value={`${resumen.margen}%`}
                    icon={<TrendingUp size={24} className="text-purple-600" />}
                    color="text-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Desglose de Gastos */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6">Distribución de Gastos</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gastos_por_categoria} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Costo por Kilo Producido (Tendencia) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6">Costo por Kg Producido (Gs)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={costo_kilo_producido}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="mes" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="costo" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-center">
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <h3 className={`text-xl md:text-2xl font-black tracking-tight ${color}`}>
                {value}
            </h3>
        </div>
    </div>
);

const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(value);
};

export default CostDashboard;
