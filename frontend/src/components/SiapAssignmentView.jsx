import React, { useState, useEffect } from 'react';
import { Tag, Save, Filter, Search, CheckCircle, AlertCircle, Bookmark, Layers, Cpu, CreditCard } from 'lucide-react';
import PageHeader from './common/PageHeader';
import AnimalService from '../services/animalService';

const SiapAssignmentView = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [animals, setAnimals] = useState([]);

    const [rfidSeries, setRfidSeries] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setBatches([
            { id: 1, name: 'Lote Compra 15/02 - Santa Rosa (50 cab)' },
            { id: 2, name: 'Lote Compra 10/02 - El Salto (30 cab)' }
        ]);
    }, []);

    useEffect(() => {
        if (!selectedBatchId) return;

        const loadBatchAnimals = async () => {
            const mockAnimals = Array.from({ length: 15 }, (_, i) => ({
                id: i + 1,
                caravana_visual: `T-0${selectedBatchId}-${(i + 1).toString().padStart(3, '0')}`,
                caravana_rfid: '',
                peso_actual: 200 + (i * 5)
            }));
            setAnimals(mockAnimals);
        };
        loadBatchAnimals();
    }, [selectedBatchId]);

    const handleBulkAssign = async () => {
        if (!startSeries) return alert('Ingrese la serie inicial para la secuencia.');

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const match = startSeries.match(/^(.+?)(\d+)$/);
            if (!match) throw new Error('Formato inválido. Use letras seguidas de números (Ej: PY-100)');

            const prefix = match[1];
            const startNum = parseInt(match[2]);

            const updates = animals.map((animal, index) => {
                const newNum = startNum + index;
                const numStr = newNum.toString().padStart(match[2].length, '0');
                const visualId = `${prefix}${numStr}`;

                return {
                    id: animal.id,
                    caravana_visual: visualId,
                    caravana_rfid: rfidSeries ? `${rfidSeries}-${numStr}` : ''
                };
            });

            await AnimalService.batchUpdateIds(updates);

            setStatus({ type: 'success', message: `${updates.length} identidades actualizadas exitosamente.` });
            setAnimals(prev => prev.map((a, i) => ({ ...a, ...updates[i] })));

        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: error.message || 'Error técnico al intentar asignar' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Sistematización SIAP"
                subtitle="Identificación oficial y asignación masiva de caravanas reglamentarias (SENACSA)."
                icon={Bookmark}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Configuration */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Layers size={14} /> Selección de Origen
                            </h3>
                            <div className="pt-2">
                                <select
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-900 focus:bg-white outline-none font-bold text-slate-800 transition-all cursor-pointer appearance-none"
                                    value={selectedBatchId}
                                    onChange={e => setSelectedBatchId(e.target.value)}
                                >
                                    <option value="">-- Seleccionar Lote de Ingreso --</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedBatchId && (
                            <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-indigo-50 pb-4 flex items-center gap-2">
                                        <Cpu size={14} /> Parámetros de Secuencia
                                    </h3>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <CreditCard size={12} className="text-slate-400" /> Serie Caravana (Tarjeta)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej. PY-2025-001"
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-mono font-black text-indigo-700 transition-all uppercase"
                                            value={startSeries}
                                            onChange={e => setStartSeries(e.target.value)}
                                        />
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">El sistema autoincrementará el sufijo numérico.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Activity size={12} className="text-slate-400" /> Prefijo RFID (Botón o Dispositivo)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Opcional: Ej. 982000..."
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-mono font-bold text-slate-600 transition-all"
                                            value={rfidSeries}
                                            onChange={e => setRfidSeries(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={handleBulkAssign}
                                        disabled={loading || !startSeries}
                                        className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50"
                                    >
                                        <Save size={20} />
                                        {loading ? 'Sistematizando...' : 'Confirmar Identificación'}
                                    </button>

                                    {status.message && (
                                        <div className={`p-4 rounded-2xl flex items-center gap-3 border font-black text-[10px] uppercase tracking-widest ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                            {status.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Preview Table */}
                <div className="lg:col-span-12 xl:col-span-7">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Previsualización Dinámica de Lote</h3>
                            {animals.length > 0 && <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest tracking-tight">{animals.length} INDIVIDUOS</span>}
                        </div>

                        {isMobile ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                                {animals.length === 0 ? (
                                    <div className="col-span-full p-10 text-center text-slate-300 font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">Esperando selección de lote origen</div>
                                ) : (
                                    animals.map((animal, i) => (
                                        <div key={animal.id} className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col gap-3">
                                            <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-xl">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identidad Actual</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                    <span className="font-bold text-slate-600">{animal.caravana_visual}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Proyección SIAP</span>
                                                <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-indigo-700 font-mono font-black text-lg shadow-sm">
                                                    {startSeries ? (() => {
                                                        const match = startSeries.match(/^(.+?)(\d+)$/);
                                                        if (match) {
                                                            const newNum = parseInt(match[2]) + i;
                                                            return `${match[1]}${newNum.toString().padStart(match[2].length, '0')}`;
                                                        }
                                                        return '---';
                                                    })() : '---'}
                                                </div>
                                            </div>
                                            {rfidSeries && (
                                                <div className="flex justify-between items-center border-t border-slate-50 pt-2 mt-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">RFID</span>
                                                    <span className="text-[10px] font-black text-slate-500 font-mono">
                                                        {`${rfidSeries}-${(i + 1).toString().padStart(3, '0')}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 overflow-x-auto min-h-[500px]">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
                                        <tr>
                                            <th className="p-8">Identidad Actual</th>
                                            <th className="p-8">Proyección SIAP (Tarjeta)</th>
                                            <th className="p-8 hidden md:table-cell">Proyección RFID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {animals.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="p-32 text-center">
                                                    <Layers size={48} className="mx-auto text-slate-100 mb-4 opacity-50" />
                                                    <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">Esperando selección de lote origen</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            animals.map((animal, i) => (
                                                <tr key={animal.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-slate-900 transition-colors"></div>
                                                            <span className="font-bold text-slate-400">{animal.caravana_visual}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="bg-indigo-50 border border-indigo-100 inline-block px-4 py-2 rounded-xl text-indigo-700 font-mono font-black text-lg shadow-sm group-hover:bg-white group-hover:shadow-indigo-900/5 transition-all">
                                                            {startSeries ? (() => {
                                                                const match = startSeries.match(/^(.+?)(\d+)$/);
                                                                if (match) {
                                                                    const newNum = parseInt(match[2]) + i;
                                                                    return `${match[1]}${newNum.toString().padStart(match[2].length, '0')}`;
                                                                }
                                                                return '---';
                                                            })() : '---'}
                                                        </div>
                                                    </td>
                                                    <td className="p-8 hidden md:table-cell">
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                                                            {rfidSeries ? `${rfidSeries}-${(i + 1).toString().padStart(3, '0')}` : '--- DISPOSITIVO ---'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiapAssignmentView;
