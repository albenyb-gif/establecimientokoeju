import React, { useState } from 'react';
import { Scale, Save, ArrowLeft, Activity } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
            alert(`Peso guardado. GDP: ${response.gdp} kg/día`);
            navigate(-1);
        } catch (error) {
            console.error('Error saving weight:', error);
            alert('Error al guardar peso');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <h1 className="text-2xl font-black text-slate-800">Registro de Pesaje</h1>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center">
                    <Scale size={64} className="mx-auto text-blue-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-600 mb-2">Peso Actual (Kg)</h2>
                    <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full text-center text-6xl font-black text-slate-800 border-none focus:ring-0 p-0 placeholder-slate-200"
                        placeholder="000"
                        autoFocus
                    />
                </div>

                {gdp && (
                    <div className="bg-emerald-100 p-4 rounded-xl flex items-center justify-center gap-2 text-emerald-800 font-bold">
                        <Activity size={20} />
                        GDP Calculada: {gdp} kg/día
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full py-6 bg-blue-600 text-white rounded-2xl text-2xl font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Save size={32} />
                    {loading ? 'GUARDANDO...' : 'GUARDAR PESO'}
                </button>
            </div>
        </div>
    );
};

export default WeighingView;
