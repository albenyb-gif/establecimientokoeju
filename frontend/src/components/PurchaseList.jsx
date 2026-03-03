import React, { useEffect, useState } from 'react';
import AnimalService from '../services/animalService';
import { Trash2, Calendar, ShoppingCart, Info } from 'lucide-react';

const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 })
        .format(value || 0).replace('PYG', '₲');

const formatDate = (dateStr) => {
    if (!dateStr) return 'S/F';
    return new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const PurchaseList = ({ onSelectPurchase }) => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('¿Desea eliminar este registro de compra?')) return;
        try {
            await AnimalService.deletePurchaseLote(id);
            setPurchases(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error(error);
            alert('Error al eliminar');
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchases.map((purchase) => (
                    <div
                        key={purchase.id}
                        onClick={() => onSelectPurchase && onSelectPurchase(purchase)}
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
