import React, { useEffect, useState } from 'react';
import AnimalService from '../services/animalService';
import { FileText, Trash2, Calendar, Users, ShoppingCart, Info, TrendingUp, DollarSign, Pencil, X, Save } from 'lucide-react';

const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value || 0).replace('PYG', '₲');

const PurchaseList = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPurchase, setEditingPurchase] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPurchases();
    }, []);

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

    const handleDelete = async (id) => {
        if (!confirm('¿Desea eliminar este registro de compra? Los animales ya creados no serán eliminados.')) return;
        try {
            await AnimalService.deletePurchaseLote(id);
            loadPurchases();
        } catch (error) {
            console.error(error);
        }
    };

    const openEdit = (purchase) => {
        setEditingPurchase(purchase.id);
        setEditForm({
            fecha: purchase.fecha ? purchase.fecha.split('T')[0] : '',
            vendedor: purchase.vendedor || '',
            lugar_procedencia: purchase.lugar_procedencia || '',
            nro_guia: purchase.nro_guia || '',
            costo_unitario: purchase.costo_unitario || '',
            observaciones: purchase.observaciones || '',
        });
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await AnimalService.updatePurchaseLote(editingPurchase, editForm);
            setPurchases(prev => prev.map(p =>
                p.id === editingPurchase ? { ...p, ...editForm } : p
            ));
            setEditingPurchase(null);
        } catch (err) {
            alert('Error al guardar: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Modal de Edición */}
            {editingPurchase && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-800 text-lg">Editar Lote #{editingPurchase}</h3>
                            <button onClick={() => setEditingPurchase(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                                <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold" value={editForm.fecha} onChange={e => setEditForm({ ...editForm, fecha: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedor</label>
                                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold" value={editForm.vendedor} onChange={e => setEditForm({ ...editForm, vendedor: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lugar de Procedencia</label>
                                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold" value={editForm.lugar_procedencia} onChange={e => setEditForm({ ...editForm, lugar_procedencia: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N° Guía</label>
                                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold" value={editForm.nro_guia} onChange={e => setEditForm({ ...editForm, nro_guia: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Unit. (₲)</label>
                                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold font-mono" value={editForm.costo_unitario} onChange={e => setEditForm({ ...editForm, costo_unitario: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones</label>
                                <textarea rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold resize-none" value={editForm.observaciones} onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditingPurchase(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-black text-sm hover:bg-slate-50 transition-all">
                                Cancelar
                            </button>
                            <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchases.map((purchase) => (
                    <div key={purchase.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <ShoppingCart size={24} />
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => openEdit(purchase)} className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all" title="Editar">
                                    <Pencil size={16} />
                                </button>
                                <button onClick={() => handleDelete(purchase.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Eliminar">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                    Lote #{purchase.id} - {purchase.cantidad_animales} Cabezas
                                </h4>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    <Calendar size={12} />
                                    {new Date(purchase.fecha).toLocaleDateString('es-PY')}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procedencia</p>
                                    <p className="font-bold text-slate-700 truncate">{purchase.lugar_procedencia || 'S/N'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedor</p>
                                    <p className="font-bold text-slate-700 truncate">{purchase.vendedor || 'S/N'}</p>
                                </div>
                            </div>

                            <div className="border-t border-slate-50 pt-4 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Inversión Final (c/ Logística)</p>
                                    <p className="text-xl font-black text-emerald-600 tracking-tighter">
                                        {formatCurrency(purchase.costo_total || (purchase.cantidad_animales * purchase.costo_unitario))}
                                    </p>
                                    {purchase.nro_guia && (
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Guía: {purchase.nro_guia}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Cab. (Base)</p>
                                    <p className="text-sm font-black text-slate-800 tracking-tighter">
                                        {formatCurrency(purchase.costo_unitario)}
                                    </p>
                                </div>
                            </div>
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
