import React, { useState, useEffect } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import AnimalService from '../services/animalService';

const EditAnimalModal = ({ animal, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        caravana_visual: animal.caravana_visual || '',
        caravana_rfid: animal.caravana_rfid || '',
        peso_actual: animal.peso_actual || '',
        peso_inicial: animal.peso_inicial || '',
        precio_compra: animal.precio_compra || '',
        categoria_id: animal.categoria_id || '',
        rodeo_id: animal.rodeo_id || '',
        pelaje: animal.pelaje || '',
        raza: animal.raza || '',
        especie: animal.especie || 'BOVINO',
        negocio_destino: animal.negocio || 'ENGORDE',
        estado_sanitario: animal.estado_sanitario || 'ACTIVO',
        estado_general: animal.estado_general || 'ACTIVO',
        comparador: animal.comparador || '',
        fecha_ingreso: animal.fecha_ingreso ? new Date(animal.fecha_ingreso).toISOString().split('T')[0] : '',
        origen: animal.origen || '',
        vendedor: animal.vendedor || ''
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
                setCategories(cats && cats.length > 0 ? cats : fallbackCategories);
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
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const SectionTitle = ({ title }) => (
        <div className="flex items-center gap-3 py-2 border-b border-slate-100 mb-4 mt-6 first:mt-0">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{title}</span>
            <div className="h-px bg-slate-100 flex-1"></div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg tracking-tight">Editar Ficha de Animal</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modificar datos registrados</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    <SectionTitle title="1. Identificación" />
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Caravana Visual</label>
                            <input
                                type="text" name="caravana_visual"
                                value={formData.caravana_visual} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Caravana RFID</label>
                            <input
                                type="text" name="caravana_rfid"
                                value={formData.caravana_rfid} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm transition-all"
                                placeholder="Ej: 858 0000 1234"
                            />
                        </div>
                    </div>

                    <SectionTitle title="2. Origen y Compra" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Fecha de Ingreso</label>
                            <input
                                type="date" name="fecha_ingreso"
                                value={formData.fecha_ingreso} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Origen / Lugar</label>
                            <input
                                type="text" name="origen"
                                value={formData.origen} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Vendedor</label>
                            <input
                                type="text" name="vendedor"
                                value={formData.vendedor} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Peso Compra (Kg)</label>
                            <input
                                type="number" name="peso_inicial"
                                value={formData.peso_inicial} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-black text-indigo-600"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">P. Total Compra (₲)</label>
                            <input
                                type="number" name="precio_compra"
                                value={formData.precio_compra} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-black text-emerald-600"
                            />
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Propietario</label>
                            <input
                                type="text" name="comparador"
                                value={formData.comparador} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold"
                                placeholder="M / MF / Otros"
                            />
                        </div>
                    </div>

                    <SectionTitle title="3. Clasificación e Información" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Especie</label>
                            <select
                                name="especie" value={formData.especie} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold bg-white"
                            >
                                <option value="BOVINO">BOVINO</option>
                                <option value="OVINO">OVINO</option>
                                <option value="EQUINO">EQUINO</option>
                                <option value="CAPRINO">CAPRINO</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Categoría</label>
                            <select
                                name="categoria_id" value={formData.categoria_id} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold bg-white"
                            >
                                <option value="">{loadingData ? 'Cargando...' : 'Sin Categoría'}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.descripcion}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Pelaje</label>
                            <input
                                type="text" name="pelaje"
                                value={formData.pelaje} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Raza</label>
                            <input
                                type="text" name="raza"
                                value={formData.raza} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold"
                            />
                        </div>
                    </div>

                    <SectionTitle title="4. Estado Actual y Ubicación" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Rodeo Actual</label>
                            <select
                                name="rodeo_id" value={formData.rodeo_id} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold bg-white"
                            >
                                <option value="">{loadingData ? 'Cargando...' : 'Sin Rodeo'}</option>
                                {rodeos.map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Negocio</label>
                            <select
                                name="negocio_destino" value={formData.negocio_destino} onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold bg-white"
                            >
                                <option value="ENGORDE">ENGORDE</option>
                                <option value="CRIA">CRIA</option>
                                <option value="CABAÑA">CABAÑA</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 text-center">
                             <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Existencia</label>
                             <select
                                name="estado_general" value={formData.estado_general} onChange={handleChange}
                                className="w-full px-3 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none text-[10px] font-black bg-white"
                            >
                                <option value="ACTIVO">ACTIVO (Stock)</option>
                                <option value="VENDIDO">VENDIDO</option>
                                <option value="MUERTO">MUERTO</option>
                                <option value="CONSUMO">CONSUMO</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 text-center">
                             <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Sanidad</label>
                             <select
                                name="estado_sanitario" value={formData.estado_sanitario} onChange={handleChange}
                                className="w-full px-3 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none text-[10px] font-black bg-white"
                            >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="BLOQUEADO">BLOQUEADO</option>
                                <option value="CUARENTENA">CUARENTENA</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4 sticky bottom-0 bg-white shadow-[0_-20px_20px_-10px_rgba(255,255,255,0.9)] mt-10">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3">
                            <Save size={18} /> Guardar Ficha Completa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default EditAnimalModal;
