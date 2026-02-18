import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';
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

    if (loading) return <div className="h-40 bg-white rounded-2xl animate-pulse"></div>;

    const renderList = (list, type) => (
        <div className="space-y-3">
            {list.map((animal, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm w-4 h-4 flex items-center justify-center rounded-full ${type === 'HEAD' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {i + 1}
                        </span>
                        <span className="font-semibold text-slate-700">{animal.caravana_visual}</span>
                    </div>
                    <span className={`font-mono font-bold ${type === 'HEAD' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {animal.gdp_calculado} kg/d
                    </span>
                </div>
            ))}
            {list.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Sin datos suficientes</p>}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Cabeza del Hato */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <Award size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Top Rendimiento (Cabeza)</h3>
                        <p className="text-xs text-slate-400">Mayor Ganancia Diaria de Peso</p>
                    </div>
                </div>
                {renderList(ranking.cabeza, 'HEAD')}
            </div>

            {/* Cola del Hato */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Bajo Rendimiento (Cola)</h3>
                        <p className="text-xs text-slate-400">Menor Ganancia Diaria de Peso</p>
                    </div>
                </div>
                {renderList(ranking.cola, 'TAIL')}
            </div>
        </div>
    );
};

export default RankingReport;
