import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import PageHeader from './common/PageHeader';
import { Download, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';

const IngresoForm = () => {
    const [formData, setFormData] = useState({
        nro_cot: '',
        nro_guia: '',
        fecha: new Date().toISOString().split('T')[0],
        origen: '',
        tipo_ingreso: 'COMPRA',
        cantidad: '',
        transporte: '',
        categoria_id: '',
        especie: 'BOVINO'
    });
    const [categories, setCategories] = useState([]);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        AnimalService.getCategories().then(setCategories).catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            submitData.append(key, formData[key]);
        });
        if (file) {
            submitData.append('file', file);
        }

        try {
            const result = await AnimalService.registrarIngreso(submitData);
            setStatus({ type: 'success', message: `Ingreso registrado. ID: ${result.cot}` });
            setFormData({
                nro_cot: '',
                nro_guia: '',
                fecha: new Date().toISOString().split('T')[0],
                origen: '',
                tipo_ingreso: 'COMPRA',
                cantidad: '',
                transporte: '',
                categoria_id: '',
                especie: 'BOVINO'
            });
            setFile(null);
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: error.response?.data?.error || 'Error al registrar ingreso' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Ingreso de Hacienda"
                subtitle="Registro oficial de entrada de animales al establecimiento."
                icon={PlusCircle}
            />

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                {status.message && (
                    <div className={`p-4 mb-6 rounded-2xl flex items-center gap-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span className="font-medium">{status.message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nro. COT (SENACSA)</label>
                            <input
                                type="text"
                                required
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={formData.nro_cot}
                                onChange={(e) => setFormData({ ...formData, nro_cot: e.target.value })}
                                placeholder="Ej. COT-12345"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guía de Traslado</label>
                            <input
                                type="text"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={formData.nro_guia}
                                onChange={(e) => setFormData({ ...formData, nro_guia: e.target.value })}
                                placeholder="Ej. GT-9876"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha de Ingreso</label>
                            <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Origen (Establecimiento)</label>
                            <input
                                type="text"
                                required
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={formData.origen}
                                onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                                placeholder="Ej. Estancia La Tranquera"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Especie</label>
                            <select
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white appearance-none cursor-pointer"
                                value={formData.especie}
                                onChange={(e) => setFormData({ ...formData, especie: e.target.value })}
                            >
                                <option value="BOVINO">Bovino (Vacas/Novillos)</option>
                                <option value="OVINO">Ovino (Ovejas/Corderos)</option>
                                <option value="EQUINO">Equino (Caballos)</option>
                                <option value="CAPRINO">Caprino (Cabras)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tipo de Ingreso</label>
                            <select
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white appearance-none cursor-pointer"
                                value={formData.tipo_ingreso}
                                onChange={(e) => setFormData({ ...formData, tipo_ingreso: e.target.value })}
                            >
                                <option value="COMPRA">Compra</option>
                                <option value="TRASLADO">Traslado</option>
                                <option value="CAPITALIZACION">Capitalización</option>
                                <option value="INVENTARIO_INICIAL">Inventario Inicial</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Categoría</label>
                            <select
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white appearance-none cursor-pointer"
                                value={formData.categoria_id}
                                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                            >
                                <option value="">-- Seleccionar --</option>
                                <option value="DESMAMANTE MACHO">DESMAMANTE MACHO</option>
                                <option value="DESMAMANTE HEMBRA">DESMAMANTE HEMBRA</option>
                                <option value="TERNERO MACHO">TERNERO MACHO</option>
                                <option value="TERNERO HEMBRA">TERNERO HEMBRA</option>
                                <option value="VAQUILLA">VAQUILLA</option>
                                <option value="TORO">TORO</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cant. Cabezas</label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-lg"
                                value={formData.cantidad}
                                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Transporte / Chofer</label>
                        <input
                            type="text"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={formData.transporte}
                            onChange={(e) => setFormData({ ...formData, transporte: e.target.value })}
                            placeholder="Nombre del chofer o transporte (Opcional)"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Foto de Marca (Opcional)</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-all cursor-pointer relative group">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                            <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-emerald-500">
                                <PlusCircle size={40} className="transition-colors" />
                                <span className="text-sm font-bold uppercase tracking-widest">
                                    {file ? file.name : 'Subir imagen de marca'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-slate-900/10 hover:shadow-emerald-900/20 disabled:opacity-50 text-lg uppercase tracking-widest"
                    >
                        {loading ? 'Registrando...' : 'Confirmar Ingreso'}
                    </button>
                </form >
            </div>
        </div >
    );
};

export default IngresoForm;
