import React, { useState } from 'react';
import { Scale, Save, ArrowLeft, Activity, Target, TrendingUp, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from './common/PageHeader';
import AnimalService from '../services/animalService';

const WeighingView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [weight, setWeight] = useState('');
    const [gdp, setGdp] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!weight) return;
        setLoading(true);
        try {
            const response = await AnimalService.registerWeight(id, weight);
            setGdp(response.gdp);
            // We use a custom notification instead of alert for premium feel
            // But for now, we'll keep the navigate behavior
            navigate(-1);
        } catch (error) {
            console.error('Error saving weight:', error);
            alert('Error al intentar persistir el pesaje.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Captura de Pesaje"
                subtitle="Registro biométrico y autocalculación de Ganancia Diaria de Peso (GDP)."
                icon={Scale}
                actions={
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white text-slate-600 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                    >
                        <ArrowLeft size={16} /> Cancelar
                    </button>
                }
            />

            <div className="grid grid-cols-1 gap-8">
                {/* Main Input Area */}
                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center gap-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 text-slate-200 -mr-6 -mt-6">
                        <Scale size={180} />
                    </div>

                    <div className="text-center space-y-2 z-10">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                            <Target size={32} />
                        </div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Métrica Actual</h2>
                        <p className="text-sm font-bold text-slate-500">Ingrese el peso en Kilogramos (Bruto)</p>
                    </div>

                    <div className="w-full max-w-xs relative z-10">
                        <div className="flex items-center justify-center relative group">
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full text-center text-8xl font-black text-slate-900 border-none focus:ring-0 p-0 placeholder-slate-100 selection:bg-blue-100"
                                placeholder="000"
                                autoFocus
                            />
                            <span className="absolute -right-8 bottom-4 text-2xl font-black text-slate-300 group-focus-within:text-blue-500 transition-colors uppercase tracking-widest">Kg</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full bg-blue-500 transition-all duration-500 ${weight ? 'w-full' : 'w-0'}`}></div>
                        </div>
                    </div>

                    {gdp && (
                        <div className="animate-in zoom-in-95 duration-500 bg-emerald-500 p-6 rounded-[2rem] flex flex-col items-center gap-2 text-white shadow-xl shadow-emerald-500/20 w-full max-w-sm">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Resultado de Performance</span>
                            </div>
                            <p className="text-3xl font-black tracking-tighter">{gdp} KG/DÍA</p>
                        </div>
                    )}

                    <div className="w-full pt-6 z-10">
                        <button
                            onClick={handleSave}
                            disabled={loading || !weight}
                            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-xl font-black shadow-2xl shadow-slate-900/10 hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20 uppercase tracking-widest"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Procesando...
                                </div>
                            ) : (
                                <><Save size={24} /> Guardar Pesaje</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-blue-50 border border-blue-100 rounded-[2rem]">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                        <Info size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed">
                        El sistema calculará automáticamente la Ganancia Diaria de Peso (GDP) comparando este registro con el pesaje anterior más reciente.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WeighingView;
