import React, { useState, useEffect } from 'react';
import { X, Truck } from 'lucide-react';
import AnimalService from '../services/animalService';

const MovementModal = ({ animal, onClose, onSave }) => {
    const [rodeos, setRodeos] = useState([]);
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        origen_rodeo_id: animal.rodeo_id,
        destino_rodeo_id: '',
        motivo: 'ROTACION'
    });

    useEffect(() => {
        const fetchRodeos = async () => {
            try {
                const data = await AnimalService.getRodeos();
                setRodeos(data);
            } catch (error) {
                console.error('Error fetching rodeos:', error);
            }
        };
        fetchRodeos();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Truck size={20} className="text-orange-500" />
                        Registrar Movimiento
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha de Movimiento</label>
                        <input
                            type="date"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Origen Actual</label>
                            <input
                                type="text"
                                value={formData.origen}
                                disabled
                                className="w-full px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 pointer-events-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Destino</label>
                            <select
                                name="destino_rodeo_id"
                                value={formData.destino_rodeo_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                            >
                                <option value="">Seleccionar...</option>
                                {rodeos.map((rodeo) => (
                                    <option key={rodeo.id} value={rodeo.id}>{rodeo.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Motivo</label>
                        <select
                            name="motivo"
                            value={formData.motivo}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                        >
                            <option value="ROTACION">Rotación de Pastura</option>
                            <option value="SANITARIO">Tratamiento Sanitario</option>
                            <option value="VENTA">Venta / Despacho</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                            Confirmar Traslado
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MovementModal;
