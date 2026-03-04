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
        const tableColumn = ["Lote", "Caravana", "Categoría", "Raza", "Peso (kg)", "Unid. Manejo (Rodeo)", "Comp."];
        const tableRows = [];

        animals.forEach(animal => {
            const animalData = [
                animal.lote_id ? `#${animal.lote_id}` : 'S/L',
                animal.caravana_visual,
                animal.categoria || 'N/A',
                animal.raza || 'N/A',
                animal.peso_actual,
                animal.rodeo || 'S/N',
                animal.comparador || 'N/A'
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
                animal.categoria || animal.categoria_id,
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
    },

    // Liquidación de Venta (Boleto)
    generateSalesVoucher: (saleData, selectedAnimals, establecimiento = "Establecimiento Ko'ẽju") => {
        const doc = new jsPDF();
        const formatCurrency = (val) => new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(val || 0).replace('PYG', '₲');

        // Header
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(establecimiento.toUpperCase(), 14, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("LIQUIDACIÓN DE VENTA DE HACIENDA", 14, 33);

        doc.setFontSize(12);
        doc.text(`FECHA: ${saleData.fecha}`, 160, 25);

        // Body Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("DATOS DEL CLIENTE / DESTINO", 14, 55);
        doc.line(14, 57, 100, 57);

        doc.setFont("helvetica", "normal");
        doc.text(`Cliente: ${saleData.cliente}`, 14, 65);
        doc.text(`Lugar de Entrega: ${saleData.destino || 'No especificado'}`, 14, 72);
        doc.text(`RUC: ${saleData.ruc || 'S/N'}`, 14, 79);

        // Summary box
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.roundedRect(120, 50, 76, 35, 3, 3, 'F');
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.roundedRect(120, 50, 76, 35, 3, 3, 'D');

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("TOTAL CABEZAS", 125, 58);
        doc.text("PESO TOTAL (KG)", 125, 68);

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${selectedAnimals.length}`, 190, 58, null, null, "right");
        doc.text(`${saleData.peso_total.toLocaleString()} kg`, 190, 68, null, null, "right");

        // Table of Animals
        const tableColumn = ["Caravana", "Categoría", "Rodeo de Origen", "Peso Actual (Kg)"];
        const tableRows = selectedAnimals.map(a => [
            a.caravana_visual,
            a.categoria || 'N/A',
            a.rodeo || 'N/A',
            a.peso_actual.toLocaleString()
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 95,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255 },
            styles: { fontSize: 9 }
        });

        // Financial Summary
        const finalY = doc.lastAutoTable.finalY + 15;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("LIQUIDACIÓN COMERCIAL", 14, finalY);
        doc.line(14, finalY + 2, 100, finalY + 2);

        const summaryRows = [
            ["Subtotal Bruto:", formatCurrency(saleData.total_bruto)],
            ["Descuentos / Gastos:", `(-) ${formatCurrency(saleData.descuentos)}`],
            ["TOTAL NETO A COBRAR:", formatCurrency(saleData.total_neto)]
        ];

        doc.autoTable({
            body: summaryRows,
            startY: finalY + 6,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', width: 50 },
                1: { halign: 'right', fontStyle: 'bold' }
            }
        });

        if (saleData.observaciones) {
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text("OBSERVACIONES:", 14, doc.lastAutoTable.finalY + 15);
            doc.setFont("helvetica", "normal");
            doc.text(saleData.observaciones, 14, doc.lastAutoTable.finalY + 20, { maxWidth: 180 });
        }

        doc.save(`liquidacion_venta_${saleData.fecha}_${new Date().getTime()}.pdf`);
    },

    // Reporte de Sanidad
    generateHealthReport: (events, establecimiento = "Establecimiento Ko'ẽju") => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(establecimiento, 14, 22);
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text('Historial Sanitario y de Tratamientos', 14, 30);

        const tableColumn = ["Fecha", "Evento", "Animal", "Producto", "Acta/Ref"];
        const tableRows = events.map(e => [
            e.fecha_aplicacion ? e.fecha_aplicacion.split('T')[0] : 'S/F',
            e.tipo_evento,
            e.animal,
            e.producto,
            e.nro_acta || '---'
        ]);

        doc.autoTable(tableColumn, tableRows, { startY: 40 });
        doc.save(`reporte_sanidad_${new Date().toISOString().split('T')[0]}.pdf`);
    }
};

export default ReportGenerator;
