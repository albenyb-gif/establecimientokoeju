import React from 'react';

const AnimalCard = ({ animal }) => {
    const isBlocked = new Date() < new Date(animal.fecha_liberacion_carencia);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-sm mx-auto transition-transform hover:scale-[1.02]">
            {/* Header con Estado Sanitario */}
            <div className={`p-4 flex justify-between items-center ${isBlocked ? 'bg-red-50' : 'bg-green-50'}`}>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Caravana: {animal.caravana_visual}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isBlocked ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                    {isBlocked ? 'BLOQUEADO - CARENCIA' : 'APTO PARA VENTA'}
                </span>
            </div>

            <div className="p-6">
                {/* Info Principal */}
                <div className="flex justify-between mb-4">
                    <div>
                        <p className="text-3xl font-black text-slate-800">{animal.peso_actual} <span className="text-sm font-normal text-gray-400">Kg</span></p>
                        <p className="text-xs text-gray-400">Peso Actual</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-slate-700">{animal.categoria}</p>
                        <p className="text-xs text-gray-400">Categoría</p>
                    </div>
                </div>

                {/* Ubicación y Negocio */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-600">{animal.rodeo}</p>
                        <p className="text-[10px] text-gray-400 uppercase">Rodeo Actual</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-600">{animal.negocio}</p>
                        <p className="text-[10px] text-gray-400 uppercase">Destino</p>
                    </div>
                </div>

                {/* Historial (Simbolizado como Sparkline/Badge) */}
                <div className="mt-6">
                    <div className="h-12 w-full bg-slate-50 rounded-lg flex items-end p-2 gap-1">
                        {/* Gráfico de barras minimalista */}
                        {[40, 60, 55, 80, 75, 95].map((h, i) => (
                            <div key={i} className="bg-blue-400 rounded-t w-full" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <p className="text-[10px] text-center text-gray-400 mt-2">Historial de Ganancia de Peso</p>
                </div>
            </div>
        </div>
    );
};

export default AnimalCard;
