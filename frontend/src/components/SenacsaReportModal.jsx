import React, { useState } from 'react';
import { X, FileText, Download, Building2, MapPin, User, Calendar } from 'lucide-react';
import PrintPreviewModal from './PrintPreviewModal';

const SenacsaReportModal = ({ animals, onClose, onGenerate }) => {
    const [previewUri, setPreviewUri] = useState(null);
    const [incluirFirmas, setIncluirFirmas] = useState(false);
    const [ranchData, setRanchData] = useState({
        fechaDesde: '',
        fechaHasta: '',
        departamento: '08 MISIONES',
        distrito: '08 07 SANTA ROSA',
        localidad: '08 07 06 SAN GABRIEL',
        establecimiento: "ESTABLECIMIENTO KO'ẼJU",
        tipoEstablecimiento: 'Ganadero',
        propietario: 'MARTINA FERNANDEZ BENITEZ',
        unidadZonal: 'SANTA ROSA - MISIONES'
    });

    const handleChange = (e) => {
        setRanchData({ ...ranchData, [e.target.name]: e.target.value });
    };

    const [error, setError] = useState(null);

    const handleGenerate = () => {
        setError(null);
        try {
            const dataUri = onGenerate(animals, ranchData, { incluirFirmas });
            if (dataUri) setPreviewUri(dataUri);
            else onClose();
        } catch (err) {
            console.error('Error generando reporte SENACSA:', err);
            setError(err.message || 'Error desconocido al generar el PDF.');
        }
    };


    if (previewUri) {
        return (
            <PrintPreviewModal
                pdfDataUri={previewUri}
                filename={`reporte_senacsa_${new Date().toISOString().split('T')[0]}.pdf`}
                onClose={() => { setPreviewUri(null); onClose(); }}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reporte SENACSA (MV05)</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen de Existencia y Movimientos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400 hover:text-slate-800"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    
                    {/* Date Range */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Calendar size={12} /> Fecha Desde
                            </label>
                            <input
                                type="date"
                                name="fechaDesde"
                                value={ranchData.fechaDesde}
                                onChange={handleChange}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Calendar size={12} /> Fecha Hasta
                            </label>
                            <input
                                type="date"
                                name="fechaHasta"
                                value={ranchData.fechaHasta}
                                onChange={handleChange}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                            />
                        </div>
                    </div>

                    {/* Location Info */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4 flex items-center gap-2">
                            <MapPin size={16} /> Ubicación Geográfica
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Departamento</label>
                                <input
                                    type="text"
                                    name="departamento"
                                    value={ranchData.departamento}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Distrito</label>
                                <input
                                    type="text"
                                    name="distrito"
                                    value={ranchData.distrito}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Localidad</label>
                                <input
                                    type="text"
                                    name="localidad"
                                    value={ranchData.localidad}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Establishment Info */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4 flex items-center gap-2">
                            <Building2 size={16} /> Datos del Establecimiento
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                                <input
                                    type="text"
                                    name="establecimiento"
                                    value={ranchData.establecimiento}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                                <input
                                    type="text"
                                    name="tipoEstablecimiento"
                                    value={ranchData.tipoEstablecimiento}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <User size={12} /> Propietario
                                </label>
                                <input
                                    type="text"
                                    name="propietario"
                                    value={ranchData.propietario}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidad Zonal</label>
                                <input
                                    type="text"
                                    name="unidadZonal"
                                    value={ranchData.unidadZonal}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-8 border-t border-slate-50 bg-slate-50/30 space-y-4">
                    {/* Toggle firmas */}
                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                        <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                            incluirFirmas ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                            onClick={() => setIncluirFirmas(v => !v)}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                incluirFirmas ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                        </div>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">
                            Incluir líneas de firma
                        </span>
                        {incluirFirmas && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-md uppercase tracking-widest">
                                SENACSA oficial
                            </span>
                        )}
                    </label>

                    {/* Mensaje de error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold break-all">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 hover:text-slate-600 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGenerate}
                            className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Download size={20} /> Vista Previa / Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SenacsaReportModal;
