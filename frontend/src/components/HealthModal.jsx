import React, { useState } from 'react';
import { X, Syringe, Activity } from 'lucide-react';

const HealthModal = ({ animal, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'VACUNACION', // VACUNACION, TRATAMIENTO, CONTROL
        detalle: '',
        producto: '',
        costo: '',
        dias_carencia: 0
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={20} className="text-red-500" />
                        Registro Sanitario
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha</label>
                            <input
                                type="date"
                                name="fecha"
                                value={formData.fecha}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo Evento</label>
                            <select
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                            >
                                <option value="VACUNACION">Vacunación</option>
                                <option value="TRATAMIENTO">Tratamiento</option>
                                <option value="CONTROL">Control Veterinario</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Detalle / Diagnóstico</label>
                        <input
                            type="text"
                            name="detalle"
                            value={formData.detalle}
                            onChange={handleChange}
                            placeholder="Ej. Vacunación Aftosa 1ra Dosis"
                            required
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Producto Aplicado</label>
                            <input
                                type="text"
                                name="producto"
                                value={formData.producto}
                                onChange={handleChange}
                                placeholder="Ej. Ivermectina"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Días Carencia</label>
                            <input
                                type="number"
                                name="dias_carencia"
                                value={formData.dias_carencia}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Costo Estimado (Gs)</label>
                        <input
                            type="number"
                            name="costo"
                            value={formData.costo}
                            onChange={handleChange}
                            placeholder="0"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/30">
                            <Syringe size={18} /> Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HealthModal;
