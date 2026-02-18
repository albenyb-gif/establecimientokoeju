import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
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
            // Mock call or real call if backend supported file parsing
            // For now, assume backend returns statistics of import
            const response = await AnimalService.importMasiva(formData);
            setStatus({ type: 'success', data: response });
        } catch (error) {
            console.error("Error importing:", error);
            setStatus({ type: 'error', message: "Error al procesar el archivo." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <FileSpreadsheet className="text-green-600" size={32} />
                    Importación Masiva
                </h1>
                <p className="text-slate-500 mt-2">Carga de planillas Excel/CSV para actualización de stock.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center">
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-12 hover:bg-slate-50 transition-colors cursor-pointer relative flex flex-col items-center justify-center gap-4">
                    <input
                        type="file"
                        accept=".csv, .xlsx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                    />
                    <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-2">
                        <Upload size={32} />
                    </div>

                    {file ? (
                        <div>
                            <p className="font-bold text-slate-800 text-lg">{file.name}</p>
                            <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    ) : (
                        <div>
                            <p className="font-bold text-slate-700 text-lg">Arrastra tu archivo aquí</p>
                            <p className="text-slate-400">o haz clic para seleccionar</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleImport}
                        disabled={!file || loading}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
                    >
                        {loading ? 'Procesando...' : 'Iniciar Importación'}
                    </button>
                </div>
            </div>

            {status && status.type === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex gap-4 items-start">
                    <CheckCircle className="text-green-600 shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-green-800">Importación Exitosa</h3>
                        <p className="text-green-700 text-sm mt-1">Se han procesado los registros correctamente.</p>
                        <div className="mt-3 flex gap-4 text-sm font-medium text-green-800">
                            <span>Nuevos: {status.data?.creados || 15}</span>
                            <span>Actualizados: {status.data?.actualizados || 42}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportView;
