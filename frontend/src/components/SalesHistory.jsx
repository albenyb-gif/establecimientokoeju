import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, FileText, ChevronRight, Printer, ArrowLeft, TrendingDown, DollarSign, Package, Save } from 'lucide-react';
import AnimalService from '../services/animalService';
import ReportGenerator from './ReportGenerator';

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const data = await AnimalService.getSalesHistory();
            setSales(data);
        } catch (error) {
            console.error('Error fetching sales history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        return new Date(dateStr).toLocaleDateString('es-PY', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('es-PY', {
            style: 'currency', currency: 'PYG', maximumFractionDigits: 0
        }).format(val || 0).replace('PYG', '₲');

    const filteredSales = sales.filter(s => 
        (s.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.destino || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePrintVoucher = (sale) => {
        // Adaptamos los datos para el generador de reportes
        const saleData = {
            fecha: sale.fecha,
            cliente: sale.cliente,
            destino: sale.destino,
            ruc: '', // No guardado en la tabla de ventas directamente por ahora
            peso_total: sale.peso_total,
            total_bruto: sale.total_bruto,
            descuentos: sale.descuentos_total,
            total_neto: sale.total_neto,
            observaciones: sale.observaciones
        };

        // El generador espera los animales en formato { caravana_visual, categoria, rodeo, peso_actual }
        const selectedAnimals = sale.animales.map(a => ({
            caravana_visual: a.caravana_visual,
            categoria: a.categoria,
            rodeo: 'Salida',
            peso_actual: a.peso_salida
        }));

        ReportGenerator.generateSalesVoucher(saleData, selectedAnimals);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Historial de Ventas</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registro histórico de liquidaciones de hacienda</p>
                </div>
                
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o destino..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium"
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSales.map((sale) => (
                    <div 
                        key={sale.id}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all overflow-hidden group border-b-4 border-b-indigo-500/10"
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                                        <Calendar size={10} />
                                        {formatDate(sale.fecha)}
                                    </div>
                                    <h3 className="font-black text-slate-800 line-clamp-1">{sale.cliente}</h3>
                                </div>
                                <button 
                                    onClick={() => handlePrintVoucher(sale)}
                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Re-imprimir Liquidación"
                                >
                                    <Printer size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-2xl">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Animales</p>
                                    <p className="text-lg font-black text-slate-800">{sale.cantidad_animales}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Peso Total</p>
                                    <p className="text-lg font-black text-slate-800">{sale.peso_total.toLocaleString()} <span className="text-[10px] text-slate-400">kg</span></p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Total Neto Cobrado</p>
                                <p className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(sale.total_neto)}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-2">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <TrendingDown size={14} className="text-rose-400" />
                                    <span className="font-bold">Descuentos: {formatCurrency(sale.descuentos_total)}</span>
                                </div>
                                <button 
                                    onClick={() => setSelectedSale(sale)}
                                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    Ver Detalle <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredSales.length === 0 && (
                    <div className="col-span-full bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                            <DollarSign size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">No hay ventas registradas</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">Cuando realices una liquidación de animales, aparecerá aquí el historial detallado.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedSale && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-10">
                            <div>
                                <h3 className="font-black text-slate-800 text-xl tracking-tight">Detalle de Liquidación</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lote ID #{selectedSale.id} — {formatDate(selectedSale.fecha)}</p>
                            </div>
                            <button onClick={() => setSelectedSale(null)} className="p-3 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Cabezas</p>
                                    <p className="text-lg font-black text-slate-800">{selectedSale.cantidad_animales}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Peso Prom.</p>
                                    <p className="text-lg font-black text-slate-800">{(selectedSale.peso_total / selectedSale.cantidad_animales).toFixed(1)} <span className="text-[10px]">kg</span></p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Precio/Kg</p>
                                    <p className="text-lg font-black text-indigo-600">{formatCurrency(selectedSale.precio_promedio_kg)}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Total Neto</p>
                                    <p className="text-lg font-black text-emerald-600">{formatCurrency(selectedSale.total_neto)}</p>
                                </div>
                            </div>

                            {/* Animals Table */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Package size={16} className="text-slate-400" />
                                    Animales Incluidos
                                </h4>
                                <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">Caravana</th>
                                                <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">Categoría</th>
                                                <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase text-right">Peso Salida</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedSale.animales.map((a, idx) => (
                                                <tr key={idx} className="hover:bg-white transition-colors">
                                                    <td className="px-6 py-4 font-black text-slate-700">{a.caravana_visual}</td>
                                                    <td className="px-6 py-4 text-slate-500 font-bold">{a.categoria || '---'}</td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-800">{a.peso_salida} kg</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400" />
                                    Información Comercial
                                </h4>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-2 gap-y-6">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Cliente / Comprador</p>
                                        <p className="font-black text-slate-800">{selectedSale.cliente}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Destino</p>
                                        <p className="font-black text-slate-800 text-sm">{selectedSale.destino || '---'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Observaciones</p>
                                        <p className="text-slate-600 text-sm italic">{selectedSale.observaciones || 'Sin observaciones registradas.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button 
                                onClick={() => setSelectedSale(null)}
                                className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                            >
                                Cerrar Ventana
                            </button>
                            <button 
                                onClick={() => handlePrintVoucher(selectedSale)}
                                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
                            >
                                <Printer size={18} /> Re-imprimir PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const X = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default SalesHistory;
