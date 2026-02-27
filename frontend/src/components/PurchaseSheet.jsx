import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import ClientService from '../services/clientService';
import PageHeader from './common/PageHeader';
import PurchaseList from './PurchaseList';
import { Save, Calculator, AlertCircle, CheckCircle, FileText, Upload, DollarSign, List } from 'lucide-react';

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
        comision_feria: 0,
        flete: 0,
        tasas: 0,
        peso_total: 0,
        ganancia_estimada: 0,
        porcentaje_ganancia: 35,
        tipo_ingreso: 'masivo', // 'masivo' o 'detallado'
        animales: [] // Array of { caravana_visual, caravana_rfid, peso, categoria_id, pelaje, marcas: [] }
    });
    const [tab, setTab] = useState('registrar'); // 'registrar' or 'historial'

    const [categories, setCategories] = useState([]);
    const [clients, setClients] = useState([]);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const [isNewVendor, setIsNewVendor] = useState(false);
    const [newVendorName, setNewVendorName] = useState('');
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

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
        const comision = parseFloat(formData.comision_feria) || 0;
        const flete = parseFloat(formData.flete) || 0;
        const tasas = parseFloat(formData.tasas) || 0;
        const pct = parseFloat(formData.porcentaje_ganancia) || 35;

        const totalWeight = qty * kn;
        const baseCost = qty * cost;

        // CÁLCULO PUESTO ESTANCIA (Logic from CostService)
        // Comisiones y fletes con IVA 10%
        const totalCost = baseCost + (comision * 1.10) + (flete * 1.10) + tasas;
        const estimatedProfit = totalCost * (pct / 100);

        setFormData(prev => ({
            ...prev,
            peso_total: totalWeight,
            ganancia_estimada: estimatedProfit
        }));
    }, [formData.cantidad, formData.kilos_compra, formData.costo_unitario, formData.comision_feria, formData.flete, formData.tasas, formData.porcentaje_ganancia]);

    // Update animals array when quantity changes in 'detallado' mode
    useEffect(() => {
        if (formData.tipo_ingreso === 'detallado') {
            const qty = parseInt(formData.cantidad) || 0;
            const currentAnimals = [...formData.animales];
            if (currentAnimals.length < qty) {
                for (let i = currentAnimals.length; i < qty; i++) {
                    currentAnimals.push({
                        caravana_visual: '',
                        caravana_rfid: '',
                        peso: formData.kilos_compra || '',
                        categoria_id: formData.categoria_id || '',
                        pelaje: formData.pelaje || '',
                        marcas: [] // Local preview/file info
                    });
                }
            } else if (currentAnimals.length > qty) {
                currentAnimals.splice(qty);
            }
            setFormData(prev => ({ ...prev, animales: currentAnimals }));
        }
    }, [formData.cantidad, formData.tipo_ingreso]);

    // Calcular peso promedio automático desde la tabla
    useEffect(() => {
        if (formData.tipo_ingreso === 'detallado' && formData.animales.length > 0) {
            const weights = formData.animales.map(a => parseFloat(a.peso)).filter(p => !isNaN(p));
            if (weights.length > 0) {
                const sum = weights.reduce((acc, curr) => acc + curr, 0);
                const avg = (sum / weights.length).toFixed(1);

                // Solo actualizar si es diferente para evitar loops infinitos
                if (parseFloat(formData.kilos_compra) !== parseFloat(avg)) {
                    setFormData(prev => ({ ...prev, kilos_compra: avg }));
                }
            }
        }
    }, [formData.animales, formData.tipo_ingreso]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'animales') {
                // Prepare a version of 'animales' without the file objects for JSON stringification
                const animalsClean = formData.animales.map(a => ({
                    caravana_visual: a.caravana_visual,
                    caravana_rfid: a.caravana_rfid,
                    peso: a.peso,
                    categoria_id: a.categoria_id,
                    pelaje: a.pelaje
                }));
                submitData.append(key, JSON.stringify(animalsClean));

                // Append files for each animal
                formData.animales.forEach((anim, idx) => {
                    if (anim.marcas && anim.marcas.length > 0) {
                        anim.marcas.forEach(fileObj => {
                            submitData.append(`marcas_animal_${idx}`, fileObj);
                        });
                    }
                });
            } else {
                submitData.append(key, formData[key]);
            }
        });
        if (file) {
            submitData.append('file', file); // Global document photo
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
                nro_guia: '',
                comision_feria: 0,
                flete: 0,
                tasas: 0
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
                actions={
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200/50 shadow-inner">
                        <button
                            onClick={() => setTab('registrar')}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'registrar' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            ➕ Registrar
                        </button>
                        <button
                            onClick={() => setTab('historial')}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'historial' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            📋 Historial
                        </button>
                    </div>
                }
            />

            {tab === 'registrar' ? (
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
                                    {isNewVendor ? (
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Nombre (Ej. Juan Pérez)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={newVendorName} onChange={e => setNewVendorName(e.target.value)} autoFocus />
                                            <button type="button" onClick={async () => {
                                                if (newVendorName.trim()) {
                                                    try {
                                                        const newClient = await ClientService.create({ nombre: newVendorName, tipo: 'PROVEEDOR' });
                                                        const clientObj = { id: newClient.id, nombre: newVendorName, ruc: 'S/N' };
                                                        setClients([...clients, clientObj]);
                                                        setFormData({ ...formData, vendedor: newVendorName });
                                                        setIsNewVendor(false);
                                                    } catch (e) { console.error(e); }
                                                }
                                            }} className="bg-emerald-500 text-white px-4 rounded-2xl hover:bg-emerald-600 transition-colors flex items-center justify-center shrink-0"><CheckCircle size={20} /></button>
                                            <button type="button" onClick={() => { setIsNewVendor(false); setNewVendorName(''); }} className="bg-slate-200 text-slate-700 px-4 rounded-2xl hover:bg-slate-300 transition-colors font-bold shrink-0">X</button>
                                        </div>
                                    ) : (
                                        <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none cursor-pointer" value={formData.vendedor} onChange={e => {
                                            if (e.target.value === 'NEW') {
                                                setIsNewVendor(true);
                                                setFormData({ ...formData, vendedor: '' });
                                            } else {
                                                setFormData({ ...formData, vendedor: e.target.value });
                                            }
                                        }}>
                                            <option value="">Seleccione Vendedor...</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.nombre}>{c.nombre} (RUC: {c.ruc || 'S/N'})</option>
                                            ))}
                                            <option value="NEW" className="font-bold text-emerald-600">➕ Agregar Nuevo Vendedor...</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Gastos de Adquisición */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">2. Gastos de Adquisición (Logística)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Comisión Feria (Gs)</label>
                                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.comision_feria} onChange={e => setFormData({ ...formData, comision_feria: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Flete (Gs)</label>
                                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.flete} onChange={e => setFormData({ ...formData, flete: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tasas/Otros (Gs)</label>
                                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.tasas} onChange={e => setFormData({ ...formData, tasas: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* 3. Hacienda */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">3. Especificaciones de Hacienda</h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest ml-1 bg-emerald-50 px-2 py-0.5 rounded-md">Cantidad</label>
                                    <input type="number" required min="1" placeholder="Ej. 50" className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-2xl font-black text-2xl text-center focus:border-emerald-500 outline-none text-emerald-900" value={formData.cantidad} onChange={e => setFormData({ ...formData, cantidad: e.target.value })} />
                                </div>
                                <div className="md:col-span-5 space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Categoría / Clasificación</label>
                                    {isNewCategory ? (
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Nueva Categoría (Ej. NOVILLO PESADO)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} autoFocus />
                                            <button type="button" onClick={async () => {
                                                if (newCategoryName.trim()) {
                                                    try {
                                                        const newCat = await AnimalService.createCategory(newCategoryName);
                                                        setCategories([...categories, newCat]);
                                                        setFormData({ ...formData, categoria_id: newCat.id });
                                                        setIsNewCategory(false);
                                                    } catch (e) { console.error(e); }
                                                }
                                            }} className="bg-emerald-500 text-white px-4 rounded-2xl hover:bg-emerald-600 transition-colors flex items-center justify-center shrink-0"><CheckCircle size={20} /></button>
                                            <button type="button" onClick={() => { setIsNewCategory(false); setNewCategoryName(''); }} className="bg-slate-200 text-slate-700 px-4 rounded-2xl hover:bg-slate-300 transition-colors font-bold shrink-0">X</button>
                                        </div>
                                    ) : (
                                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none cursor-pointer" value={formData.categoria_id} onChange={e => {
                                            if (e.target.value === 'NEW') {
                                                setIsNewCategory(true);
                                                setFormData({ ...formData, categoria_id: '' });
                                            } else {
                                                setFormData({ ...formData, categoria_id: e.target.value });
                                            }
                                        }}>
                                            <option value="">-- Automático (según peso) --</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.descripcion}</option>
                                            ))}
                                            <option value="NEW" className="font-bold text-emerald-600">➕ Agregar Nueva Categoría...</option>
                                        </select>
                                    )}
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

                        {/* Detalle Individual de Animales */}
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuración de Identificación</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo_ingreso: 'masivo' })}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${formData.tipo_ingreso === 'masivo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Auto-Generar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo_ingreso: 'detallado' })}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${formData.tipo_ingreso === 'detallado' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Ingreso Manual
                                    </button>
                                </div>
                            </div>

                            {formData.tipo_ingreso === 'detallado' && (
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-[10px] font-black text-slate-400 uppercase text-left pb-4 pl-2">#</th>
                                                <th className="text-[10px] font-black text-slate-400 uppercase text-left pb-4">Caravana Visual</th>
                                                <th className="text-[10px] font-black text-slate-400 uppercase text-left pb-4">RFID</th>
                                                <th className="text-[10px] font-black text-slate-400 uppercase text-left pb-4">Peso (kg)</th>
                                                <th className="text-[10px] font-black text-slate-400 uppercase text-left pb-4">Categoría</th>
                                                <th className="text-[10px] font-black text-slate-400 uppercase text-left pb-4">Pelaje</th>
                                                <th className="text-[10px] font-black text-slate-400 uppercase text-left pb-4">Marcas</th>
                                            </tr>
                                        </thead>
                                        <tbody className="space-y-4">
                                            {formData.animales.map((anim, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-2 text-xs font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                                                    <td className="py-2 pr-2">
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Caravana"
                                                            className="w-full p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                            value={anim.caravana_visual}
                                                            onChange={e => {
                                                                const newAnims = [...formData.animales];
                                                                newAnims[idx].caravana_visual = e.target.value.toUpperCase();
                                                                setFormData({ ...formData, animales: newAnims });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <input
                                                            type="text"
                                                            placeholder="RFID"
                                                            className="w-full p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                            value={anim.caravana_rfid}
                                                            onChange={e => {
                                                                const newAnims = [...formData.animales];
                                                                newAnims[idx].caravana_rfid = e.target.value;
                                                                setFormData({ ...formData, animales: newAnims });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <input
                                                            type="number"
                                                            placeholder="kg"
                                                            className="w-24 p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                            value={anim.peso}
                                                            onChange={e => {
                                                                const newAnims = [...formData.animales];
                                                                newAnims[idx].peso = e.target.value;
                                                                setFormData({ ...formData, animales: newAnims });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <select
                                                            className="w-full p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                            value={anim.categoria_id}
                                                            onChange={e => {
                                                                const newAnims = [...formData.animales];
                                                                newAnims[idx].categoria_id = e.target.value;
                                                                setFormData({ ...formData, animales: newAnims });
                                                            }}
                                                        >
                                                            <option value="">Auto</option>
                                                            {categories.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Pelaje"
                                                            className="w-full p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                            value={anim.pelaje}
                                                            onChange={e => {
                                                                const newAnims = [...formData.animales];
                                                                newAnims[idx].pelaje = e.target.value.toUpperCase();
                                                                setFormData({ ...formData, animales: newAnims });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="relative group">
                                                            <input
                                                                type="file"
                                                                multiple
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                onChange={e => {
                                                                    const files = Array.from(e.target.files);
                                                                    const newAnims = [...formData.animales];
                                                                    newAnims[idx].marcas = files;
                                                                    setFormData({ ...formData, animales: newAnims });
                                                                }}
                                                            />
                                                            <div className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition-all ${anim.marcas?.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                                                                <Upload size={14} />
                                                                <span className="text-[10px] font-black">{anim.marcas?.length || 0}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* 4. SENACSA */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2 flex items-center gap-2"><FileText size={16} /> 4. Documentación Oficial</h3>
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
                                    <p className="text-3xl font-black text-white tracking-tight">
                                        <span className="text-emerald-500 mr-1">₲</span>
                                        {(
                                            (parseFloat(formData.cantidad) * parseFloat(formData.costo_unitario) || 0) +
                                            ((parseFloat(formData.comision_feria) || 0) * 1.1) +
                                            ((parseFloat(formData.flete) || 0) * 1.1) +
                                            (parseFloat(formData.tasas) || 0)
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                <div className="md:col-span-2 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs uppercase text-emerald-400 font-bold tracking-[0.2em] mb-2">Proyección de Ganancia</p>
                                        <p className="text-4xl font-black text-emerald-400 tracking-tight"><span className="text-2xl mr-1 italic">₲</span>{formData.ganancia_estimada.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.1em] mb-1">Margen (%)</p>
                                        <input
                                            type="number"
                                            className="bg-emerald-500/20 text-emerald-400 font-black text-xl w-16 text-center rounded-lg border border-emerald-500/30 outline-none"
                                            value={formData.porcentaje_ganancia}
                                            onChange={e => setFormData({ ...formData, porcentaje_ganancia: e.target.value })}
                                        />
                                    </div>
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
                </div >
            ) : (
                <PurchaseList />
            )}
        </div >
    );
};

export default PurchaseSheet;
