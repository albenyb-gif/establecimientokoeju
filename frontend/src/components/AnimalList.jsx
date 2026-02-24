import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Search, Download, MoreVertical, Filter, Database, TrendingUp, ChevronRight, Activity, ArrowRight } from 'lucide-react';
import AnimalService from '../services/animalService';
import PageHeader from './common/PageHeader';
import ReportGenerator from './ReportGenerator';

const AnimalList = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchAnimals();
    }, []);

    const fetchAnimals = async () => {
        try {
            const data = await AnimalService.getAnimals();
            setAnimals(data);
        } catch (error) {
            console.error('Error fetching animals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        ReportGenerator.generateStockReport(animals);
    };

    const filteredAnimals = animals.filter(a =>
        a.caravana_visual.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.rodeo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACTIVO': return 'bg-emerald-500 text-white shadow-emerald-500/20';
            case 'BLOQUEADO': return 'bg-rose-500 text-white shadow-rose-500/20';
            case 'CUARENTENA': return 'bg-amber-500 text-white shadow-amber-500/20';
            default: return 'bg-slate-400 text-white';
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Centro de Inventarios"
                subtitle="Monitoreo en tiempo real del stock ganadero y trazabilidad individual."
                icon={Database}
                actions={
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Filtrar por caravana, rodeo o categoría..."
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-50 focus:border-indigo-600 outline-none text-[13px] font-bold text-slate-800 bg-white shadow-sm transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleExport}
                            className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 px-8 font-black uppercase tracking-widest text-[10px]"
                        >
                            <Download size={16} /> Exportar PDF
                        </button>
                    </div>
                }
            />

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <th className="p-6 border-b border-slate-50 pl-8">Identidad SIAP</th>
                                <th className="p-6 border-b border-slate-50">Clasificación</th>
                                <th className="p-6 border-b border-slate-50">Unidad de Manejo</th>
                                <th className="p-6 border-b border-slate-50 text-right">Peso Bruto</th>
                                <th className="p-6 border-b border-slate-50">Modelo Negocio</th>
                                <th className="p-6 border-b border-slate-50 pl-8">Estado Sanitario</th>
                                <th className="p-6 border-b border-slate-50 text-center">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sincronizando registros...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAnimals.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center bg-slate-50/20">
                                        <Database size={48} className="mx-auto text-slate-100 mb-4 opacity-50" />
                                        <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">Sin coincidencias en el inventario actual</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAnimals.map((animal) => (
                                    <tr
                                        key={animal.id}
                                        onClick={() => navigate(`/animal/${animal.id}`)}
                                        className="hover:bg-slate-50 transition-all group cursor-pointer"
                                    >
                                        <td className="p-6 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-600 transition-colors"></div>
                                                <span className="font-mono font-black text-base text-slate-800 tracking-tighter group-hover:text-indigo-600 transition-colors">{animal.caravana_visual}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-700 uppercase tracking-tighter text-xs">{animal.categoria}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Biotipo Estándar</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-all border border-transparent group-hover:border-slate-100">
                                                    <Filter size={14} />
                                                </div>
                                                <span className="font-bold text-slate-600 uppercase text-[11px] tracking-tight">{animal.rodeo}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className="font-black text-lg text-slate-900 tracking-tighter">{animal.peso_actual}</span>
                                            <span className="text-[10px] font-black text-slate-300 ml-1 tracking-widest uppercase">Kg</span>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 rounded-lg text-[9px] font-black bg-slate-100 text-slate-500 uppercase tracking-[0.1em] border border-slate-200">
                                                {animal.negocio || 'REPOSICIÓN'}
                                            </span>
                                        </td>
                                        <td className="p-6 pl-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm ${getStatusStyle(animal.estado_sanitario)}`}>
                                                {animal.estado_sanitario}
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <button className="text-slate-200 hover:text-slate-900 p-2 rounded-xl transition-all group-hover:text-slate-400">
                                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/20">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Censo Actual: {filteredAnimals.length} Unidades Productivas</p>
                    <div className="flex gap-4">
                        <button className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-50" disabled>Anterior</button>
                        <button className="px-6 py-2 bg-white border border-slate-200 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors">Siguiente Capítulo</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimalList;
