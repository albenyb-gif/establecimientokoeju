import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import ClientService from '../services/clientService';
import PageHeader from './common/PageHeader';
import { Save, DollarSign, Truck, Filter, CheckSquare, Search, Users } from 'lucide-react';

const SalesSheet = () => {
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        cliente: '',
        destino: '',
        precio_promedio: '',
        descuentos: 0,
        observaciones: '',
        total_bruto: 0,
        total_neto: 0,
        peso_total: 0
    });

    const [animals, setAnimals] = useState([]);
    const [clients, setClients] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [animalData, clientData] = await Promise.all([
                AnimalService.getAnimals('ACTIVO'),
                ClientService.getAll()
            ]);
            setAnimals(animalData);
            setClients(clientData);
        } catch (error) {
            console.error("Error loading data", error);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === animals.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(animals.map(a => a.id));
        }
    };

    useEffect(() => {
        const selectedAnimals = animals.filter(a => selectedIds.includes(a.id));
        const totalWeight = selectedAnimals.reduce((sum, a) => sum + parseFloat(a.peso_actual || 0), 0);

        const price = parseFloat(formData.precio_promedio) || 0;
        const discount = parseFloat(formData.descuentos) || 0;

        const gross = totalWeight * price;
        const net = gross - discount;

        setFormData(prev => ({
            ...prev,
            peso_total: totalWeight,
            total_bruto: gross,
            total_neto: net
        }));
    }, [selectedIds, formData.precio_promedio, formData.descuentos, animals]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) {
            setStatus({ type: 'error', message: 'Debe seleccionar al menos un animal.' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                animales_ids: selectedIds
            };
            await AnimalService.registrarVenta(payload);
            setStatus({ type: 'success', message: 'Venta registrada exitosamente.' });
            setFormData({
                fecha: new Date().toISOString().split('T')[0],
                cliente: '',
                destino: '',
                precio_promedio: '',
                descuentos: 0,
                observaciones: '',
                total_bruto: 0,
                total_neto: 0,
                peso_total: 0
            });
            setSelectedIds([]);
            loadData();
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Error al registrar la venta.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <PageHeader
                title="Planilla de Venta"
                subtitle="Registro de salida de animales y liquidación comercial."
                icon={DollarSign}
            />

            {status.message && (
                <div className={`p-4 mb-6 rounded-2xl font-medium flex items-center gap-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    <span className="font-bold">{status.message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Data Entry */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Información de Liquidación</h3>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha</label>
                            <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cliente / Destino</label>
                            <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none cursor-pointer" value={formData.cliente} onChange={e => setFormData({ ...formData, cliente: e.target.value })}>
                                <option value="">Seleccione Comprador...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.nombre}>{c.nombre} (RUC: {c.ruc})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Lugar de Entrega</label>
                            <input type="text" placeholder="Ej. Frigorífico Concepción" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.destino} onChange={e => setFormData({ ...formData, destino: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Precio (Gs/Kg)</label>
                                <input type="number" required step="100" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-emerald-700" value={formData.precio_promedio} onChange={e => setFormData({ ...formData, precio_promedio: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Dctos./Gastos</label>
                                <input type="number" step="1000" placeholder="₲" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-red-600" value={formData.descuentos} onChange={e => setFormData({ ...formData, descuentos: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Animales</span>
                            <span className="text-2xl font-black text-white">{selectedIds.length}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Peso Total</span>
                            <span className="text-2xl font-black text-white">{formData.peso_total.toLocaleString()} kg</span>
                        </div>
                        <div className="pt-2 px-1">
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Cierre Neto</p>
                            <p className="text-4xl font-black text-emerald-400 tracking-tight leading-none">₲ {formData.total_neto.toLocaleString()}</p>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-900/40 uppercase tracking-widest active:scale-95 disabled:opacity-50">
                            {loading ? 'Procesando...' : 'Confirmar Venta'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Animal Selection */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-end px-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seleccionar Animales Disponibles</h3>
                        <button type="button" onClick={toggleSelectAll} className="text-xs font-black text-emerald-600 uppercase tracking-tighter hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-colors">
                            {selectedIds.length === animals.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                        </button>
                    </div>

                    {isMobile ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[700px] overflow-y-auto custom-scrollbar p-1">
                            {animals.map((animal) => (
                                <div key={animal.id} onClick={() => toggleSelect(animal.id)} className={`relative bg-white p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedIds.includes(animal.id) ? 'border-emerald-500 shadow-md shadow-emerald-500/10' : 'border-slate-100 hover:border-slate-300'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${selectedIds.includes(animal.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 bg-slate-50'}`}>
                                                {selectedIds.includes(animal.id) && <CheckSquare size={14} className="text-white" />}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 tracking-tight">{animal.caravana_visual}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{animal.categoria}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-mono font-black text-emerald-700 text-lg">{animal.peso_actual}</span>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">kg</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-[10px] font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50/50 p-2 rounded-xl inline-flex border border-slate-100/50">
                                        <Filter size={12} className="text-slate-300" /> {animal.rodeo}
                                    </div>
                                </div>
                            ))}
                            {animals.length === 0 && (
                                <div className="col-span-1 sm:col-span-2 p-10 text-center text-slate-300 font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">No hay animales activos disponibles</div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-y-auto max-h-[700px] custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sticky top-0 z-10 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 w-12"></th>
                                            <th className="p-4">Caravana</th>
                                            <th className="p-4">Categoría</th>
                                            <th className="p-4">Rodeo</th>
                                            <th className="p-4 text-right">Peso Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {animals.map((animal) => (
                                            <tr key={animal.id} onClick={() => toggleSelect(animal.id)} className={`hover:bg-emerald-50/30 cursor-pointer transition-colors group ${selectedIds.includes(animal.id) ? 'bg-emerald-50/50' : ''}`}>
                                                <td className="p-4">
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(animal.id) ? 'bg-emerald-500 border-emerald-500 rotate-0' : 'border-slate-200 -rotate-12 group-hover:rotate-0'}`}>
                                                        {selectedIds.includes(animal.id) && <CheckSquare size={16} className="text-white" />}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-black text-slate-700 tracking-tight">{animal.caravana_visual}</td>
                                                <td className="p-4 text-xs font-bold text-slate-500 uppercase">{animal.categoria}</td>
                                                <td className="p-4 text-xs font-bold text-slate-400">{animal.rodeo}</td>
                                                <td className="p-4 text-right font-mono font-bold text-slate-800">{animal.peso_actual} <span className="text-[10px] text-slate-400 uppercase">kg</span></td>
                                            </tr>
                                        ))}
                                        {animals.length === 0 && (
                                            <tr><td colSpan="5" className="p-10 text-center text-slate-300 font-bold uppercase tracking-widest">No hay animales activos disponibles</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default SalesSheet;
