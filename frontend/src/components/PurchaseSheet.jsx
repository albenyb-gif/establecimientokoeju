import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import ClientService from '../services/clientService';
import { Save, Calculator, AlertCircle, CheckCircle, FileText, Upload } from 'lucide-react';

const PurchaseSheet = () => {
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        cantidad: '',
        pelaje: '', // MARRON OSCURO, ETC.
        kilos_compra: '', // Peso Promedio
        vendedor: '',
        lugar: '',
        documento: 'Completa', // Completa, Boleto
        observaciones: '',
        categoria_id: '', // User Selection
        costo_unitario: '', // Gs por Animal
        // Datos Oficiales (SENACSA)
        nro_cot: '',
        nro_guia: '',
        // Auto-calculated
        peso_total: 0,
        ganancia_estimada: 0
    });

    const [categories, setCategories] = useState([]);
    const [clients, setClients] = useState([]);
    const [file, setFile] = useState(null); // Para Foto Marca
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

    // Auto-calculate totals
    useEffect(() => {
        const qty = parseFloat(formData.cantidad) || 0;
        const kn = parseFloat(formData.kilos_compra) || 0;
        const cost = parseFloat(formData.costo_unitario) || 0;

        const totalWeight = qty * kn;
        const totalCost = qty * cost;
        const estimatedProfit = totalCost * 0.35; // 35% margin assumption

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

        // Build FormData for file upload support
        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            submitData.append(key, formData[key]);
        });
        if (file) {
            submitData.append('file', file);
        }

        try {
            await AnimalService.registrarCompraLote(submitData); // Backend must handle multipart/form-data
            setStatus({ type: 'success', message: `Planilla Guardada. ${formData.cantidad} animales registrados.` });
            // Reset crucial fields
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
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3 border-b pb-4">
                <Calculator className="text-emerald-600" size={32} />
                Planilla de Compra e Ingreso
            </h2>

            {status.message && (
                <div className={`p-4 mb-6 rounded-xl flex items-center gap-2 font-medium ${status.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* 1. Datos del Negocio (Financial) */}
                <div className="md:col-span-12">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Datos Comerciales</h3>
                </div>

                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Compra</label>
                    <input type="date" required
                        className="w-full p-3 border border-slate-200 rounded-xl"
                        value={formData.fecha}
                        onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Documento Comercial</label>
                    <select
                        className="w-full p-3 border border-slate-200 rounded-xl bg-white"
                        value={formData.documento}
                        onChange={e => setFormData({ ...formData, documento: e.target.value })}
                    >
                        <option value="Completa">Factura Completa</option>
                        <option value="Boleto">Boleto Compra/Venta</option>
                        <option value="Sin Documento">Sin Documento</option>
                    </select>
                </div>
                <div className="md:col-span-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendedor / Proveedor</label>
                    <select
                        required
                        className="w-full p-3 border border-slate-200 rounded-xl bg-white"
                        value={formData.vendedor}
                        onChange={e => setFormData({ ...formData, vendedor: e.target.value })}
                    >
                        <option value="">Seleccione Vendedor...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.nombre}>{c.nombre} (RUC: {c.ruc})</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase bg-emerald-50 text-emerald-700 p-1 rounded w-fit mb-1">Cantidad</label>
                    <input type="number" required min="1" placeholder="Ej. 50"
                        className="w-full p-3 border-2 border-emerald-200 rounded-xl font-bold text-xl text-center focus:border-emerald-500 outline-none text-slate-800"
                        value={formData.cantidad}
                        onChange={e => setFormData({ ...formData, cantidad: e.target.value })}
                    />
                </div>
                <div className="md:col-span-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría / Clasificación</label>
                    <select
                        className="w-full p-3 border border-slate-200 rounded-xl bg-white"
                        value={formData.categoria_id}
                        onChange={e => setFormData({ ...formData, categoria_id: e.target.value })}
                    >
                        <option value="">-- Automático (según peso) --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.descripcion}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pelaje / Descripción</label>
                    <input type="text" placeholder="Ej. MARRON OSCURO, MIXTO..."
                        className="w-full p-3 border border-slate-200 rounded-xl"
                        value={formData.pelaje}
                        onChange={e => setFormData({ ...formData, pelaje: e.target.value })}
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso Promedio (Kg)</label>
                    <input type="number" required step="0.1" placeholder="Kg/Animal"
                        className="w-full p-3 border border-slate-200 rounded-xl font-mono font-bold"
                        value={formData.kilos_compra}
                        onChange={e => setFormData({ ...formData, kilos_compra: e.target.value })}
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Unit. (Gs)</label>
                    <input type="number" required step="1000" placeholder="Gs/Animal"
                        className="w-full p-3 border border-slate-200 rounded-xl font-mono text-slate-700"
                        value={formData.costo_unitario}
                        onChange={e => setFormData({ ...formData, costo_unitario: e.target.value })}
                    />
                </div>

                {/* 2. Datos Oficiales (Legal/Físico) */}
                <div className="md:col-span-12 mt-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <FileText size={16} /> 2. Documentación SENACSA (Opcional)
                    </h3>
                </div>

                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nro. de COT</label>
                    <input type="text" placeholder="Ej. 123456"
                        className="w-full p-3 border border-slate-200 rounded-xl font-mono"
                        value={formData.nro_cot}
                        onChange={e => setFormData({ ...formData, nro_cot: e.target.value })}
                    />
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Guía de Traslado</label>
                    <input type="text" placeholder="Ej. GT-998877"
                        className="w-full p-3 border border-slate-200 rounded-xl font-mono"
                        value={formData.nro_guia}
                        onChange={e => setFormData({ ...formData, nro_guia: e.target.value })}
                    />
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Foto de Marca</label>
                    <div className="relative border border-slate-300 border-dashed rounded-xl p-2 hover:bg-slate-50 cursor-pointer transition-colors bg-white">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                <Upload size={20} />
                            </div>
                            <span className="text-xs text-slate-500 truncate font-medium">
                                {file ? file.name : "Subir foto..."}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Unit. (Gs)</label>
                    <input type="number" required step="1000" placeholder="Gs/Animal"
                        className="w-full p-3 border border-slate-200 rounded-xl font-mono text-slate-700"
                        value={formData.costo_unitario}
                        onChange={e => setFormData({ ...formData, costo_unitario: e.target.value })}
                    />
                </div>

                <div className="md:col-span-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lugar de Procedencia</label>
                    <input type="text" placeholder="Ej. Santa Rosa"
                        className="w-full p-3 border border-slate-200 rounded-xl"
                        value={formData.lugar}
                        onChange={e => setFormData({ ...formData, lugar: e.target.value })}
                    />
                </div>
                <div className="md:col-span-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                    <input type="text" placeholder="Ej. Lote parejo, buena genética"
                        className="w-full p-3 border border-slate-200 rounded-xl"
                        value={formData.observaciones}
                        onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                    />
                </div>

                {/* Calculated Results */}
                <div className="md:col-span-12 bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <p className="text-xs uppercase text-slate-400 font-bold mb-1">Peso Total Tropa</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tight">{formData.peso_total.toLocaleString()} kg</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400 font-bold mb-1">Inversión Total</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tight">₲ {(formData.cantidad * formData.costo_unitario || 0).toLocaleString()}</p>
                        </div>
                        <div className="col-span-2 md:col-span-2 bg-white rounded-xl p-4 border border-emerald-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                            <p className="text-xs uppercase text-emerald-600 font-bold mb-1">Ganancia Estimada (Proyección)</p>
                            <p className="text-3xl font-black text-emerald-600 tracking-tight">₲ {formData.ganancia_estimada.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-12 mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
                    >
                        <Save size={24} />
                        {loading ? 'Procesando Documentación...' : 'REGISTRAR INGRESO Y COMPRA'}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                        Se generarán {formData.cantidad} fichas de animales y se registrará el movimiento en SENACSA.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default PurchaseSheet;
