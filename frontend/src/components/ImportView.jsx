import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Cloud, Download, Server } from 'lucide-react';
import PageHeader from './common/PageHeader';
import AnimalService from '../services/animalService';

const ImportView = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus(null);
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await AnimalService.importMasiva(formData);
            setStatus({ type: 'success', data: response });
        } catch (error) {
            console.error("Error importing:", error);
            setStatus({ type: 'error', message: "Error al procesar el archivo. Verifique el formato XSLX/CSV." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Sincronización Masiva"
                subtitle="Carga avanzada de inventarios mediante planillas estructuradas (Excel/CSV)."
                icon={FileSpreadsheet}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Information Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-white group-hover:scale-110 transition-transform">
                            <Server size={120} />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            Protocolo de Carga
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">Use el formato oficial de columnas del sistema para evitar errores de mapeo.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">Asegúrese de que las caravanas visuales no estén duplicadas en el archivo.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">Los pesos deben estar expresados en Kilogramos (formato numérico).</p>
                            </div>
                        </div>

                        <button className="w-full mt-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 group/btn">
                            <Download size={14} className="group-hover/btn:translate-y-0.5 transition-transform" /> Descargar Plantilla Modelo
                        </button>
                    </div>

                    {status && status.type === 'success' && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-500 rounded-xl text-white">
                                    <CheckCircle size={20} />
                                </div>
                                <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">Carga Finalizada</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Nuevos Registros</span>
                                    <span className="font-black text-emerald-900 text-lg">{status.data?.creados || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Actualizados</span>
                                    <span className="font-black text-emerald-900 text-lg">{status.data?.actualizados || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dropzone Area */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className={`border-2 border-dashed ${file ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'} rounded-[2rem] p-16 transition-all relative flex flex-col items-center justify-center gap-6 group`}>
                        <input
                            type="file"
                            accept=".csv, .xlsx"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            onChange={handleFileChange}
                        />

                        <div className={`h-24 w-24 ${file ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-white text-slate-300 shadow-sm'} rounded-[1.8rem] flex items-center justify-center transition-all group-hover:scale-105 duration-500 z-10`}>
                            {file ? <CheckCircle size={40} /> : <Cloud size={40} />}
                        </div>

                        {file ? (
                            <div className="text-center z-10">
                                <p className="font-black text-slate-800 text-xl tracking-tight mb-1">{file.name}</p>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{(file.size / 1024).toFixed(2)} KB · Listo para procesar</p>
                            </div>
                        ) : (
                            <div className="text-center z-10">
                                <p className="font-black text-slate-400 text-lg tracking-tight mb-1">Seleccionar planilla de datos</p>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Formatos compatibles: .xlsx, .csv</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-4">
                        <button
                            onClick={handleImport}
                            disabled={!file || loading}
                            className="w-full max-w-sm py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-900/10 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Analizando Datos...
                                </div>
                            ) : (
                                <><Upload size={18} /> Iniciar Sincronización</>
                            )}
                        </button>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Al iniciar, el sistema validará la integridad de cada registro antes de persistirlos.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportView;
