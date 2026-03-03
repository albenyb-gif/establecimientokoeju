import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import AnimalService from '../services/animalService';
import {
    FileText, Trash2, Calendar, ShoppingCart, Info, X, Save, Pencil,
    MapPin, User, FileCheck, Hash, DollarSign, Package, StickyNote
} from 'lucide-react';

const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 })
        .format(value || 0).replace('PYG', '₲');

const formatDate = (dateStr) => {
    if (!dateStr) return 'S/F';
    return new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
            <Icon size={15} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="font-bold text-slate-800 text-sm truncate">{value || '—'}</p>
        </div>
    </div>
);

const PurchaseList = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadPurchases(); }, []);

    const loadPurchases = async () => {
        try {
            const data = await AnimalService.getPurchaseHistory();
            setPurchases(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openDetail = (purchase) => {
        setSelectedPurchase(purchase);
        setIsEditing(false);
    };

    const startEdit = (e) => {
        e.stopPropagation();
        setEditForm({
            fecha: selectedPurchase.fecha ? selectedPurchase.fecha.split('T')[0] : '',
            vendedor: selectedPurchase.vendedor || '',
            lugar_procedencia: selectedPurchase.lugar_procedencia || '',
            nro_guia: selectedPurchase.nro_guia || '',
            nro_cot: selectedPurchase.nro_cot || '',
            costo_unitario: selectedPurchase.costo_unitario || '',
            observaciones: selectedPurchase.observaciones || '',
        });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await AnimalService.updatePurchaseLote(selectedPurchase.id, editForm);
            const updated = { ...selectedPurchase, ...editForm };
            setPurchases(prev => prev.map(p => p.id === selectedPurchase.id ? updated : p));
            setSelectedPurchase(updated);
            setIsEditing(false);
        } catch (err) {
            alert('Error al guardar: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('¿Desea eliminar este registro de compra?')) return;
        try {
            await AnimalService.deletePurchaseLote(id);
            setPurchases(prev => prev.filter(p => p.id !== id));
            if (selectedPurchase?.id === id) setSelectedPurchase(null);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Modal de Detalle / Edición — renderizado en body para evitar problemas de z-index */}
            {selectedPurchase && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => { setSelectedPurchase(null); setIsEditing(false); }}>
                    <div
                        className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-50 sticky top-0 bg-white rounded-t-[2rem] z-10">
                            <div>
                                <h3 className="font-black text-slate-900 text-xl">Lote #{selectedPurchase.id}</h3>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    {selectedPurchase.cantidad_animales} Cabezas · {formatDate(selectedPurchase.fecha)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {!isEditing && (
                                    <button onClick={startEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Editar">
                                        <Pencil size={18} />
                                    </button>
                                )}
                                <button onClick={() => { setSelectedPurchase(null); setIsEditing(false); }} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {!isEditing ? (
                                /* Vista de Detalle */
                                <div className="space-y-1">
                                    <div className="bg-emerald-50 rounded-2xl p-4 mb-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Inversión Total</p>
                                            <p className="text-2xl font-black text-emerald-700 tracking-tighter">
                                                {formatCurrency(selectedPurchase.costo_total || (selectedPurchase.cantidad_animales * selectedPurchase.costo_unitario))}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo/Cab.</p>
                                            <p className="font-black text-slate-800 text-lg">{formatCurrency(selectedPurchase.costo_unitario)}</p>
                                        </div>
                                    </div>
                                    <DetailRow icon={Calendar} label="Fecha de Compra" value={formatDate(selectedPurchase.fecha)} />
                                    <DetailRow icon={User} label="Vendedor" value={selectedPurchase.vendedor} />
                                    <DetailRow icon={MapPin} label="Lugar de Procedencia" value={selectedPurchase.lugar_procedencia} />
                                    <DetailRow icon={Package} label="Cantidad de Animales" value={`${selectedPurchase.cantidad_animales} cabezas`} />
                                    <DetailRow icon={Hash} label="N° Guía de Traslado" value={selectedPurchase.nro_guia} />
                                    <DetailRow icon={FileCheck} label="N° Cotización" value={selectedPurchase.nro_cot} />
                                    <DetailRow icon={DollarSign} label="Comisión Feria" value={selectedPurchase.comision_feria > 0 ? formatCurrency(selectedPurchase.comision_feria) : null} />
                                    <DetailRow icon={DollarSign} label="Flete" value={selectedPurchase.flete > 0 ? formatCurrency(selectedPurchase.flete) : null} />
                                    <DetailRow icon={StickyNote} label="Observaciones" value={selectedPurchase.observaciones} />

                                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-50">
                                        <button
                                            onClick={startEdit}
                                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Pencil size={16} /> Editar
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(selectedPurchase.id, e)}
                                            className="py-3 px-4 bg-red-50 text-red-500 rounded-xl font-black text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Vista de Edición */
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Modificar Datos del Lote</p>
                                    {[
                                        { label: 'Fecha', key: 'fecha', type: 'date' },
                                        { label: 'Vendedor', key: 'vendedor', type: 'text' },
                                        { label: 'Lugar de Procedencia', key: 'lugar_procedencia', type: 'text' },
                                        { label: 'N° Guía', key: 'nro_guia', type: 'text' },
                                        { label: 'N° Cotización', key: 'nro_cot', type: 'text' },
                                        { label: 'Costo Unitario (₲)', key: 'costo_unitario', type: 'number' },
                                    ].map(field => (
                                        <div key={field.key} className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                                            <input
                                                type={field.type}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm"
                                                value={editForm[field.key] || ''}
                                                onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones</label>
                                        <textarea rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm resize-none"
                                            value={editForm.observaciones || ''} onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })} />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setIsEditing(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-black text-sm hover:bg-slate-50">
                                            Cancelar
                                        </button>
                                        <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-sm hover:bg-emerald-600 flex items-center justify-center gap-2 disabled:opacity-50">
                                            {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* Grid de Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchases.map((purchase) => (
                    <div
                        key={purchase.id}
                        onClick={() => openDetail(purchase)}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-emerald-100 transition-all group cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <ShoppingCart size={24} />
                            </div>
                            <button
                                onClick={(e) => handleDelete(purchase.id, e)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-black text-slate-800 text-lg">
                                    Lote #{purchase.id} · {purchase.cantidad_animales} Cab.
                                </h4>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    <Calendar size={12} />
                                    {formatDate(purchase.fecha)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Procedencia</p>
                                    <p className="font-bold text-slate-700 text-sm truncate">{purchase.lugar_procedencia || 'S/N'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vendedor</p>
                                    <p className="font-bold text-slate-700 text-sm truncate">{purchase.vendedor || 'S/N'}</p>
                                </div>
                            </div>

                            <div className="border-t border-slate-50 pt-3 flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Inversión Final</p>
                                    <p className="text-xl font-black text-emerald-600 tracking-tighter">
                                        {formatCurrency(purchase.costo_total || (purchase.cantidad_animales * purchase.costo_unitario))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Cab.</p>
                                    <p className="text-sm font-black text-slate-800">{formatCurrency(purchase.costo_unitario)}</p>
                                </div>
                            </div>

                            <p className="text-[10px] font-black text-emerald-600 text-right uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                Ver detalle →
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {purchases.length === 0 && (
                <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center">
                    <Info size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="font-black text-slate-300 uppercase tracking-widest">No hay registros de compras</p>
                </div>
            )}
        </div>
    );
};

export default PurchaseList;
