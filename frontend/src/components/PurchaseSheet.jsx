import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import ClientService from '../services/clientService';
import PageHeader from './common/PageHeader';
import PurchaseList from './PurchaseList';
import { Save, Calculator, AlertCircle, CheckCircle, FileText, Upload, DollarSign, List, X, Plus, ChevronDown } from 'lucide-react';

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
    const [newVendorRuc, setNewVendorRuc] = useState('');
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoryError, setCategoryError] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadInitialData = async () => {
        setLoadingCategories(true);
        try {
            const [cats, clientData] = await Promise.all([
                AnimalService.getCategories(),
                ClientService.getAll()
            ]);
            setCategories(cats);
            setClients(clientData);
            setCategoryError(false);
        } catch (e) {
            console.error('Error al cargar datos iniciales:', e);
            setCategoryError(true);
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        loadInitialData();

        // Cargar borrador de localStorage
        const draft = localStorage.getItem('purchase_draft');
        if (draft) {
            try {
                const parsedDraft = JSON.parse(draft);
                // Restaurar animales, pero asegurar que 'marcas' sea un array vacío
                // ya que los objetos File no se pueden persistir en localStorage
                if (parsedDraft.animales) {
                    parsedDraft.animales = parsedDraft.animales.map(a => ({
                        ...a,
                        marcas: []
                    }));
                }
                setFormData(prev => ({ ...prev, ...parsedDraft }));
            } catch (err) {
                console.error('Error al cargar el borrador:', err);
            }
        }
    }, []);

    // Guardar borrador automáticamente al cambiar formData
    useEffect(() => {
        // No guardar File objects ni miniaturas temporales
        const dataToSave = { ...formData };
        if (dataToSave.animales) {
            dataToSave.animales = dataToSave.animales.map(a => {
                const { marcas, ...rest } = a;
                return rest;
            });
        }
        localStorage.setItem('purchase_draft', JSON.stringify(dataToSave));
    }, [formData]);

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
                        costo: formData.costo_unitario || '',
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

    // Calcular peso promedio y costo unitario automáticos desde la tabla
    useEffect(() => {
        if (formData.tipo_ingreso === 'detallado' && formData.animales.length > 0) {
            const weights = formData.animales.map(a => parseFloat(a.peso)).filter(p => !isNaN(p));
            const costs = formData.animales.map(a => parseFloat(a.costo)).filter(c => !isNaN(c));

            let updates = {};

            if (weights.length > 0) {
                const sumWeights = weights.reduce((acc, curr) => acc + curr, 0);
                const avgWeight = (sumWeights / weights.length).toFixed(1);
                if (parseFloat(formData.kilos_compra) !== parseFloat(avgWeight)) {
                    updates.kilos_compra = avgWeight;
                }
            }

            if (costs.length > 0) {
                const sumCosts = costs.reduce((acc, curr) => acc + curr, 0);
                const avgCost = Math.round(sumCosts / costs.length);
                if (parseInt(formData.costo_unitario) !== avgCost) {
                    updates.costo_unitario = avgCost;
                }
            }

            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({ ...prev, ...updates }));
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
                    costo: a.costo,
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
            localStorage.removeItem('purchase_draft');
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
                                        <div className="flex flex-col gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 shadow-sm animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nombre Completo / Razón Social"
                                                    className="w-full p-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                                                    value={newVendorName}
                                                    onChange={e => setNewVendorName(e.target.value)}
                                                    autoFocus
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="RUC"
                                                    className="w-32 p-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                                                    value={newVendorRuc}
                                                    onChange={e => setNewVendorRuc(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (newVendorName.trim()) {
                                                            try {
                                                                const rucFinal = newVendorRuc.trim() || 'S/N';
                                                                const newClient = await ClientService.create({
                                                                    nombre: newVendorName.toUpperCase(),
                                                                    ruc: rucFinal,
                                                                    tipo: 'PROVEEDOR'
                                                                });
                                                                const clientObj = { id: newClient.id, nombre: newVendorName.toUpperCase(), ruc: rucFinal };
                                                                setClients([...clients, clientObj]);
                                                                setFormData({ ...formData, vendedor: newVendorName.toUpperCase() });
                                                                setIsNewVendor(false);
                                                                setNewVendorName('');
                                                                setNewVendorRuc('');
                                                            } catch (e) {
                                                                console.error(e);
                                                                alert('Error al crear el contacto. Verifique si el RUC ya existe.');
                                                            }
                                                        }
                                                    }}
                                                    className="flex-1 bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                                                >
                                                    <CheckCircle size={16} /> Confirmar Guardado
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsNewVendor(false); setNewVendorName(''); setNewVendorRuc(''); }}
                                                    className="bg-white text-slate-400 p-3 rounded-xl hover:bg-slate-100 transition-all font-bold border border-slate-200"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
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
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Peso Promedio (Kg)</label>
                                    <input type="number" required step="0.1" placeholder="Kg/Animal" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-700" value={formData.kilos_compra} onChange={e => setFormData({ ...formData, kilos_compra: e.target.value })} />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Costo Unit. (Gs)</label>
                                    <input type="number" required step="1000" placeholder="Gs/Animal" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-emerald-700" value={formData.costo_unitario} onChange={e => setFormData({ ...formData, costo_unitario: e.target.value })} />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Lugar de Procedencia</label>
                                    <input type="text" placeholder="Ej. Santa Rosa" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.lugar} onChange={e => setFormData({ ...formData, lugar: e.target.value })} />
                                </div>
                                <div className="md:col-span-12 space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Categoría General</label>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            {categoryError || formData.categoria_id === 'MANUAL' ? (
                                                <input
                                                    type="text"
                                                    placeholder="Escriba la categoría (ej. VAQUILLA)"
                                                    className="w-full p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl font-bold text-emerald-700 uppercase outline-none focus:ring-2 focus:ring-emerald-500"
                                                    value={formData.categoria_id === 'MANUAL' ? '' : formData.categoria_id}
                                                    onChange={e => setFormData({ ...formData, categoria_id: e.target.value.toUpperCase() })}
                                                    autoFocus
                                                />
                                            ) : (
                                                <select
                                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer appearance-none"
                                                    value={formData.categoria_id}
                                                    onChange={e => setFormData({ ...formData, categoria_id: e.target.value })}
                                                >
                                                    <option value="">Auto-Categorizar por Peso</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
                                                    <option value="MANUAL" className="text-emerald-600 font-bold">➕ Ingreso Manual / Nueva...</option>
                                                </select>
                                            )}
                                        </div>
                                        {categoryError && (
                                            <button type="button" onClick={loadInitialData} className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-colors">
                                                {loadingCategories ? <div className="animate-spin">⌛</div> : <Calculator size={20} />}
                                            </button>
                                        )}
                                        {formData.categoria_id === 'MANUAL' && (
                                            <button type="button" onClick={() => setFormData({ ...formData, categoria_id: '' })} className="p-4 bg-slate-100 rounded-2xl text-rose-500">
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
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
                                <div className="bg-slate-50 p-4 md:p-6 rounded-[2rem] border border-slate-100 max-h-[32rem] overflow-y-auto custom-scrollbar shadow-inner">
                                    {isMobile ? (
                                        /* DISEÑO MÓVIL (CARDS) */
                                        <div className="space-y-4">
                                            {formData.animales.map((anim, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 space-y-4 relative shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Animal #{idx + 1}</span>
                                                        {formData.cantidad > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newAnims = formData.animales.filter((_, i) => i !== idx);
                                                                    setFormData({ ...formData, animales: newAnims, cantidad: newAnims.length.toString() });
                                                                }}
                                                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Caravana</label>
                                                            <input
                                                                type="text"
                                                                placeholder="ID"
                                                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                value={anim.caravana_visual}
                                                                onChange={e => {
                                                                    const newAnims = [...formData.animales];
                                                                    newAnims[idx].caravana_visual = e.target.value.toUpperCase();
                                                                    setFormData({ ...formData, animales: newAnims });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Peso (Kg)</label>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                                                value={anim.weight || anim.peso || ''}
                                                                onChange={e => {
                                                                    const newAnims = [...formData.animales];
                                                                    newAnims[idx].peso = e.target.value;
                                                                    setFormData({ ...formData, animales: newAnims });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
                                                        <div className="flex gap-2">
                                                            {categoryError || anim.categoria_id === 'MANUAL' ? (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Categoría..."
                                                                    className="flex-1 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-700 uppercase outline-none"
                                                                    value={anim.categoria_id === 'MANUAL' ? '' : anim.categoria_id}
                                                                    onChange={e => {
                                                                        const newAnims = [...formData.animales];
                                                                        newAnims[idx].categoria_id = e.target.value.toUpperCase();
                                                                        setFormData({ ...formData, animales: newAnims });
                                                                    }}
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <select
                                                                    className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                                                    value={anim.categoria_id}
                                                                    onChange={e => {
                                                                        const newAnims = [...formData.animales];
                                                                        newAnims[idx].categoria_id = e.target.value;
                                                                        setFormData({ ...formData, animales: newAnims });
                                                                    }}
                                                                >
                                                                    <option value="">Auto-Categorizar</option>
                                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
                                                                    <option value="MANUAL" className="text-emerald-600 font-bold">Manual</option>
                                                                </select>
                                                            )}
                                                            {(categoryError || anim.categoria_id === 'MANUAL') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newAnims = [...formData.animales];
                                                                        newAnims[idx].categoria_id = '';
                                                                        setFormData({ ...formData, animales: newAnims });
                                                                        if (categoryError) loadInitialData();
                                                                    }}
                                                                    className="bg-slate-100 text-slate-400 p-3 rounded-xl hover:text-rose-500"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            )}
                                                            {categoryError && !loadingCategories && (
                                                                <button
                                                                    type="button"
                                                                    onClick={loadInitialData}
                                                                    className="bg-emerald-50 text-emerald-600 p-3 rounded-xl hover:bg-emerald-100"
                                                                >
                                                                    <Calculator size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Costo (Gs)</label>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                className="w-full p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl text-sm font-bold shadow-sm text-emerald-700 font-mono outline-none"
                                                                value={anim.costo}
                                                                onChange={e => {
                                                                    const newAnims = [...formData.animales];
                                                                    newAnims[idx].costo = e.target.value;
                                                                    setFormData({ ...formData, animales: newAnims });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Pelaje</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Ej. Pampa"
                                                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                                                                value={anim.pelaje}
                                                                onChange={e => {
                                                                    const newAnims = [...formData.animales];
                                                                    newAnims[idx].pelaje = e.target.value.toUpperCase();
                                                                    setFormData({ ...formData, animales: newAnims });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-slate-50">
                                                        <div className="flex flex-wrap gap-2 items-center justify-center">
                                                            {anim.marcas?.map((file, fIdx) => (
                                                                <div key={fIdx} className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-100 shadow-sm">
                                                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newAnims = [...formData.animales];
                                                                            newAnims[idx].marcas = anim.marcas.filter((_, im) => im !== fIdx);
                                                                            setFormData({ ...formData, animales: newAnims });
                                                                        }}
                                                                        className="absolute top-0 right-0 bg-rose-500 text-white rounded-bl-lg p-1"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <div className="relative">
                                                                <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => {
                                                                    const newFiles = Array.from(e.target.files);
                                                                    const newAnims = [...formData.animales];
                                                                    newAnims[idx].marcas = [...(anim.marcas || []), ...newFiles];
                                                                    setFormData({ ...formData, animales: newAnims });
                                                                }} />
                                                                <div className="w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center bg-slate-50 text-slate-300 border-slate-200">
                                                                    <Plus size={20} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider">Toca para agregar marcas</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* DISEÑO TABLET/DESKTOP (TABLE) */
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                        <th className="pb-3 px-2">Visual</th>
                                                        <th className="pb-3 px-2">RFID</th>
                                                        <th className="pb-3 px-2">Peso</th>
                                                        <th className="pb-3 px-2">Costo (Gs)</th>
                                                        <th className="pb-3 px-2">Categoría</th>
                                                        <th className="pb-3 px-2">Pelaje</th>
                                                        <th className="pb-3 text-right pr-2">Marcas</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {formData.animales.map((anim, idx) => (
                                                        <tr key={idx} className="hover:bg-white transition-colors">
                                                            <td className="py-3 pr-2">
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                    value={anim.caravana_visual}
                                                                    onChange={e => {
                                                                        const newAnims = [...formData.animales];
                                                                        newAnims[idx].caravana_visual = e.target.value.toUpperCase();
                                                                        setFormData({ ...formData, animales: newAnims });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="py-3 pr-2">
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                    value={anim.caravana_rfid}
                                                                    onChange={e => {
                                                                        const newAnims = [...formData.animales];
                                                                        newAnims[idx].caravana_rfid = e.target.value;
                                                                        setFormData({ ...formData, animales: newAnims });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="py-3 pr-2">
                                                                <input
                                                                    type="number"
                                                                    className="w-20 p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                                                    value={anim.peso}
                                                                    onChange={e => {
                                                                        const newAnims = [...formData.animales];
                                                                        newAnims[idx].peso = e.target.value;
                                                                        setFormData({ ...formData, animales: newAnims });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="py-3 pr-2">
                                                                <input
                                                                    type="number"
                                                                    className="w-28 p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 font-mono outline-none"
                                                                    value={anim.costo}
                                                                    onChange={e => {
                                                                        const newAnims = [...formData.animales];
                                                                        newAnims[idx].costo = e.target.value;
                                                                        setFormData({ ...formData, animales: newAnims });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="py-3 pr-2 border-l border-slate-50 pl-2">
                                                                <div className="flex gap-1 items-center min-w-[120px]">
                                                                    {categoryError || anim.categoria_id === 'MANUAL' ? (
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Nueva..."
                                                                            className="w-full p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 uppercase outline-none"
                                                                            value={anim.categoria_id === 'MANUAL' ? '' : anim.categoria_id}
                                                                            onChange={e => {
                                                                                const newAnims = [...formData.animales];
                                                                                newAnims[idx].categoria_id = e.target.value.toUpperCase();
                                                                                setFormData({ ...formData, animales: newAnims });
                                                                            }}
                                                                            autoFocus
                                                                        />
                                                                    ) : (
                                                                        <select
                                                                            className="w-full p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                                                                            value={anim.categoria_id}
                                                                            onChange={e => {
                                                                                const newAnims = [...formData.animales];
                                                                                newAnims[idx].categoria_id = e.target.value;
                                                                                setFormData({ ...formData, animales: newAnims });
                                                                            }}
                                                                        >
                                                                            <option value="">Auto</option>
                                                                            {categories.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
                                                                            <option value="MANUAL" className="text-emerald-600 font-bold">Manual</option>
                                                                        </select>
                                                                    )}
                                                                    {(categoryError || anim.categoria_id === 'MANUAL') && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newAnims = [...formData.animales];
                                                                                newAnims[idx].categoria_id = '';
                                                                                setFormData({ ...formData, animales: newAnims });
                                                                                if (categoryError) loadInitialData();
                                                                            }}
                                                                            className="text-slate-300 hover:text-rose-500"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 pr-2">
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-2 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                                                    value={anim.pelaje}
                                                                    onChange={e => {
                                                                        const newAnims = [...formData.animales];
                                                                        newAnims[idx].pelaje = e.target.value.toUpperCase();
                                                                        setFormData({ ...formData, animales: newAnims });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="py-3 text-right">
                                                                <div className="flex flex-wrap gap-1 items-center justify-end">
                                                                    {anim.marcas?.map((file, fIdx) => (
                                                                        <div key={fIdx} className="relative w-8 h-8 rounded-lg overflow-hidden border border-emerald-100">
                                                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="X" />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newAnims = [...formData.animales];
                                                                                    newAnims[idx].marcas = anim.marcas.filter((_, im) => im !== fIdx);
                                                                                    setFormData({ ...formData, animales: newAnims });
                                                                                }}
                                                                                className="absolute top-0 right-0 bg-rose-500 text-white rounded-bl-lg p-0.5"
                                                                            >
                                                                                <X size={8} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    <div className="relative">
                                                                        <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => {
                                                                            const newFiles = Array.from(e.target.files);
                                                                            const newAnims = [...formData.animales];
                                                                            newAnims[idx].marcas = [...(anim.marcas || []), ...newFiles];
                                                                            setFormData({ ...formData, animales: newAnims });
                                                                        }} />
                                                                        <div className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center bg-white text-slate-300 border-slate-200">
                                                                            <Plus size={14} />
                                                                        </div>
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
