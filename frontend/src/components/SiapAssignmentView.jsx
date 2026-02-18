import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import { Tag, Save, Filter, Search, CheckCircle, AlertCircle } from 'lucide-react';

const SiapAssignmentView = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [animals, setAnimals] = useState([]);

    // Bulk Assignment State
    const [startSeries, setStartSeries] = useState('');
    const [rfidSeries, setRfidSeries] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Mock Batches (In real app, fetch from API)
    useEffect(() => {
        // Todo: Fetch batches from backend
        setBatches([
            { id: 1, name: 'Lote Compra 15/02 - Santa Rosa (50 cab)' },
            { id: 2, name: 'Lote Compra 10/02 - El Salto (30 cab)' }
        ]);
    }, []);

    // Fetch animals when batch is selected
    useEffect(() => {
        if (!selectedBatchId) return;

        const loadBatchAnimals = async () => {
            // Todo: Implement getAnimalsByBatch in backend/service
            // Mocking for now based on previous "Virtual IDs"
            const mockAnimals = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                caravana_visual: `L${selectedBatchId}-${(i + 1).toString().padStart(3, '0')}`,
                caravana_rfid: '',
                peso_actual: 200 + (i * 5)
            }));
            setAnimals(mockAnimals);
        };
        loadBatchAnimals();
    }, [selectedBatchId]);

    const handleBulkAssign = async () => {
        if (!startSeries) return alert('Ingrese la serie inicial (ej: PY-2025-001)');

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            // Generate IDs based on series
            // Simple logic: Extract number from end, increment
            // Regex to separate prefix and number
            const match = startSeries.match(/^(.+?)(\d+)$/);
            if (!match) throw new Error('Formato de serie inválido. Use letras seguidas de números (ej: A-100)');

            const prefix = match[1];
            const startNum = parseInt(match[2]);

            // Prepare Payload
            const updates = animals.map((animal, index) => {
                const newNum = startNum + index;
                // Pad with zeros to match original length
                const numStr = newNum.toString().padStart(match[2].length, '0');
                const visualId = `${prefix}${numStr}`;

                return {
                    id: animal.id,
                    caravana_visual: visualId,
                    caravana_rfid: rfidSeries ? `${rfidSeries}-${numStr}` : '' // Mock RFID logic
                };
            });

            // Call API
            await AnimalService.batchUpdateIds(updates);

            setStatus({ type: 'success', message: `${updates.length} animales identificados correctamente.` });
            setAnimals(prev => prev.map((a, i) => ({ ...a, ...updates[i] })));

        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: error.message || 'Error al asignar caravanas' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Tag className="text-indigo-600" />
                Asignación Oficial SIAP
            </h2>

            {/* Batch Selection */}
            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Lote de Compra</label>
                <select
                    className="w-full p-3 border rounded-lg bg-white"
                    value={selectedBatchId}
                    onChange={e => setSelectedBatchId(e.target.value)}
                >
                    <option value="">-- Seleccione un Lote --</option>
                    {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {selectedBatchId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Control Panel */}
                    <div>
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Filter size={18} /> Configuración de Serie
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serie Visual (Tarjeta)</label>
                                <input
                                    type="text"
                                    placeholder="Ej. PY-2025-001"
                                    className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                    value={startSeries}
                                    onChange={e => setStartSeries(e.target.value)}
                                />
                                <p className="text-xs text-slate-400 mt-1">Se incrementará automáticamente para cada animal.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prefijo RFID (Botón) <span className="text-slate-300">(Opcional)</span></label>
                                <input
                                    type="text"
                                    placeholder="Ej. 982000..."
                                    className="w-full p-3 border border-slate-200 rounded-lg font-mono"
                                    value={rfidSeries}
                                    onChange={e => setRfidSeries(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleBulkAssign}
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={20} />
                                {loading ? 'Procesando...' : 'Aplicar Identificación'}
                            </button>

                            {status.message && (
                                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    {status.message}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Table */}
                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3">ID Actual</th>
                                    <th className="p-3">Nueva Visual (Tarjeta)</th>
                                    <th className="p-3 hidden md:table-cell">RFID (Botón)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {animals.map((animal, i) => (
                                    <tr key={animal.id} className="bg-white">
                                        <td className="p-3 text-slate-400">{animal.caravana_visual}</td>
                                        <td className="p-3 font-mono font-bold text-slate-800">
                                            {/* Preview Logic */}
                                            {startSeries ? (() => {
                                                const match = startSeries.match(/^(.+?)(\d+)$/);
                                                if (match) {
                                                    const newNum = parseInt(match[2]) + i;
                                                    return `${match[1]}${newNum.toString().padStart(match[2].length, '0')}`;
                                                }
                                                return '---';
                                            })() : '---'}
                                        </td>
                                        <td className="p-3 hidden md:table-cell text-xs text-slate-500">
                                            {rfidSeries ? `${rfidSeries}-...` : '---'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiapAssignmentView;
