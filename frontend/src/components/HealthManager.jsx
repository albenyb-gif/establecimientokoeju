import React, { useState, useEffect } from 'react';
import { Syringe, Package, Plus, Calendar, CheckSquare, Search, AlertOctagon, Droplet, X, Save, Activity } from 'lucide-react';
import PageHeader from './common/PageHeader';
import HealthService from '../services/healthService';
import AnimalService from '../services/animalService';

const HealthManager = () => {
    const [view, setView] = useState('inventory'); // inventory, events
    const [inventory, setInventory] = useState([]);
    const [events, setEvents] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);

    const [newProduct, setNewProduct] = useState({
        nombre_comercial: '', principio_activo: '', descripcion: '',
        dias_carencia: 0, stock_actual: 0, unidad_medida: 'Dosis', vencimiento: ''
    });

    const [eventForm, setEventForm] = useState({
        fecha_aplicacion: new Date().toISOString().split('T')[0],
        tipo_evento: 'Vacunación',
        producto_id: '',
        animales_ids: [],
        nro_acta: '',
        responsable: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [stockData, eventData, animalsData] = await Promise.all([
                HealthService.getStock(),
                HealthService.getEvents(),
                AnimalService.getAnimals('ACTIVO')
            ]);
            setInventory(stockData);
            setEvents(eventData);
            setAnimals(animalsData);
        } catch (error) {
            console.error("Error loading health data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            await HealthService.createInsumo(newProduct);
            setShowModal(false);
            setNewProduct({ nombre_comercial: '', principio_activo: '', descripcion: '', dias_carencia: 0, stock_actual: 0, unidad_medida: 'Dosis', vencimiento: '' });
            loadData();
        } catch (error) {
            console.error(error);
            alert('Error al crear producto');
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (eventForm.animales_ids.length === 0) return alert('Seleccione al menos un animal');
        try {
            await HealthService.registerGroupEvent(eventForm);
            setShowEventModal(false);
            setEventForm({ fecha_aplicacion: new Date().toISOString().split('T')[0], tipo_evento: 'Vacunación', producto_id: '', animales_ids: [], nro_acta: '', responsable: '' });
            loadData();
        } catch (error) {
            console.error(error);
            alert('Error al registrar evento');
        }
    };

    const getStatus = (item) => {
        const today = new Date();
        const expiry = new Date(item.vencimiento);
        if (expiry < today) return 'expired';
        if (item.stock_actual < 10) return 'low';
        return 'ok';
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Sanidad e Insumos"
                subtitle="Control de stock veterinario y trazabilidad sanitaria."
                icon={Syringe}
                actions={
                    <div className="flex bg-slate-100 p-1.5 rounded-[1.25rem] gap-1 shadow-inner border border-slate-200/50">
                        <button
                            onClick={() => setView('inventory')}
                            className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'inventory' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Inventario
                        </button>
                        <button
                            onClick={() => setView('events')}
                            className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'events' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Historial
                        </button>
                    </div>
                }
            />

            {view === 'inventory' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest text-xs">
                                <Package className="text-blue-500" size={18} />
                                Stock de Productos
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
                                    <tr>
                                        <th className="p-6">Producto</th>
                                        <th className="p-6">P. Activo</th>
                                        <th className="p-6 text-center">Stock</th>
                                        <th className="p-6 text-right">Vencimiento</th>
                                        <th className="p-6 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {inventory.map((item) => {
                                        const status = getStatus(item);
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="p-6">
                                                    <p className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{item.nombre_comercial}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.descripcion}</p>
                                                </td>
                                                <td className="p-6 text-slate-500 font-medium">{item.principio_activo}</td>
                                                <td className="p-6 text-center">
                                                    <div className="inline-flex flex-col items-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <span className="font-black text-slate-800">{item.stock_actual}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unidad_medida}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right text-slate-500 font-mono font-bold">{item.vencimiento ? item.vencimiento.split('T')[0] : 'S/V'}</td>
                                                <td className="p-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                                                    ${status === 'ok' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            status === 'low' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-red-50 text-red-600 border border-red-100'}
                                                `}>
                                                        {status === 'ok' ? 'Estado Óptimo' : status === 'low' ? 'Stock Bajo' : 'Vencido'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {inventory.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="5" className="p-16 text-center">
                                                <Package size={48} className="mx-auto text-slate-200 mb-4 opacity-50" />
                                                <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-xs">Sin insumos registrados</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 text-white group-hover:scale-110 transition-transform">
                                <AlertOctagon size={120} />
                            </div>
                            <h3 className="font-black text-white mb-6 flex items-center gap-2 uppercase tracking-[0.2em] text-xs">
                                <AlertOctagon size={18} className="text-amber-500" /> Alertas Críticas
                            </h3>
                            <div className="space-y-3 relative z-10">
                                {inventory.filter(i => getStatus(i) !== 'ok').slice(0, 4).map(item => (
                                    <div key={item.id} className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className={`w-3 h-3 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.1)] ${getStatus(item) === 'expired' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                        <div className="flex-1">
                                            <p className="font-black text-white text-sm tracking-tight leading-none">{item.nombre_comercial}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${getStatus(item) === 'expired' ? 'text-red-400' : 'text-amber-400'}`}>
                                                {getStatus(item) === 'expired' ? 'Vencimiento Superado' : 'Reponer Stock'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {inventory.filter(i => getStatus(i) !== 'ok').length === 0 && (
                                    <div className="text-center py-6">
                                        <CheckSquare size={32} className="mx-auto text-emerald-500 mb-3 opacity-50" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sin alertas pendientes</p>
                                    </div>
                                )}
                            </div>
                            <button className="w-full mt-6 py-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 font-black rounded-2xl transition-all border border-white/20 uppercase tracking-widest text-xs">
                                Generar Pedido Masivo
                            </button>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                            <div className="absolute -bottom-4 -right-4 p-8 opacity-5 text-purple-600 group-hover:scale-110 transition-transform">
                                <Syringe size={120} />
                            </div>
                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] text-xs">
                                <Activity size={18} className="text-purple-500" /> Campaña Sanitaria
                            </h3>
                            <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-1 relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Próximo Periodo</p>
                                <p className="text-3xl font-black text-slate-800 tracking-tighter">15 MARZO</p>
                                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest pt-2">Fiebre Aftosa (SENACSA)</p>
                            </div>
                            <button
                                onClick={() => setShowEventModal(true)}
                                className="w-full mt-6 py-4 bg-purple-600 text-white font-black rounded-2xl shadow-xl shadow-purple-900/20 hover:bg-purple-500 transition-all uppercase tracking-widest text-xs relative z-10"
                            >
                                Iniciar Planificación
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Registro Cronológico de Eventos</h3>
                        <button
                            onClick={() => setShowEventModal(true)}
                            className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest text-xs"
                        >
                            <Plus size={18} /> Registrar Aplicación
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
                                <tr>
                                    <th className="p-6">Fecha</th>
                                    <th className="p-6">Tipo de Evento</th>
                                    <th className="p-6">Población / Animal</th>
                                    <th className="p-6">Insumo Aplicado</th>
                                    <th className="p-6 text-right">Referencia / Acta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {events.map((evt) => (
                                    <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-6 font-mono font-bold text-slate-500">{evt.fecha_aplicacion ? evt.fecha_aplicacion.split('T')[0] : 'S/F'}</td>
                                        <td className="p-6">
                                            <span className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{evt.tipo_evento}</span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                <span className="text-slate-600 font-bold">{evt.animal}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-wider border border-indigo-100">{evt.producto}</span>
                                        </td>
                                        <td className="p-6 text-right text-slate-400 font-bold uppercase text-[10px] tracking-widest">{evt.nro_acta || 'Sin Acta'}</td>
                                    </tr>
                                ))}
                                {events.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center">
                                            <Activity size={48} className="mx-auto text-slate-200 mb-4 opacity-50" />
                                            <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-xs">No hay historial sanitario</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal New Product */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nuevo Insumo</h2>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProduct} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                <input required className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" value={newProduct.nombre_comercial} onChange={e => setNewProduct({ ...newProduct, nombre_comercial: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">P. Activo</label>
                                    <input className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" value={newProduct.principio_activo} onChange={e => setNewProduct({ ...newProduct, principio_activo: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Días Carencia</label>
                                    <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-800 transition-all" value={newProduct.dias_carencia} onChange={e => setNewProduct({ ...newProduct, dias_carencia: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Inicial</label>
                                    <input type="number" step="0.01" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-black text-slate-800 transition-all" value={newProduct.stock_actual} onChange={e => setNewProduct({ ...newProduct, stock_actual: parseFloat(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad</label>
                                    <select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-black bg-white appearance-none cursor-pointer" value={newProduct.unidad_medida} onChange={e => setNewProduct({ ...newProduct, unidad_medida: e.target.value })}>
                                        <option>Dosis</option><option>Frascos</option><option>ml</option><option>Litros</option><option>Cajas</option><option>Latas</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2 pb-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vencimiento</label>
                                <input type="date" required className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-800" value={newProduct.vencimiento} onChange={e => setNewProduct({ ...newProduct, vencimiento: e.target.value })} />
                            </div>

                            <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                                <Save size={20} /> Guardar Insumo
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Group Event */}
            {showEventModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Aplicación Grupal</h2>
                            <button onClick={() => setShowEventModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipo de Evento</label>
                                    <select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold bg-white appearance-none cursor-pointer" value={eventForm.tipo_evento} onChange={e => setEventForm({ ...eventForm, tipo_evento: e.target.value })}>
                                        <option>Vacunación</option><option>Desparasitación</option><option>Tratamiento</option><option>Suplementación Vitaminica</option><option>Cura de Ombligo</option><option>Otro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Producto / Lote</label>
                                    <select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold bg-white appearance-none cursor-pointer" value={eventForm.producto_id} onChange={e => setEventForm({ ...eventForm, producto_id: e.target.value })} required>
                                        <option value="">Seleccione Producto</option>
                                        {inventory.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre_comercial} ({p.stock_actual} {p.unidad_medida})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fecha</label>
                                        <input type="date" required className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold" value={eventForm.fecha_aplicacion} onChange={e => setEventForm({ ...eventForm, fecha_aplicacion: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nro Acta</label>
                                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-mono font-bold" placeholder="000-000" value={eventForm.nro_acta} onChange={e => setEventForm({ ...eventForm, nro_acta: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Responsable Técnico</label>
                                    <input className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold" placeholder="Nombre del Veterinario" value={eventForm.responsable} onChange={e => setEventForm({ ...eventForm, responsable: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex flex-col h-full">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">Población Objetivo ({eventForm.animales_ids.length})</label>
                                <div className="flex-1 border-2 border-slate-50 rounded-[1.5rem] overflow-hidden flex flex-col min-h-[300px] bg-slate-50/50">
                                    <div className="p-3 border-b border-slate-100 flex justify-between bg-white/50 backdrop-blur-sm px-4">
                                        <button type="button" onClick={() => setEventForm({ ...eventForm, animales_ids: animals.map(a => a.id) })} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline px-2 py-1">Todos</button>
                                        <button type="button" onClick={() => setEventForm({ ...eventForm, animales_ids: [] })} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline px-2 py-1">Ninguno</button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto max-h-[350px] p-2 space-y-1 custom-scrollbar">
                                        {animals.map(animal => (
                                            <label key={animal.id} className="flex items-center gap-4 p-3 hover:bg-white rounded-2xl cursor-pointer transition-all border border-transparent hover:border-slate-100 group">
                                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${eventForm.animales_ids.includes(animal.id) ? 'bg-indigo-600 border-indigo-600 rotate-0' : 'border-slate-300 -rotate-12 group-hover:rotate-0 bg-white'}`}>
                                                    <input type="checkbox" className="hidden" checked={eventForm.animales_ids.includes(animal.id)} onChange={e => {
                                                        const ids = e.target.checked ? [...eventForm.animales_ids, animal.id] : eventForm.animales_ids.filter(id => id !== animal.id);
                                                        setEventForm({ ...eventForm, animales_ids: ids });
                                                    }} />
                                                    {eventForm.animales_ids.includes(animal.id) && <CheckSquare size={14} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-black text-slate-800 tracking-tight leading-none">{animal.caravana_visual}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{animal.categoria}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="w-full mt-8 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-900/20 hover:bg-indigo-500 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                                    <Activity size={20} /> Confirmar Aplicación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthManager;
