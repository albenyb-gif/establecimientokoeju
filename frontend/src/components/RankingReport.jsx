import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle, Zap, ShieldAlert } from 'lucide-react';
import AnimalService from '../services/animalService';

const RankingReport = () => {
    const [ranking, setRanking] = useState({ cabeza: [], cola: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const data = await AnimalService.getRanking();
                setRanking(data);
            } catch (error) {
                console.error('Error fetching ranking:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRanking();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="h-48 bg-slate-50 border border-slate-100 rounded-[2rem] animate-pulse"></div>
            <div className="h-48 bg-slate-50 border border-slate-100 rounded-[2rem] animate-pulse"></div>
        </div>
    );

    const renderList = (list, type) => (
        <div className="space-y-4">
            {list.map((animal, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all rounded-2xl group border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs border-2 shadow-sm
                            ${type === 'HEAD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-900/5' : 'bg-red-50 text-red-600 border-red-100 shadow-red-900/5'}`}>
                            #{i + 1}
                        </div>
                        <div>
                            <p className="font-black text-slate-800 text-sm tracking-tight">{animal.caravana_visual}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificador Stock</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-black text-sm tracking-tighter ${type === 'HEAD' ? 'text-emerald-600' : 'text-red-500'}`}>
                            +{animal.gdp_calculado} <span className="text-[10px]">KG/D</span>
                        </p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Perf. Biológica</p>
                    </div>
                </div>
            ))}
            {list.length === 0 && (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Datos insuficientes para ranking</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Cabeza del Hato */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-500 -mr-4 -mt-4">
                    <Zap size={100} />
                </div>
                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-500/20">
                        <Award size={24} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Liderazgo Biológico</h3>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            Top Rendimiento (Cabeza)
                        </h2>
                    </div>
                </div>
                <div className="relative z-10">
                    {renderList(ranking.cabeza, 'HEAD')}
                </div>
            </div>

            {/* Cola del Hato */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-red-500 -mr-4 -mt-4">
                    <ShieldAlert size={100} />
                </div>
                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-3 bg-red-500 rounded-2xl text-white shadow-xl shadow-red-500/20">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Atención Crítica</h3>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            Bajo Rendimiento (Cola)
                        </h2>
                    </div>
                </div>
                <div className="relative z-10">
                    {renderList(ranking.cola, 'TAIL')}
                </div>
            </div>
        </div>
    );
};

export default RankingReport;
