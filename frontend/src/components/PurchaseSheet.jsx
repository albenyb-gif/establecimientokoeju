import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import ClientService from '../services/clientService';
import PageHeader from './common/PageHeader';
import { Save, Calculator, AlertCircle, CheckCircle, FileText, Upload, DollarSign } from 'lucide-react';

const PurchaseSheet = () => {
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        cantidad: '',
        pelaje: '',
        kilos_compra: '',
        vendedor: '',
        lugar: '',
        documento: 'Completa',
        observaciones: '',
        categoria_id: '',
        costo_unitario: '',
        nro_cot: '',
        nro_guia: '',
        peso_total: 0,
        ganancia_estimada: 0
    });

    const [categories, setCategories] = useState([]);
    const [clients, setClients] = useState([]);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [cats, clientData] = await Promise.all([
                    AnimalService.getCategories(),
                    ClientService.getAll()
                ]);
                setCategories(cats);
                setClients(clientData);
            } catch (e) {
                console.error(e);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const qty = parseFloat(formData.cantidad) || 0;
        const kn = parseFloat(formData.kilos_compra) || 0;
        const cost = parseFloat(formData.costo_unitario) || 0;

        const totalWeight = qty * kn;
        const totalCost = qty * cost;
        const estimatedProfit = totalCost * 0.35;

        setFormData(prev => ({
            ...prev,
            peso_total: totalWeight,
            ganancia_estimada: estimatedProfit
        }));
    }, [formData.cantidad, formData.kilos_compra, formData.costo_unitario]);

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
            await AnimalService.registrarCompraLote(submitData);
            setStatus({ type: 'success', message: `Planilla Guardada. ${formData.cantidad} animales registrados.` });
            setFormData(prev => ({
                ...prev,
                cantidad: '',
                kilos_compra: '',
                costo_unitario: '',
                pelaje: '',
                observaciones: '',
                nro_cot: '',
                nro_guia: ''
            }));
            setFile(null);
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Error al guardar la planilla.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <PageHeader
                title="Planilla de Compra"
                subtitle="Registro masivo de ingresos y detalles comerciales."
                icon={Calculator}
            />

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                {status.message && (
                    <div className={`p-4 mb-6 rounded-2xl flex items-center gap-2 font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1. Datos Comerciales */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">1. Detalles del Negocio</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha de Compra</label>
                                <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Documento Comercial</label>
                                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none cursor-pointer" value={formData.documento} onChange={e => setFormData({ ...formData, documento: e.target.value })}>
                                    <option value="Completa">Factura Completa</option>
                                    <option value="Boleto">Boleto Compra/Venta</option>
                                    <option value="Sin Documento">Sin Documento</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Vendedor / Proveedor</label>
                                <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none cursor-pointer" value={formData.vendedor} onChange={e => setFormData({ ...formData, vendedor: e.target.value })}>
                                    <option value="">Seleccione Vendedor...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.nombre}>{c.nombre} (RUC: {c.ruc})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. Hacienda */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">2. Especificaciones de Hacienda</h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest ml-1 bg-emerald-50 px-2 py-0.5 rounded-md">Cantidad</label>
                                <input type="number" required min="1" placeholder="Ej. 50" className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-2xl font-black text-2xl text-center focus:border-emerald-500 outline-none text-emerald-900" value={formData.cantidad} onChange={e => setFormData({ ...formData, cantidad: e.target.value })} />
                            </div>
                            <div className="md:col-span-5 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Categoría / Clasificación</label>
                                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none cursor-pointer" value={formData.categoria_id} onChange={e => setFormData({ ...formData, categoria_id: e.target.value })}>
                                    <option value="">-- Automático (según peso) --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.descripcion}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pelaje / Descripción</label>
                                <input type="text" placeholder="Ej. MARRON OSCURO, MIXTO..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.pelaje} onChange={e => setFormData({ ...formData, pelaje: e.target.value })} />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Peso Promedio (Kg)</label>
                                <input type="number" required step="0.1" placeholder="Kg/Animal" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-700" value={formData.kilos_compra} onChange={e => setFormData({ ...formData, kilos_compra: e.target.value })} />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Costo Unit. (Gs)</label>
                                <input type="number" required step="1000" placeholder="Gs/Animal" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-emerald-700" value={formData.costo_unitario} onChange={e => setFormData({ ...formData, costo_unitario: e.target.value })} />
                            </div>
                            <div className="md:col-span-6 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Lugar de Procedencia</label>
                                <input type="text" placeholder="Ej. Santa Rosa" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.lugar} onChange={e => setFormData({ ...formData, lugar: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* 3. SENACSA */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2 flex items-center gap-2"><FileText size={16} /> 3. Documentación Oficial</h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-4 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nro. de COT</label>
                                <input type="text" placeholder="Ej. 123456" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono" value={formData.nro_cot} onChange={e => setFormData({ ...formData, nro_cot: e.target.value })} />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guía de Traslado</label>
                                <input type="text" placeholder="Ej. GT-998877" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono" value={formData.nro_guia} onChange={e => setFormData({ ...formData, nro_guia: e.target.value })} />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Foto de Marca</label>
                                <div className="relative border border-slate-200 border-dashed rounded-2xl p-4 hover:bg-slate-50 cursor-pointer transition-all bg-white flex items-center gap-3 group">
                                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => setFile(e.target.files[0])} />
                                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <Upload size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase truncate tracking-widest">
                                        {file ? file.name : "Subir marca"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 text-white">
                            <DollarSign size={120} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                            <div>
                                <p className="text-xs uppercase text-slate-400 font-bold tracking-[0.2em] mb-2">Peso Total Tropa</p>
                                <p className="text-3xl font-black text-white tracking-tight">{formData.peso_total.toLocaleString()} <span className="text-sm font-medium text-slate-500 uppercase">kg</span></p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-slate-400 font-bold tracking-[0.2em] mb-2">Inversión Total</p>
                                <p className="text-3xl font-black text-white tracking-tight"><span className="text-emerald-500 mr-1">₲</span>{(formData.cantidad * formData.costo_unitario || 0).toLocaleString()}</p>
                            </div>
                            <div className="md:col-span-2 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <p className="text-xs uppercase text-emerald-400 font-bold tracking-[0.2em] mb-2">Proyección de Ganancia</p>
                                <p className="text-4xl font-black text-emerald-400 tracking-tight"><span className="text-2xl mr-1 italic">₲</span>{formData.ganancia_estimada.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.1em]">
                            <Save size={28} />
                            {loading ? 'Procesando Planilla...' : 'Registrar Compra e Ingreso'}
                        </button>
                        <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
                            Se generarán fichas individuales y el asiento contable correspondiente.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseSheet;
