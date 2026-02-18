import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Truck, Percent, Info } from 'lucide-react';

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
        // IVA Agropecuario 5% sobre el precio de venta (en regimen general) o 2.5% IR agro si aplica. 
        // Simplificación: 5% sobre Bruto - Gtos Deducibles. Aprox 5% del Bruto para simulación rápida.
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

    const formatCurrency = (val) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(val);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Calculator className="text-blue-600" size={32} />
                    Simulador de Venta
                </h1>
                <p className="text-slate-500 mt-2">Calculadora de liquidación pro-forma y rentabilidad neta.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                    <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-2">Parámetros de la Tropa</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cant. Cabezas</label>
                            <input
                                type="number" name="cantidad" value={inputs.cantidad} onChange={handleChange}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso Prom. (Kg)</label>
                            <input
                                type="number" name="peso_promedio" value={inputs.peso_promedio} onChange={handleChange}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Mercado (Gs/Kg)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400">$</span>
                            <input
                                type="number" name="precio_kg" value={inputs.precio_kg} onChange={handleChange}
                                className="w-full pl-8 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                            />
                        </div>
                    </div>

                    <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-2 pt-4">Gastos Comerciales</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Comisión Feria (%)</label>
                            <input
                                type="number" name="comision_feria" value={inputs.comision_feria} onChange={handleChange}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tasas (Gs/Cab)</label>
                            <input
                                type="number" name="tasa_senacsa" value={inputs.tasa_senacsa} onChange={handleChange}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Flete Total Estimado (Gs)</label>
                        <input
                            type="number" name="flete_total" value={inputs.flete_total} onChange={handleChange}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                        />
                    </div>
                </div>

                {/* Resultados */}
                <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-slate-400 mb-6 flex items-center gap-2">
                            <DollarSign size={20} /> Resultado Proyectado
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                                <span className="text-slate-400">Bruto (Sin Descuentos)</span>
                                <span className="font-bold text-xl">{formatCurrency(results?.bruto)}</span>
                            </div>

                            <div className="space-y-2 text-sm text-red-300">
                                <div className="flex justify-between">
                                    <span>(-) Flete</span>
                                    <span>{formatCurrency(inputs.flete_total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>(-) Comisión ({inputs.comision_feria}%)</span>
                                    <span>{formatCurrency(results?.costo_comision)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>(-) Tasas & Impuestos</span>
                                    <span>{formatCurrency(results?.costo_senacsa + results?.iva_agro)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-700">
                        <p className="text-slate-400 text-sm mb-1">Neto a Cobrar</p>
                        <p className="text-4xl font-black text-emerald-400 tracking-tight">{formatCurrency(results?.neto)}</p>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-slate-800 rounded-xl p-4">
                                <p className="text-slate-400 text-xs">Por Cabeza</p>
                                <p className="font-bold text-lg text-white">{formatCurrency(results?.promedio_cabeza)}</p>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-4">
                                <p className="text-slate-400 text-xs">Precio Neto Kg</p>
                                <p className="font-bold text-lg text-white">{formatCurrency(results?.precio_neto_kg)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesSimulator;
