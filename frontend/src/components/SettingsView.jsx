import React, { useState } from 'react';
import { Save, Settings, ShieldAlert, Building2, Bell, ShieldCheck, Database } from 'lucide-react';
import PageHeader from './common/PageHeader';

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
        alert('Parámetros actualizados correctamente');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
            <PageHeader
                title="Configuración"
                subtitle="Ajustes globales del sistema y parámetros operativos."
                icon={Settings}
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Lateral Menu Concept */}
                <div className="md:col-span-4 space-y-2">
                    <button className="w-full text-left p-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-xl shadow-slate-900/20">
                        <Building2 size={16} /> General
                    </button>
                    <button className="w-full text-left p-4 rounded-2xl bg-white text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 border border-transparent hover:border-slate-100 transition-all">
                        <ShieldCheck size={16} /> Seguridad
                    </button>
                    <button className="w-full text-left p-4 rounded-2xl bg-white text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 border border-transparent hover:border-slate-100 transition-all">
                        <Bell size={16} /> Notificaciones
                    </button>
                    <button className="w-full text-left p-4 rounded-2xl bg-white text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 border border-transparent hover:border-slate-100 transition-all">
                        <Database size={16} /> Backup
                    </button>
                </div>

                {/* Form Area */}
                <div className="md:col-span-8 space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-10">

                        {/* Section: General */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Propiedades del Establecimiento</h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Oficial</label>
                                <input
                                    type="text"
                                    name="establecimiento_nombre"
                                    value={config.establecimiento_nombre}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-900 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                        </div>

                        {/* Section: Sanidad */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-red-400 uppercase tracking-[0.2em] border-b border-red-50 pb-4 flex items-center gap-2">
                                <ShieldAlert size={16} /> Control Sanitario (SENACSA)
                            </h3>

                            <div className="bg-red-50/50 p-6 rounded-[1.5rem] border border-red-100 flex items-center justify-between group">
                                <div className="space-y-1">
                                    <p className="font-black text-red-900 tracking-tight text-lg">Campaña de Vacunación</p>
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest opacity-80">Bloquea movimientos de animales no aptos.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="campaña_aftosa"
                                        checked={config.campaña_aftosa}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600 shadow-inner"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha Inicio Periodo</label>
                                    <input
                                        type="date"
                                        name="periodo_vacunacion_inicio"
                                        value={config.periodo_vacunacion_inicio}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha Cierre Periodo</label>
                                    <input
                                        type="date"
                                        name="periodo_vacunacion_fin"
                                        value={config.periodo_vacunacion_fin}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Action */}
                        <div className="pt-6">
                            <button
                                onClick={handleSave}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Save size={24} /> Guardar Configuración
                            </button>
                        </div>

                    </div>

                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Versión de Sistema 2.1.0-Premium</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
