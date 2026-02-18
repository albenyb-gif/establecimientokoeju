import React from 'react';

const LoadingDashboard = ({ potreros }) => {
    return (
        <div className="p-4 bg-slate-900 min-h-screen text-white">
            <h2 className="text-2xl font-black mb-6 border-l-4 border-yellow-400 pl-4 uppercase">
                Dashboard de Carga Animal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {potreros.map((p) => {
                    const carga = (p.animales_total / p.superficie_ha).toFixed(2);
                    const alertColor = carga > 3 ? 'text-red-400' : 'text-green-400';

                    return (
                        <div key={p.id} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-yellow-400/50 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold group-hover:text-yellow-400 transition-colors">{p.nombre}</h3>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest">{p.superficie_ha} Hectáreas</p>
                                </div>
                                <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center">
                                    🐄
                                </div>
                            </div>

                            <div className="mt-8">
                                <p className={`text-4xl font-black ${alertColor}`}>{carga}</p>
                                <p className="text-xs text-slate-400 font-medium">Cabezas por Hectárea</p>
                            </div>

                            <div className="mt-6 h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${carga > 3 ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min((carga / 5) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LoadingDashboard;
