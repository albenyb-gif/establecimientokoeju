import React from 'react';
import { X, Download, Printer } from 'lucide-react';

/**
 * Modal de Vista Previa de PDF
 * @param {string} pdfDataUri - Data URI del PDF (doc.output('datauristring'))
 * @param {string} filename - Nombre del archivo para descargar
 * @param {function} onClose - Callback al cerrar
 */
const PrintPreviewModal = ({ pdfDataUri, filename, onClose }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = pdfDataUri;
        link.download = filename || 'reporte.pdf';
        link.click();
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
                <head><title>${filename || 'Reporte'}</title></head>
                <body style="margin:0;padding:0;">
                    <embed src="${pdfDataUri}" type="application/pdf"
                        width="100%" height="100%"
                        style="position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;" />
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    return (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <div>
                        <p className="text-white font-black text-sm tracking-tight">{filename || 'Vista Previa'}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Vista Previa del Documento</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all"
                    >
                        <Printer size={14} /> Imprimir
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30"
                    >
                        <Download size={14} /> Descargar PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 p-4 overflow-hidden">
                <div className="w-full h-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <iframe
                        src={pdfDataUri}
                        title="Vista Previa PDF"
                        className="w-full h-full border-none"
                        style={{ minHeight: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;
