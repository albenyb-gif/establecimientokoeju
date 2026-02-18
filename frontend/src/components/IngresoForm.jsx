import React, { useState, useEffect } from 'react';
import AnimalService from '../services/animalService';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

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

    const checkCot = (e) => {
        // Here we could implement debounced validation check if needed
    };

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
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                📥 Registrar Ingreso de Animales
            </h2>

            {status.message && (
                <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nro. COT (SENACSA)</label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.nro_cot}
                            onChange={(e) => setFormData({ ...formData, nro_cot: e.target.value })}
                            placeholder="Ej. COT-12345"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Guía de Traslado</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.nro_guia}
                            onChange={(e) => setFormData({ ...formData, nro_guia: e.target.value })}
                            placeholder="Ej. GT-9876"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Ingreso</label>
                        <input
                            type="date"
                            required
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.fecha}
                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Origen (Establecimiento)</label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.origen}
                            onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                            placeholder="Ej. Estancia La Tranquera"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Especie</label>
                        <select
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={formData.especie}
                            onChange={(e) => setFormData({ ...formData, especie: e.target.value })}
                        >
                            <option value="BOVINO">Bovino (Vacas/Novillos)</option>
                            <option value="OVINO">Ovino (Ovejas/Corderos)</option>
                            <option value="EQUINO">Equino (Caballos)</option>
                            <option value="CAPRINO">Caprino (Cabras)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ingreso</label>
                        <select
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={formData.tipo_ingreso}
                            onChange={(e) => setFormData({ ...formData, tipo_ingreso: e.target.value })}
                        >
                            <option value="COMPRA">Compra</option>
                            <option value="TRASLADO">Traslado</option>
                            <option value="CAPITALIZACION">Capitalización</option>
                            <option value="INVENTARIO_INICIAL">Inventario Inicial (Ya en hacienda)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                        <select
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={formData.categoria_id}
                            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                        >
                            <option value="">-- Seleccionar --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.descripcion}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cant. Cabezas</label>
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.cantidad}
                            onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                            placeholder="0"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Transporte / Chofer</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.transporte}
                            onChange={(e) => setFormData({ ...formData, transporte: e.target.value })}
                            placeholder="Opcional"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Foto de Marca (Opcional)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Upload size={32} />
                            <span className="text-sm font-medium">
                                {file ? file.name : 'Haz clic o arrastra una imagen aquí'}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50"
                >
                    {loading ? 'Registrando...' : 'Registrar Movimiento'}
                </button>
            </form >
        </div >
    );
};

export default IngresoForm;
