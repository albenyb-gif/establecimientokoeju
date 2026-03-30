import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import PageHeader from './common/PageHeader';
import { Download, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';

const IngresoForm = () => {
    const [formData, setFormData] = useState({
        caravana_visual: '',
        caravana_rfid: '',
        nro_cot: '',
        nro_guia: '',
        fecha: new Date().toISOString().split('T')[0],
        origen_establecimiento: '',
        tipo_propiedad: 'PROPIO', // PROPIO o COMPRADO
        cantidad: 1,
        transporte: '',
        categoria_id: '',
        especie: 'BOVINO',
        peso_inicial: '',
        precio_valuacion: '',
        pelaje: '',
        raza: '',
        rodeo_id: '',
        negocio_destino: 'REPOSICIÓN',
        observaciones: ''
    });
    const [categories, setCategories] = useState([]);
    const [rodeos, setRodeos] = useState([]);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        AnimalService.getCategories().then(setCategories).catch(console.error);
        AnimalService.getRodeos().then(setRodeos).catch(console.error);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            submitData.append(key, formData[key]);
        });
        if (file) {
            submitData.append('file', file);
        }

        try {
            const result = await AnimalService.registrarIngreso(submitData);
            setStatus({ type: 'success', message: `Animal registrado correctamente con caravana: ${formData.caravana_visual || result.caravana}` });
            setFormData({
                caravana_visual: '',
                caravana_rfid: '',
                nro_cot: '',
                nro_guia: '',
                fecha: new Date().toISOString().split('T')[0],
                origen_establecimiento: '',
                tipo_propiedad: 'PROPIO',
                cantidad: 1,
                transporte: '',
                categoria_id: '',
                especie: 'BOVINO',
                peso_inicial: '',
                precio_valuacion: '',
                pelaje: '',
                raza: '',
                rodeo_id: '',
                negocio_destino: 'REPOSICIÓN',
                observaciones: ''
            });
            setFile(null);
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: error.response?.data?.error || 'Error al registrar ingreso' });
        } finally {
            setLoading(false);
        }
    };

    const SectionTitle = ({ title }) => (
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-50 pb-2">{title}</h3>
    );

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <PageHeader
                title="Registro de Hacienda"
                subtitle="Carga de fichas individuales para animales propios o comprados."
                icon={PlusCircle}
            />

            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                {status.message && (
                    <div className={`p-4 mb-8 rounded-2xl flex items-center gap-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span className="font-bold underline decoration-2">{status.message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* ORIGEN DE PROPIEDAD */}
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo_propiedad: 'PROPIO' })}
                            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${formData.tipo_propiedad === 'PROPIO' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200' : 'bg-white text-slate-400 border border-slate-100'}`}
                        >
                            Animal Propio (Nacimiento/Inv.)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo_propiedad: 'COMPRADO' })}
                            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${formData.tipo_propiedad === 'COMPRADO' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-100'}`}
                        >
                            Animal Comprado
                        </button>
                    </div>

                    {/* IDENTIFICACIÓN */}
                    <div>
                        <SectionTitle title="1. Identificación del Animal" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Caravana Visual <span className="text-rose-500">*</span></label>
                                <input
                                    type="text" name="caravana_visual" required
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black text-xl placeholder:text-slate-300"
                                    value={formData.caravana_visual} onChange={handleChange} placeholder="Ej. 1024"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Caravana RFID / Electrónica</label>
                                <input
                                    type="text" name="caravana_rfid"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-bold text-slate-600"
                                    value={formData.caravana_rfid} onChange={handleChange} placeholder="Ej. 9820000..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* CARACTERÍSTICAS */}
                    <div>
                        <SectionTitle title="2. Datos de Clasificación" />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Especie</label>
                                <select name="especie" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm bg-white" value={formData.especie} onChange={handleChange}>
                                    <option value="BOVINO">BOVINO</option>
                                    <option value="OVINO">OVINO</option>
                                    <option value="EQUINO">EQUINO</option>
                                    <option value="CAPRINO">CAPRINO</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Categoría</label>
                                <select name="categoria_id" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm bg-white" value={formData.categoria_id} onChange={handleChange}>
                                    <option value="">-- Seleccionar --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Pelaje</label>
                                <input type="text" name="pelaje" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm uppercase" value={formData.pelaje} onChange={handleChange} placeholder="Ej. NEGRO" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Raza</label>
                                <input type="text" name="raza" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm uppercase" value={formData.raza} onChange={handleChange} placeholder="Ej. ANGUS" />
                            </div>
                        </div>
                    </div>

                    {/* UBICACIÓN Y NEGOCIO */}
                    <div>
                        <SectionTitle title="3. Ubicación y Destino" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Rodeo Actual</label>
                                <select name="rodeo_id" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm bg-white" value={formData.rodeo_id} onChange={handleChange}>
                                    <option value="">-- Sin Rodeo --</option>
                                    {rodeos.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Negocio</label>
                                <select name="negocio_destino" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm bg-white" value={formData.negocio_destino} onChange={handleChange}>
                                    <option value="REPOSICIÓN">REPOSICIÓN</option>
                                    <option value="ENGORDE">ENGORDE</option>
                                    <option value="CRÍA">CRÍA</option>
                                    <option value="CABAÑA">CABAÑA</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Fecha de Ingreso</label>
                                <input type="date" name="fecha" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={formData.fecha} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* BIOMETRÍA Y COSTO */}
                    <div>
                        <SectionTitle title="4. Pesos y Valuación" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Peso Inicial (Kg)</label>
                                <input type="number" name="peso_inicial" step="0.1" className="w-full p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl outline-none font-black text-emerald-700 text-lg" value={formData.peso_inicial} onChange={handleChange} placeholder="0.0" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">{formData.tipo_propiedad === 'PROPIO' ? 'Precio de Valuación (₲)' : 'Precio de Compra (₲)'}</label>
                                <input type="number" name="precio_valuacion" className="w-full p-4 bg-amber-50/20 border border-amber-100 rounded-2xl outline-none font-black text-amber-700 text-lg font-mono" value={formData.precio_valuacion} onChange={handleChange} placeholder="0" />
                            </div>
                        </div>
                    </div>

                    {/* DOCUMENTACIÓN (SENACSA) */}
                    <div>
                        <SectionTitle title="5. Documentación y Documento Resp." />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Nro. COT</label>
                                <input type="text" name="nro_cot" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={formData.nro_cot} onChange={handleChange} placeholder="Opcional" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Nro. Guía / Acta</label>
                                <input type="text" name="nro_guia" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={formData.nro_guia} onChange={handleChange} placeholder="Opcional" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Origen / Vendedor</label>
                                <input type="text" name="origen_establecimiento" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={formData.origen_establecimiento} onChange={handleChange} placeholder="Estancia o Persona" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <SectionTitle title="6. Detalles Adicionales" />
                        <textarea
                            name="observaciones" rows="3"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-emerald-500 transition-all font-medium text-sm resize-none"
                            placeholder="Añada notas sobre el estado o procedencia del animal..."
                            value={formData.observaciones} onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-50 text-xl uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                        {loading ? 'Sincronizando Ficha...' : <><Save size={24} /> Guardar Ficha Final</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default IngresoForm;
