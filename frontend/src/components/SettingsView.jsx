import React, { useState } from 'react';
import { Save, Settings, ShieldAlert } from 'lucide-react';

const SettingsView = () => {
    const [config, setConfig] = useState({
        establecimiento_nombre: 'Estancia El Sueño',
        campaña_aftosa: true,
        periodo_vacunacion_inicio: '2024-01-15',
        periodo_vacunacion_fin: '2024-03-01',
        notificaciones_email: true
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setConfig({ ...config, [e.target.name]: value });
    };

    const handleSave = () => {
        // Mock Save
        alert('Configuración guardada correctamente');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Settings className="text-slate-600" size={32} />
                    Configuración Global
                </h1>
                <p className="text-slate-500 mt-2">Parámetros generales del sistema.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 space-y-8">

                {/* Section: General */}
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Datos del Establecimiento</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Establecimiento</label>
                        <input
                            type="text"
                            name="establecimiento_nombre"
                            value={config.establecimiento_nombre}
                            onChange={handleChange}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Section: Sanidad */}
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 text-red-600 flex items-center gap-2">
                        <ShieldAlert size={20} /> Alertas Sanitarias (SENACSA)
                    </h3>

                    <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                        <div>
                            <p className="font-bold text-red-800">Campaña de Vacunación Aftosa</p>
                            <p className="text-xs text-red-600">Activar para bloquear movimientos de animales no vacunados.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="campaña_aftosa"
                                checked={config.campaña_aftosa}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Inicio Periodo</label>
                            <input
                                type="date"
                                name="periodo_vacunacion_inicio"
                                value={config.periodo_vacunacion_inicio}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fin Periodo</label>
                            <input
                                type="date"
                                name="periodo_vacunacion_fin"
                                value={config.periodo_vacunacion_fin}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                    >
                        <Save size={20} /> Guardar Cambios
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsView;
