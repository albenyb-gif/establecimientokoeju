import React, { useState, useEffect } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import AnimalService from '../services/animalService';

const EditAnimalModal = ({ animal, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        peso_actual: animal.peso_actual,
        rodeo: animal.rodeo,
        estado_sanitario: animal.estado_sanitario,
        categoria_id: animal.categoria_id
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await AnimalService.getCategories();
                setCategories(data);
            } catch (e) {
                console.error(e);
            }
        };
        loadCategories();
    }, []);

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
                    <h3 className="font-bold text-slate-800">Editar Animal {animal.caravana_visual}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Peso Actual (Kg)</label>
                        <input
                            type="number"
                            name="peso_actual"
                            value={formData.peso_actual}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoría</label>
                        <div className="relative">
                            <select
                                name="categoria_id"
                                value={formData.categoria_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none cursor-pointer pr-10"
                            >
                                <option value="">Sin Categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.descripcion}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Rodeo / Potrero</label>
                        <select
                            name="rodeo"
                            value={formData.rodeo}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="Potrero Norte">Potrero Norte</option>
                            <option value="Bajo Río">Bajo Río</option>
                            <option value="Monte Alto">Monte Alto</option>
                            <option value="Corral de Enfermería">Corral de Enfermería</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado Sanitario</label>
                        <select
                            name="estado_sanitario"
                            value={formData.estado_sanitario}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="ACTIVO">ACTIVO</option>
                            <option value="BLOQUEADO">BLOQUEADO</option>
                            <option value="CUARENTENA">CUARENTENA</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
                            <Save size={18} /> Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAnimalModal;
