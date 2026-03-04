import React, { useState, useEffect } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import AnimalService from '../services/animalService';

const EditAnimalModal = ({ animal, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        peso_actual: animal.peso_actual || '',
        rodeo_id: animal.rodeo_id || '',
        estado_sanitario: animal.estado_sanitario || 'ACTIVO',
        categoria_id: animal.categoria_id || '',
        caravana_visual: animal.caravana_visual || '',
        caravana_rfid: animal.caravana_rfid || ''
    });
    const [categories, setCategories] = useState([]);
    const [rodeos, setRodeos] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    const fallbackCategories = [
        { id: 1, descripcion: 'DESMAMANTE MACHO' },
        { id: 2, descripcion: 'DESMAMANTE HEMBRA' },
        { id: 3, descripcion: 'TERNERO MACHO' },
        { id: 4, descripcion: 'TERNERO HEMBRA' },
        { id: 5, descripcion: 'VAQUILLA' },
        { id: 6, descripcion: 'TORO' },
        { id: 21, descripcion: 'VAQUILLONA' }
    ];

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [cats, rods] = await Promise.all([
                    AnimalService.getCategories(),
                    AnimalService.getRodeos()
                ]);

                // Add hardcoded items if API returns empty
                const finalCats = cats && cats.length > 0 ? cats : fallbackCategories;
                setCategories(finalCats);
                setRodeos(rods || []);
            } catch (e) {
                console.error('Error loading initial data:', e);
                setCategories(fallbackCategories);
            } finally {
                setLoadingData(false);
            }
        };
        loadInitialData();
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
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

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Identificación */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Caravana Visual</label>
                            <input
                                type="text"
                                name="caravana_visual"
                                value={formData.caravana_visual}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">RFID (Electrónica)</label>
                            <input
                                type="text"
                                name="caravana_rfid"
                                value={formData.caravana_rfid}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                            />
                        </div>
                    </div>

                    {/* Biometría */}
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

                    {/* Clasificación */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoría</label>
                        <div className="relative">
                            <select
                                name="categoria_id"
                                value={formData.categoria_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none cursor-pointer pr-10"
                            >
                                <option value="">{loadingData ? 'Cargando Categorías...' : 'Sin Categoría'}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.descripcion}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Rodeo / Potrero</label>
                        <div className="relative">
                            <select
                                name="rodeo_id"
                                value={formData.rodeo_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none cursor-pointer pr-10"
                            >
                                <option value="">{loadingData ? 'Cargando Rodeos...' : 'Seleccionar Rodeo...'}</option>
                                {rodeos.map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado Sanitario</label>
                        <div className="relative">
                            <select
                                name="estado_sanitario"
                                value={formData.estado_sanitario}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none cursor-pointer pr-10"
                            >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="BLOQUEADO">BLOQUEADO</option>
                                <option value="CUARENTENA">CUARENTENA</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
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
