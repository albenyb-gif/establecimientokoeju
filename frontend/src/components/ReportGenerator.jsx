import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportGenerator = {
    // Reporte de Existencia General (Stock)
    generateStockReport: (animals, establecimiento = 'Establecimiento Ganadero') => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text(establecimiento, 14, 22);
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text('Reporte General de Stock', 14, 30);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, 36);

        // Resumen
        const totalCabezas = animals.length;
        const totalKilos = animals.reduce((acc, curr) => acc + (curr.peso_actual || 0), 0);

        doc.setTextColor(0);
        doc.text(`Total Cabezas: ${totalCabezas}`, 14, 45);
        doc.text(`Kilos Totales: ${totalKilos.toLocaleString()} kg`, 80, 45);

        // Tabla
        const tableColumn = ["ID Visual", "Categoría", "Raza", "Peso (kg)", "Rodeo", "Estado"];
        const tableRows = [];

        animals.forEach(animal => {
            const animalData = [
                animal.caravana_visual,
                animal.categoria_id,
                animal.raza || 'N/A',
                animal.peso_actual,
                animal.rodeo_id,
                animal.estado_sanitario
            ];
            tableRows.push(animalData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 50 });
        doc.save(`stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
    },

    // Orden de Embarque (Para Transportista)
    generateTransportOrder: (animals, destino, conductor, chapa) => {
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("ORDEN DE EMBARQUE", 105, 20, null, null, "center");

        doc.setFontSize(12);
        doc.text(`Destino: ${destino}`, 14, 40);
        doc.text(`Conductor: ${conductor}`, 14, 48);
        doc.text(`Chapa/Patente: ${chapa}`, 14, 56);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 140, 40);

        const tableColumn = ["Caravana", "Categoría", "Peso Origen (Kg)", "Observaciones"];
        const tableRows = [];

        animals.forEach(animal => {
            tableRows.push([
                animal.caravana_visual,
                animal.categoria_id,
                animal.peso_actual,
                ""
            ]);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 70 });

        // Firmas
        const pageHeight = doc.internal.pageSize.height;
        doc.line(20, pageHeight - 40, 80, pageHeight - 40);
        doc.text("Firma Responsable Estancia", 25, pageHeight - 35);

        doc.line(130, pageHeight - 40, 190, pageHeight - 40);
        doc.text("Firma Transportista", 145, pageHeight - 35);

        doc.save(`orden_embarque_${new Date().getTime()}.pdf`);
    }
};

export default ReportGenerator;
