import React, { useState, useEffect } from 'react';
import { Syringe, Package, Plus, Calendar, CheckSquare, Search, AlertOctagon, Droplet, X, Save } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
        if (item.stock_actual < 10) return 'low'; // threshold
        return 'ok';
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <span className="text-3xl">💉</span>
                        Sanidad e Insumos
                    </h1>
                    <p className="text-slate-500 mt-1">Control de stock veterinario y calendario de vacunación.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('inventory')}
                        className={`px-4 py-2 rounded-xl font-bold transition-colors ${view === 'inventory' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Inventario
                    </button>
                    <button
                        onClick={() => setView('events')}
                        className={`px-4 py-2 rounded-xl font-bold transition-colors ${view === 'events' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {/* Content Switcher */}
            {view === 'inventory' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Inventory List */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Package className="text-blue-500" size={20} />
                                Stock Disponible
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4">Principio Activo</th>
                                    <th className="p-4 text-center">Stock</th>
                                    <th className="p-4 text-right">Vencimiento</th>
                                    <th className="p-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {inventory.map((item) => {
                                    const status = getStatus(item);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-bold text-slate-700">{item.nombre_comercial}</td>
                                            <td className="p-4 text-slate-500">{item.principio_activo}</td>
                                            <td className="p-4 text-center font-mono font-medium bg-slate-50/50 rounded-lg">
                                                {item.stock_actual} <span className="text-xs text-slate-400">{item.unidad_medida}</span>
                                            </td>
                                            <td className="p-4 text-right text-slate-500">{item.vencimiento ? item.vencimiento.split('T')[0] : '-'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                                ${status === 'ok' ? 'bg-emerald-100 text-emerald-700' :
                                                        status === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                                            `}>
                                                    {status === 'ok' ? 'OK' : status === 'low' ? 'Bajo' : 'Vencido'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {inventory.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400">No hay insumos registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Alerts / Quick Actions */}
                    <div className="space-y-6">
                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                            <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                                <AlertOctagon size={20} /> Alertas de Stock
                            </h3>
                            <ul className="space-y-3">
                                {inventory.filter(i => getStatus(i) !== 'ok').slice(0, 3).map(item => (
                                    <li key={item.id} className="flex items-center gap-3 text-sm text-amber-700 bg-white p-3 rounded-xl shadow-sm">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${getStatus(item) === 'expired' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                        <span className="flex-1 font-bold">{item.nombre_comercial}</span>
                                        <span className={`text-xs font-bold uppercase ${getStatus(item) === 'expired' ? 'text-red-500' : 'text-amber-500'}`}>
                                            {getStatus(item) === 'expired' ? 'Vencido' : 'Bajo'}
                                        </span>
                                    </li>
                                ))}
                                {inventory.filter(i => getStatus(i) !== 'ok').length === 0 && (
                                    <li className="text-sm text-amber-800 italic">Todo el stock está en orden.</li>
                                )}
                            </ul>
                            <button className="w-full mt-4 py-3 bg-white text-amber-700 font-bold rounded-xl shadow-sm hover:translate-y-px transition-transform border border-amber-100">
                                Realizar Pedido
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Syringe size={20} className="text-purple-500" />
                                Próxima Campaña
                            </h3>
                            <div className="text-center py-4 bg-slate-50 rounded-2xl mb-4">
                                <p className="text-xs font-bold text-slate-400 uppercase">Periodo Oficial</p>
                                <p className="text-2xl font-black text-slate-800">15 MAR</p>
                                <p className="text-sm font-medium text-purple-600 mt-1">Fiebre Aftosa (1er Periodo)</p>
                            </div>
                            <button
                                onClick={() => setShowEventModal(true)}
                                className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition-colors"
                            >
                                Planificar Vacunación
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Registro de Eventos Sanitarios</h3>
                        <button
                            onClick={() => setShowEventModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
                        >
                            <Plus size={18} /> Nuevo Evento
                        </button>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Evento</th>
                                <th className="p-4">Animal / Lote</th>
                                <th className="p-4">Producto Utilizado</th>
                                <th className="p-4">Acta / Obs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {events.map((evt) => (
                                <tr key={evt.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-500">{evt.fecha_aplicacion ? evt.fecha_aplicacion.split('T')[0] : '-'}</td>
                                    <td className="p-4 font-bold text-slate-700">{evt.tipo_evento}</td>
                                    <td className="p-4 text-slate-600">{evt.animal}</td>
                                    <td className="p-4 text-indigo-600 font-medium">{evt.producto}</td>
                                    <td className="p-4 text-slate-500">{evt.nro_acta || '-'}</td>
                                </tr>
                            ))}
                            {events.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">No hay registros recientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal New Product */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Nuevo Producto Veterinario</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Comercial</label>
                                <input
                                    required
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                    value={newProduct.nombre_comercial}
                                    onChange={e => setNewProduct({ ...newProduct, nombre_comercial: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Principio Activo</label>
                                    <input
                                        className="w-full p-3 border border-slate-200 rounded-xl"
                                        value={newProduct.principio_activo}
                                        onChange={e => setNewProduct({ ...newProduct, principio_activo: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Días Carencia</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border border-slate-200 rounded-xl"
                                        value={newProduct.dias_carencia}
                                        onChange={e => setNewProduct({ ...newProduct, dias_carencia: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Inicial</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full p-3 border border-slate-200 rounded-xl font-bold"
                                        value={newProduct.stock_actual}
                                        onChange={e => setNewProduct({ ...newProduct, stock_actual: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidad</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white"
                                        value={newProduct.unidad_medida}
                                        onChange={e => setNewProduct({ ...newProduct, unidad_medida: e.target.value })}
                                    >
                                        <option>Dosis</option>
                                        <option>Frascos</option>
                                        <option>ml</option>
                                        <option>Litros</option>
                                        <option>Cajas</option>
                                        <option>Latas</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimiento</label>
                                <input
                                    type="date" required
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                    value={newProduct.vencimiento}
                                    onChange={e => setNewProduct({ ...newProduct, vencimiento: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={20} /> Guardar Producto
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Group Event */}
            {showEventModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Registrar Evento Sanitario Grupal</h2>
                            <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Evento</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-xl"
                                        value={eventForm.tipo_evento}
                                        onChange={e => setEventForm({ ...eventForm, tipo_evento: e.target.value })}
                                    >
                                        <option>Vacunación</option>
                                        <option>Desparasitación</option>
                                        <option>Tratamiento</option>
                                        <option>Suplementación Vitaminica</option>
                                        <option>Cura de Ombligo</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Producto Utilizado</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-xl"
                                        value={eventForm.producto_id}
                                        onChange={e => setEventForm({ ...eventForm, producto_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccione Producto</option>
                                        {inventory.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre_comercial} ({p.stock_actual} {p.unidad_medida})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                                        <input
                                            type="date" required
                                            className="w-full p-3 border border-slate-200 rounded-xl"
                                            value={eventForm.fecha_aplicacion}
                                            onChange={e => setEventForm({ ...eventForm, fecha_aplicacion: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nro Acta / Referencia</label>
                                        <input
                                            className="w-full p-3 border border-slate-200 rounded-xl"
                                            placeholder="Nro de acta SENACSA"
                                            value={eventForm.nro_acta}
                                            onChange={e => setEventForm({ ...eventForm, nro_acta: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsable</label>
                                    <input
                                        className="w-full p-3 border border-slate-200 rounded-xl"
                                        placeholder="Ej: Veterinario Juan Pérez"
                                        value={eventForm.responsable}
                                        onChange={e => setEventForm({ ...eventForm, responsable: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seleccionar Animales ({eventForm.animales_ids.length})</label>
                                <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[200px]">
                                    <div className="p-2 bg-slate-50 border-b border-slate-200 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setEventForm({ ...eventForm, animales_ids: animals.map(a => a.id) })}
                                            className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                                        >
                                            Todos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEventForm({ ...eventForm, animales_ids: [] })}
                                            className="text-[10px] font-bold text-red-600 uppercase hover:underline"
                                        >
                                            Ninguno
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto max-h-[250px] p-2 space-y-1">
                                        {animals.map(animal => (
                                            <label key={animal.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={eventForm.animales_ids.includes(animal.id)}
                                                    onChange={e => {
                                                        const ids = e.target.checked
                                                            ? [...eventForm.animales_ids, animal.id]
                                                            : eventForm.animales_ids.filter(id => id !== animal.id);
                                                        setEventForm({ ...eventForm, animales_ids: ids });
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-700">{animal.caravana_visual}</p>
                                                    <p className="text-[10px] text-slate-500">{animal.categoria} - {animal.especie}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={20} /> Registrar Aplicación
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
