import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import ClientService from '../services/clientService';
import { Save, DollarSign, Truck, Filter, CheckSquare, Square, Search } from 'lucide-react';

const SalesSheet = () => {
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        cliente: '',
        destino: '',
        precio_promedio: '',
        descuentos: 0,
        observaciones: '',
        // Calculated
        total_bruto: 0,
        total_neto: 0,
        peso_total: 0
    });

    const [animals, setAnimals] = useState([]);
    const [clients, setClients] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Load Available Animals and Clients
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

    // Toggle Selection
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

    // Calculate Totals
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
            loadAnimals(); // Refresh list
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Error al registrar la venta.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-slate-200">
            <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3 border-b pb-4">
                <DollarSign className="text-emerald-600" size={32} />
                Planilla de Venta (Salida)
            </h2>

            {status.message && (
                <div className={`p-4 mb-6 rounded-xl font-medium ${status.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Sales Data */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm border-b pb-2">Datos de la Venta</h3>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                        <input type="date" required
                            className="w-full p-3 border border-slate-200 rounded-xl"
                            value={formData.fecha}
                            onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente / Comprador</label>
                        <select
                            required
                            className="w-full p-3 border border-slate-200 rounded-xl bg-white"
                            value={formData.cliente}
                            onChange={e => setFormData({ ...formData, cliente: e.target.value })}
                        >
                            <option value="">Seleccione un cliente...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.nombre}>{c.nombre} (RUC: {c.ruc})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destino</label>
                        <input type="text" placeholder="Planta Indust. / Feria"
                            className="w-full p-3 border border-slate-200 rounded-xl"
                            value={formData.destino}
                            onChange={e => setFormData({ ...formData, destino: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Promedio (Gs/Kg)</label>
                        <input type="number" required step="100"
                            className="w-full p-3 border border-slate-200 rounded-xl font-mono"
                            value={formData.precio_promedio}
                            onChange={e => setFormData({ ...formData, precio_promedio: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descuentos Totales (Gs)</label>
                        <input type="number" step="1000" placeholder="Fletes, Comisiones..."
                            className="w-full p-3 border border-slate-200 rounded-xl font-mono text-red-600"
                            value={formData.descuentos}
                            onChange={e => setFormData({ ...formData, descuentos: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                        <textarea rows="3"
                            className="w-full p-3 border border-slate-200 rounded-xl"
                            value={formData.observaciones}
                            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                        />
                    </div>

                    {/* Summary Card */}
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-emerald-700 uppercase">Animales</span>
                            <span className="text-lg font-black text-emerald-900">{selectedIds.length}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-emerald-700 uppercase">Peso Total</span>
                            <span className="text-lg font-black text-emerald-900">{formData.peso_total.toLocaleString()} kg</span>
                        </div>
                        <div className="border-t border-emerald-200 my-2 pt-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-emerald-700 uppercase">A Cobrar (Neto)</span>
                            <span className="text-2xl font-black text-emerald-800">₲ {formData.total_neto.toLocaleString()}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                        >
                            {loading ? 'Procesando...' : 'CONFIRMAR VENTA'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Animal Selection */}
                <div className="lg:col-span-2 flex flex-col h-[800px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">Selección de Animales ({selectedIds.length})</h3>
                        <button type="button" onClick={toggleSelectAll} className="text-sm font-bold text-emerald-600 hover:underline">
                            {selectedIds.length === animals.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-2">
                        {animals.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Filter size={48} className="mb-2 opacity-50" />
                                <p>No hay animales disponibles para venta.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 rounded-tl-lg">
                                            <div className="w-5 h-5 border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer bg-white" onClick={toggleSelectAll}>
                                                {selectedIds.length === animals.length && <div className="w-3 h-3 bg-emerald-500 rounded-sm" />}
                                            </div>
                                        </th>
                                        <th className="p-3">Caravana</th>
                                        <th className="p-3">Categoría</th>
                                        <th className="p-3">Rodeo</th>
                                        <th className="p-3 text-right rounded-tr-lg">Peso (kg)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {animals.map((animal) => (
                                        <tr
                                            key={animal.id}
                                            className={`hover:bg-emerald-50 cursor-pointer transition-colors ${selectedIds.includes(animal.id) ? 'bg-emerald-50/60' : 'bg-white'}`}
                                            onClick={() => toggleSelect(animal.id)}
                                        >
                                            <td className="p-3">
                                                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${selectedIds.includes(animal.id) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'}`}>
                                                    {selectedIds.includes(animal.id) && <CheckSquare size={14} className="text-white" />}
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono font-bold text-slate-700">{animal.caravana_visual}</td>
                                            <td className="p-3 text-slate-600">{animal.categoria}</td>
                                            <td className="p-3 text-slate-500">{animal.rodeo}</td>
                                            <td className="p-3 text-right font-mono font-medium">{animal.peso_actual}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SalesSheet;
