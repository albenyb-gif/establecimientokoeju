import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Truck, Percent, Info, ArrowRight, Gauge, Scale, Landmark } from 'lucide-react';
import PageHeader from './common/PageHeader';

const SalesSimulator = () => {
    const [inputs, setInputs] = useState({
        cantidad: 1,
        peso_promedio: 400,
        precio_kg: 12000,
        comision_feria: 3.5, // %
        flete_total: 1500000,
        tasa_senacsa: 25000 // Gs por cabeza aprox
    });

    const [results, setResults] = useState(null);

    useEffect(() => {
        calculate();
    }, [inputs]);

    const calculate = () => {
        const peso_total = inputs.cantidad * inputs.peso_promedio;
        const bruto = peso_total * inputs.precio_kg;

        const costo_comision = bruto * (inputs.comision_feria / 100);
        const costo_senacsa = inputs.cantidad * inputs.tasa_senacsa;
        const iva_agro = bruto * 0.05;

        const total_descuentos = costo_comision + inputs.flete_total + costo_senacsa + iva_agro;
        const neto = bruto - total_descuentos;

        setResults({
            bruto,
            peso_total,
            costo_comision,
            costo_senacsa,
            iva_agro,
            total_descuentos,
            neto,
            promedio_cabeza: neto / inputs.cantidad,
            precio_neto_kg: neto / peso_total
        });
    };

    const handleChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(val || 0).replace('PYG', '₲');

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Simulador de Venta"
                subtitle="Proyección pro-forma de liquidaciones y márgenes de comercialización."
                icon={Calculator}
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Inputs Area */}
                <div className="md:col-span-12 lg:col-span-5 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4 flex items-center gap-2">
                            <Scale size={14} /> Parámetros de la Tropa
                        </h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cant. Cabezas</label>
                                <input
                                    type="number" name="cantidad" value={inputs.cantidad} onChange={handleChange}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-black text-slate-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Peso Prom. (Kg)</label>
                                <input
                                    type="number" name="peso_promedio" value={inputs.peso_promedio} onChange={handleChange}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-black text-slate-800 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio Mercado (Gs/Kg)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₲</span>
                                <input
                                    type="number" name="precio_kg" value={inputs.precio_kg} onChange={handleChange}
                                    className="w-full pl-10 p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-black text-slate-800 text-xl transition-all"
                                />
                            </div>
                        </div>

                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4 pt-4 flex items-center gap-2">
                            <Landmark size={14} /> Gastos Comerciales Estimados
                        </h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Comisión Feria (%)</label>
                                <input
                                    type="number" name="comision_feria" value={inputs.comision_feria} onChange={handleChange}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tasas (Gs/Cab)</label>
                                <input
                                    type="number" name="tasa_senacsa" value={inputs.tasa_senacsa} onChange={handleChange}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Logística / Flete Total (Gs)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold"><Truck size={16} /></span>
                                <input
                                    type="number" name="flete_total" value={inputs.flete_total} onChange={handleChange}
                                    className="w-full pl-12 p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Area */}
                <div className="md:col-span-12 lg:col-span-7">
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white h-full flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 text-white group-hover:scale-110 transition-transform">
                            <Gauge size={240} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <DollarSign size={16} className="text-emerald-500" /> Resultado de Liquidación
                                </h3>
                                <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">PRO-FORMA</span>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-end pb-6 border-b border-white/10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Bruto Operativo</p>
                                        <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(results?.bruto)}</p>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 mb-1">{inputs.cantidad} Cab. x {inputs.peso_promedio} Kg</p>
                                </div>

                                <div className="space-y-4 py-4">
                                    <div className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Flete & Logística</span>
                                        </div>
                                        <span className="font-black text-red-400 font-mono">(-) {formatCurrency(inputs.flete_total)}</span>
                                    </div>
                                    <div className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Comisión Comercial ({inputs.comision_feria}%)</span>
                                        </div>
                                        <span className="font-black text-red-400 font-mono">(-) {formatCurrency(results?.costo_comision)}</span>
                                    </div>
                                    <div className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Gravámenes & Tasas</span>
                                        </div>
                                        <span className="font-black text-red-400 font-mono">(-) {formatCurrency(results?.costo_senacsa + results?.iva_agro)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t-2 border-dashed border-white/10 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Proyección Neta Estimada</p>
                                    <h4 className="text-6xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">{formatCurrency(results?.neto)}</h4>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between min-w-[220px]">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prom./Cabeza</p>
                                        <p className="text-lg font-black text-white">{formatCurrency(results?.promedio_cabeza)}</p>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between min-w-[220px]">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kg/Neto ₲</p>
                                        <p className="text-lg font-black text-white">{formatCurrency(results?.precio_neto_kg)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                <Info size={18} className="text-emerald-400 shrink-0" />
                                <p className="text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest leading-relaxed">Simulación basada en parámetros actuales de mercado. Los costos de IVA y Tasas son estimativos según régimen general.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesSimulator;
