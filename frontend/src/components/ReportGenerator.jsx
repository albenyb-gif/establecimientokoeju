import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (val) =>
    new Intl.NumberFormat('es-PY', {
        style: 'currency', currency: 'PYG', maximumFractionDigits: 0
    }).format(val || 0).replace('PYG', '₲');

const fmtDate = (dateStr) => {
    if (!dateStr) return '---';
    try { return new Date(dateStr).toLocaleDateString('es-PY'); }
    catch { return dateStr; }
};

const COLOR_DARK   = [15, 23, 42];
const COLOR_MID    = [51, 65, 85];
const COLOR_LIGHT  = [248, 250, 252];
const COLOR_ACCENT = [99, 102, 241];

const ReportGenerator = {

    // ── 1. STOCK GENERAL ────────────────────────────────────────────────────
    generateStockReport: (animals, establecimiento = 'Establecimiento Ganadero') => {
        const doc = new jsPDF();
        doc.setFontSize(18); doc.text(establecimiento, 14, 22);
        doc.setFontSize(14); doc.setTextColor(100); doc.text('Reporte General de Stock', 14, 30);
        doc.setFontSize(10); doc.setTextColor(150);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, 36);
        const totalKilos = animals.reduce((acc, a) => acc + (parseFloat(a.peso_actual) || 0), 0);
        doc.setTextColor(0);
        doc.text(`Total Cabezas: ${animals.length}`, 14, 45);
        doc.text(`Kilos Totales: ${totalKilos.toLocaleString()} kg`, 80, 45);
        doc.autoTable(
            ["Lote", "Caravana", "Categoría", "Raza", "Peso (kg)", "Rodeo", "Comp."],
            animals.map(a => [
                a.lote_id ? `#${a.lote_id}` : 'S/L', a.caravana_visual,
                a.categoria || 'N/A', a.raza || 'N/A', a.peso_actual,
                a.rodeo || 'S/N', a.comparador || 'N/A'
            ]),
            { startY: 50 }
        );
        doc.save(`stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
    },

    // ── 2. ORDEN DE EMBARQUE ─────────────────────────────────────────────────
    generateTransportOrder: (animals, destino, conductor, chapa) => {
        const doc = new jsPDF();
        doc.setFontSize(22); doc.text('ORDEN DE EMBARQUE', 105, 20, null, null, 'center');
        doc.setFontSize(12);
        doc.text(`Destino: ${destino}`, 14, 40);
        doc.text(`Conductor: ${conductor}`, 14, 48);
        doc.text(`Chapa/Patente: ${chapa}`, 14, 56);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 140, 40);
        doc.autoTable(
            ["Caravana", "Categoría", "Peso Origen (Kg)", "Observaciones"],
            animals.map(a => [a.caravana_visual, a.categoria || a.categoria_id, a.peso_actual, '']),
            { startY: 70 }
        );
        const ph = doc.internal.pageSize.height;
        doc.line(20, ph - 40, 80, ph - 40); doc.text('Firma Responsable Estancia', 25, ph - 35);
        doc.line(130, ph - 40, 190, ph - 40); doc.text('Firma Transportista', 145, ph - 35);
        doc.save(`orden_embarque_${new Date().getTime()}.pdf`);
    },

    // ── 3. LIQUIDACIÓN DE VENTA ──────────────────────────────────────────────
    generateSalesVoucher: (saleData, selectedAnimals, establecimiento = "Establecimiento Ko'ẽju") => {
        const doc = new jsPDF();
        doc.setFillColor(...COLOR_DARK); doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24); doc.setFont('helvetica', 'bold');
        doc.text(establecimiento.toUpperCase(), 14, 25);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('LIQUIDACIÓN DE VENTA DE HACIENDA', 14, 33);
        doc.setFontSize(12); doc.text(`FECHA: ${saleData.fecha}`, 160, 25);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('DATOS DEL CLIENTE / DESTINO', 14, 55); doc.line(14, 57, 100, 57);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cliente: ${saleData.cliente}`, 14, 65);
        doc.text(`Lugar de Entrega: ${saleData.destino || 'No especificado'}`, 14, 72);
        doc.text(`RUC: ${saleData.ruc || 'S/N'}`, 14, 79);
        doc.setFillColor(...COLOR_LIGHT); doc.roundedRect(120, 50, 76, 35, 3, 3, 'F');
        doc.setDrawColor(226, 232, 240); doc.roundedRect(120, 50, 76, 35, 3, 3, 'D');
        doc.setFontSize(9); doc.setTextColor(100);
        doc.text('TOTAL CABEZAS', 125, 58); doc.text('PESO TOTAL (KG)', 125, 68);
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLOR_DARK);
        doc.text(`${selectedAnimals.length}`, 190, 58, null, null, 'right');
        doc.text(`${saleData.peso_total.toLocaleString()} kg`, 190, 68, null, null, 'right');
        doc.autoTable({
            head: [["Caravana", "Categoría", "Rodeo de Origen", "Peso Actual (Kg)"]],
            body: selectedAnimals.map(a => [a.caravana_visual, a.categoria || 'N/A', a.rodeo || 'N/A', a.peso_actual.toLocaleString()]),
            startY: 95, theme: 'grid',
            headStyles: { fillColor: COLOR_DARK, textColor: 255 }, styles: { fontSize: 9 }
        });
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('LIQUIDACIÓN COMERCIAL', 14, finalY); doc.line(14, finalY + 2, 100, finalY + 2);
        doc.autoTable({
            body: [
                ['Subtotal Bruto:', formatCurrency(saleData.total_bruto)],
                ['Descuentos / Gastos:', `(-) ${formatCurrency(saleData.descuentos)}`],
                ['TOTAL NETO A COBRAR:', formatCurrency(saleData.total_neto)]
            ],
            startY: finalY + 6, theme: 'plain', styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 }, 1: { halign: 'right', fontStyle: 'bold' } }
        });
        if (saleData.observaciones) {
            doc.setFontSize(8); doc.setTextColor(100);
            doc.text('OBSERVACIONES:', 14, doc.lastAutoTable.finalY + 15);
            doc.setFont('helvetica', 'normal');
            doc.text(saleData.observaciones, 14, doc.lastAutoTable.finalY + 20, { maxWidth: 180 });
        }
        doc.save(`liquidacion_venta_${saleData.fecha}_${new Date().getTime()}.pdf`);
    },

    // ── 4. REPORTE SANITARIO ─────────────────────────────────────────────────
    generateHealthReport: (events, establecimiento = "Establecimiento Ko'ẽju") => {
        const doc = new jsPDF();
        doc.setFontSize(18); doc.text(establecimiento, 14, 22);
        doc.setFontSize(14); doc.setTextColor(100);
        doc.text('Historial Sanitario y de Tratamientos', 14, 30);
        doc.autoTable(
            ["Fecha", "Evento", "Animal", "Producto", "Acta/Ref"],
            events.map(e => [
                e.fecha_aplicacion ? e.fecha_aplicacion.split('T')[0] : 'S/F',
                e.tipo_evento, e.animal, e.producto, e.nro_acta || '---'
            ]),
            { startY: 40 }
        );
        doc.save(`reporte_sanidad_${new Date().toISOString().split('T')[0]}.pdf`);
    },

    // ── 5. SENACSA MV05 — Reporte de Gestión del Establecimiento ────────────
    //    Retorna Data URI para vista previa en modal.
    // ────────────────────────────────────────────────────────────────────────
    generateSenacsaReport: (animals, ranchData, options = {}) => {
        const { incluirFirmas = false } = options;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const today = new Date();

        // ── Encabezado ───────────────────────────────────────────────────────
        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.text((ranchData.establecimiento || "ESTABLECIMIENTO KO'\u1ebcJU").toUpperCase(), 148, 12, null, null, 'center');
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('Registro de Movimientos y Existencia de Hacienda', 148, 19, null, null, 'center');
        doc.setFontSize(8.5); doc.setTextColor(80);
        const periodoText = (ranchData.fechaDesde || '---') + '  \u2014  ' + (ranchData.fechaHasta || '---');
        doc.text('Per\u00edodo: ' + periodoText, 148, 25, null, null, 'center');
        doc.setTextColor(0);
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(130);
        const nowStr = `Emitido: ${today.toLocaleDateString('es-PY')} ${today.getHours().toString().padStart(2,'0')}:${today.getMinutes().toString().padStart(2,'0')}`;
        doc.text(nowStr, 280, 13, null, null, 'right');
        doc.text('P\u00e1g. 1', 280, 19, null, null, 'right');
        doc.setTextColor(0);
        doc.setLineWidth(0.5); doc.line(10, 30, 287, 30);

        // ── Metadatos ────────────────────────────────────────────────────────
        const cell = (label, value, lx, vx, y) => {
            doc.setFont('helvetica', 'bold'); doc.text(label, lx, y);
            doc.setFont('helvetica', 'normal'); doc.text(value || '---', vx, y);
        };
        doc.setFontSize(8);
        const my = 37;
        cell('Fecha Desde:', ranchData.fechaDesde, 15, 40, my);
        cell('Fecha Hasta:', ranchData.fechaHasta, 100, 120, my);
        const r2y = my + 7;
        cell('Departamento:', ranchData.departamento, 15, 40, r2y);
        cell('Distrito:', ranchData.distrito, 100, 115, r2y);
        cell('Localidad:', ranchData.localidad, 180, 200, r2y);
        const r3y = r2y + 7;
        cell('Establecimiento:', ranchData.establecimiento, 15, 45, r3y);
        cell('Tipo establecimiento:', ranchData.tipoEstablecimiento, 180, 215, r3y);
        const r4y = r3y + 7;
        cell('Propietario del Establecimiento:', ranchData.propietario, 15, 70, r4y);
        cell('Unidad Zonal:', ranchData.unidadZonal, 180, 205, r4y);
        doc.setLineWidth(0.2); doc.line(10, r4y + 3, 287, r4y + 3);

        // ════════════════════════════════════════════════════════════════════
        // BLOQUE 1 — RESUMEN EJECUTIVO (KPIs)
        // ════════════════════════════════════════════════════════════════════
        const kpiY = r4y + 9;
        const totalKFin = animals.reduce((s, a) => s + (parseFloat(a.peso_actual)  || 0), 0);
        const totalKIni = animals.reduce((s, a) => s + (parseFloat(a.peso_inicial) || 0), 0);
        const gananciaGlobal = totalKFin - totalKIni;
        const gdpProm = animals.length > 0
            ? animals.reduce((s, a) => s + (parseFloat(a.ultimo_gdp) || 0), 0) / animals.length : 0;
        const enCuarentena = animals.filter(a => a.estado_sanitario === 'CUARENTENA' || a.estado_sanitario === 'BLOQUEADO').length;

        const catCount = {}, propCount = {};
        animals.forEach(a => {
            const c = (a.categoria || 'S/C').toUpperCase();
            catCount[c] = (catCount[c] || 0) + 1;
            const p = a.comparador || 'N/A';
            propCount[p] = (propCount[p] || 0) + 1;
        });

        const kpiBoxes = [
            { label: 'TOTAL CABEZAS',       value: animals.length.toString(), color: COLOR_DARK },
            { label: 'KG TOTALES ACTUALES', value: totalKFin.toLocaleString('es-PY', { maximumFractionDigits: 0 }) + ' kg', color: [30, 64, 175] },
            { label: 'GANANCIA GLOBAL',     value: (gananciaGlobal >= 0 ? '+' : '') + gananciaGlobal.toLocaleString('es-PY', { maximumFractionDigits: 0 }) + ' kg', color: gananciaGlobal >= 0 ? [5, 150, 105] : [220, 38, 38] },
            { label: 'GDP PROM. RODEO',     value: gdpProm.toFixed(3) + ' kg/d', color: [109, 40, 217] },
            { label: 'RESTRICC. SANITARIA', value: enCuarentena === 0 ? 'Sin restricciones' : enCuarentena + ' animales', color: enCuarentena > 0 ? [220, 38, 38] : [5, 150, 105] },
        ];

        const boxW = 52, boxH = 14, boxGap = 3.5;
        kpiBoxes.forEach((b, i) => {
            const bx = 10 + i * (boxW + boxGap);
            doc.setFillColor(...b.color);
            doc.roundedRect(bx, kpiY, boxW, boxH, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
            doc.text(b.label, bx + boxW / 2, kpiY + 4.5, null, null, 'center');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
            doc.text(b.value, bx + boxW / 2, kpiY + 11, null, null, 'center');
        });
        doc.setTextColor(0);

        // Línea de distribución por categoría
        const distY = kpiY + boxH + 4;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(80);
        doc.text('Distribuci\u00f3n:', 10, distY);
        let distX = 35;
        Object.entries(catCount).forEach(([cat, cnt]) => {
            const txt = `${cat}: ${cnt}`;
            doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
            doc.text(txt, distX, distY);
            distX += doc.getTextWidth(txt) + 6;
        });

        // Línea de distribución por propietario
        const distY2 = distY + 5;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(80);
        doc.text('Por propietario:', 10, distY2);
        let distX2 = 42;
        Object.entries(propCount).forEach(([prop, cnt]) => {
            const lbl = prop === 'M' ? 'Martina' : prop === 'MF' ? 'Leli' : prop;
            const txt = `${lbl}: ${cnt}`;
            doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
            doc.text(txt, distX2, distY2);
            distX2 += doc.getTextWidth(txt) + 6;
        });
        doc.setTextColor(0);

        doc.setLineWidth(0.3); doc.setDrawColor(200);
        const sepY = distY2 + 4;
        doc.line(10, sepY, 287, sepY);
        doc.setDrawColor(0);

        // ════════════════════════════════════════════════════════════════════
        // BLOQUE 2 — MOVIMIENTOS DEL PERÍODO
        // ════════════════════════════════════════════════════════════════════
        const movY = sepY + 5;
        const desde = ranchData.fechaDesde ? new Date(ranchData.fechaDesde) : null;
        const hasta  = ranchData.fechaHasta ? new Date(ranchData.fechaHasta + 'T23:59:59') : null;
        const inRange = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !(desde && d < desde) && !(hasta && d > hasta);
        };

        const entradas   = animals.filter(a => inRange(a.fecha_ingreso));
        const salidas    = animals.filter(a => a.fecha_salida && inRange(a.fecha_salida));
        const kgEntradas = entradas.reduce((s, a) => s + (parseFloat(a.peso_inicial) || 0), 0);
        const kgSalidas  = salidas.reduce((s, a)  => s + (parseFloat(a.peso_actual)  || 0), 0);
        const existFinal = animals.length;
        const existIni   = existFinal - entradas.length + salidas.length;

        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...COLOR_DARK);
        doc.text('MOVIMIENTOS DEL PER\u00cdODO', 10, movY);
        doc.setTextColor(0);

        doc.autoTable({
            head: [['Concepto', 'Cabezas', 'Kilos']],
            body: [
                ['Existencia Inicial (estimada)', existIni, (totalKIni - kgEntradas).toLocaleString('es-PY', { maximumFractionDigits: 0 }) + ' kg'],
                ['(+) Entradas del Per\u00edodo',  entradas.length, kgEntradas.toLocaleString('es-PY', { maximumFractionDigits: 0 }) + ' kg'],
                ['(-) Salidas del Per\u00edodo',   salidas.length,  kgSalidas.toLocaleString('es-PY',  { maximumFractionDigits: 0 }) + ' kg'],
            ],
            foot: [['= EXISTENCIA FINAL', existFinal, totalKFin.toLocaleString('es-PY', { maximumFractionDigits: 0 }) + ' kg']],
            startY: movY + 3,
            theme: 'grid',
            margin: { left: 10, right: 150 },
            styles:     { fontSize: 7.5, cellPadding: 2 },
            headStyles: { fillColor: COLOR_MID,  textColor: 255, fontStyle: 'bold', fontSize: 7 },
            footStyles: { fillColor: COLOR_DARK, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
            showFoot: 'lastPage',
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
                2: { cellWidth: 32, halign: 'right' },
            }
        });

        const afterMovY = doc.lastAutoTable.finalY + 5;
        doc.setLineWidth(0.4); doc.setDrawColor(200);
        doc.line(10, afterMovY, 287, afterMovY);
        doc.setDrawColor(0);

        // ════════════════════════════════════════════════════════════════════
        // BLOQUE 3 — TABLA PRINCIPAL (Rodeo + Días en Stock + Estado Sanitario)
        // ════════════════════════════════════════════════════════════════════
        const tableStartY = afterMovY + 4;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...COLOR_DARK);
        doc.text('DETALLE DE EXISTENCIAS \u2014 HACIENDA EN STOCK', 10, tableStartY);
        doc.setTextColor(0);

        const colHeaders = [
            'Fecha Ing.', 'Caravana', 'Rodeo', 'Propietario', 'Vendedor',
            'D\u00edas', 'Estado',
            'K.Ini', 'K.Act',
            'Vacas', 'Vaqu.', 'Novi.', 'Toros', 'D.M', 'D.H', 'T.M', 'T.H', 'Tot.'
        ];

        let totVacas = 0, totVaqu = 0, totNovi = 0, totToros = 0;
        let totDM = 0, totDH = 0, totTM = 0, totTH = 0;
        let totKIniT = 0, totKFinT = 0;

        const tableRows = animals.map(a => {
            const cat    = (a.categoria || '').toUpperCase();
            const esVaca = cat.includes('VACA')    && !cat.includes('VAQUILL') ? 1 : 0;
            const esVaqu = cat.includes('VAQUILL') || cat.includes('VAQUILLON') ? 1 : 0;
            const esNovi = cat.includes('NOVILLO') ? 1 : 0;
            const esToro = cat.includes('TORO')    ? 1 : 0;
            const esDM   = cat.includes('DESMAM')  && (cat.includes('MACHO')  || cat.includes(' M')) ? 1 : 0;
            const esDH   = cat.includes('DESMAM')  && (cat.includes('HEMBRA') || cat.includes(' H')) ? 1 : 0;
            const esTM   = cat.includes('TERNERO') && (cat.includes('MACHO')  || cat.includes(' M')) ? 1 : 0;
            const esTH   = cat.includes('TERNERO') && (cat.includes('HEMBRA') || cat.includes(' H')) ? 1 : 0;
            const kIni   = parseFloat(a.peso_inicial) || 0;
            const kFin   = parseFloat(a.peso_actual)  || 0;
            const dias   = a.fecha_ingreso ? Math.floor((today - new Date(a.fecha_ingreso)) / 86400000) : (a.dias_en_stock || 0);

            totVacas += esVaca; totVaqu  += esVaqu; totNovi  += esNovi; totToros += esToro;
            totDM    += esDM;   totDH    += esDH;   totTM    += esTM;   totTH    += esTH;
            totKIniT += kIni;   totKFinT += kFin;

            return [
                fmtDate(a.fecha_ingreso),
                a.caravana_visual,
                a.rodeo       || '---',
                a.comparador  || '---',
                a.vendedor    || '---',
                dias,
                a.estado_sanitario || 'ACTIVO',
                kIni, kFin,
                esVaca, esVaqu, esNovi, esToro, esDM, esDH, esTM, esTH, 1
            ];
        });

        const totalsRow = [
            'TOTALES', '', '', '', '', '', '',
            totKIniT.toLocaleString('es-PY', { maximumFractionDigits: 0 }),
            totKFinT.toLocaleString('es-PY', { maximumFractionDigits: 0 }),
            totVacas, totVaqu, totNovi, totToros, totDM, totDH, totTM, totTH, animals.length
        ];

        doc.autoTable({
            head: [colHeaders],
            body: tableRows,
            startY: tableStartY + 3,
            theme: 'grid',
            styles:     { fontSize: 6.5, cellPadding: 1 },
            headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold', fontSize: 6.5 },
            foot:       [totalsRow],
            footStyles: { fillColor: COLOR_DARK, textColor: 255, fontStyle: 'bold', fontSize: 7 },
            showFoot: 'lastPage',
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 6) {
                    const estado = data.cell.raw;
                    if (estado === 'CUARENTENA' || estado === 'BLOQUEADO') {
                        doc.setFillColor(254, 226, 226);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        doc.setTextColor(185, 28, 28);
                        doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5);
                        doc.text(estado, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 1.5, null, null, 'center');
                        doc.setTextColor(0);
                    }
                }
            },
            columnStyles: {
                0:  { cellWidth: 17 },
                1:  { cellWidth: 19, fontStyle: 'bold' },
                2:  { cellWidth: 18 },
                3:  { cellWidth: 14 },
                4:  { cellWidth: 18 },
                5:  { cellWidth: 9,  halign: 'center' },
                6:  { cellWidth: 17, halign: 'center', fontSize: 5.5 },
                7:  { cellWidth: 11, halign: 'right' },
                8:  { cellWidth: 11, halign: 'right' },
                9:  { cellWidth: 8,  halign: 'center' },
                10: { cellWidth: 8,  halign: 'center' },
                11: { cellWidth: 8,  halign: 'center' },
                12: { cellWidth: 8,  halign: 'center' },
                13: { cellWidth: 7,  halign: 'center' },
                14: { cellWidth: 7,  halign: 'center' },
                15: { cellWidth: 7,  halign: 'center' },
                16: { cellWidth: 7,  halign: 'center' },
                17: { cellWidth: 9,  halign: 'center', fontStyle: 'bold' }
            }
        });

        // ── Pie de firma (opcional) / referencia interna ──────────────────
        if (incluirFirmas) {
            const py = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
            doc.line(20,  py, 90,  py); doc.text('Firma y Sello Propietario',         25,  py + 5);
            doc.line(110, py, 180, py); doc.text('Firma y Sello M\u00e9dico Veterinario',   115, py + 5);
            doc.line(200, py, 280, py); doc.text('Firma y Sello Inspector SENACSA',    205, py + 5);
        } else {
            const py = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(160);
            doc.text("Documento de uso interno \u2014 Ref. SENACSA MV05 \u2014 " + (ranchData.propietario || ''), 148, py, null, null, 'center');
        }

        return doc.output('datauristring');
    },

    // ── 6. PLANILLA INDIVIDUAL POR ANIMAL ────────────────────────────────────
    //    Retorna Data URI para vista previa en modal.
    // ────────────────────────────────────────────────────────────────────────
    generateAnimalReport: (animal, history = []) => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Cabecera
        doc.setFillColor(...COLOR_DARK); doc.rect(0, 0, 210, 45, 'F');
        doc.setFillColor(...COLOR_ACCENT); doc.rect(0, 42, 210, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text("ESTABLECIMIENTO KO'\u1ebcJU \u2014 FICHA INDIVIDUAL", 14, 14);
        doc.setFontSize(20);
        doc.text(animal.caravana_visual || '---', 14, 28);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text(`RFID: ${animal.caravana_rfid || 'No asignado'}`, 14, 36);

        const estadoColor = animal.estado_sanitario === 'ACTIVO'     ? [16, 185, 129]
                         : animal.estado_sanitario === 'CUARENTENA' ? [245, 158, 11]
                         : animal.estado_sanitario === 'BLOQUEADO'  ? [239, 68, 68]
                         : [100, 116, 139];
        doc.setFillColor(...estadoColor);
        doc.roundedRect(155, 12, 42, 12, 3, 3, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(animal.estado_sanitario || 'ACTIVO', 176, 20, null, null, 'center');
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
        doc.text(`Emitido: ${new Date().toLocaleDateString('es-PY')} ${new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}`, 155, 36);

        doc.setTextColor(0, 0, 0);
        let y = 56;

        const sectionTitle = (title, yPos) => {
            doc.setFillColor(248, 250, 252); doc.rect(10, yPos - 5, 190, 8, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...COLOR_MID);
            doc.text(title.toUpperCase(), 13, yPos);
            doc.setTextColor(0, 0, 0);
            return yPos + 7;
        };

        const fieldRow = (label, value, lx, vx, yPos) => {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
            doc.text(label, lx, yPos);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42); doc.setFontSize(8.5);
            doc.text(String(value || '---'), vx, yPos);
        };

        y = sectionTitle('Identificación y Clasificación', y);
        fieldRow('Caravana Visual:', animal.caravana_visual  || '---', 13, 55,  y);
        fieldRow('RFID:',           animal.caravana_rfid    || '---', 105, 130, y); y += 9;
        fieldRow('Categoría:',      animal.categoria        || '---', 13, 55,  y);
        fieldRow('Pelaje:',         animal.pelaje           || '---', 105, 130, y); y += 9;
        fieldRow('Fecha Nacimiento:', fmtDate(animal.fecha_nacimiento), 13, 55, y);
        fieldRow('Rodeo / Potrero:', `${animal.rodeo || '---'} / ${animal.potrero || '---'}`, 105, 130, y); y += 9;
        fieldRow('Fecha Ingreso:',  fmtDate(animal.fecha_ingreso), 13, 55, y);
        fieldRow('D\u00edas en Stock:', `${animal.dias_en_stock || 0} d\u00edas`, 105, 130, y); y += 9;
        fieldRow('Propietario:', animal.comparador === 'M' ? 'Martina' : animal.comparador === 'MF' ? 'Leli' : (animal.comparador || '---'), 13, 55, y);
        fieldRow('Tipo Negocio:', animal.negocio || 'REPOSICI\u00d3N', 105, 130, y); y += 9;
        fieldRow('Origen:',   animal.origen  || '---', 13, 55,  y);
        fieldRow('Vendedor:', animal.vendedor || '---', 105, 130, y); y += 5;

        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
        doc.line(10, y, 200, y); y += 8;

        y = sectionTitle('Biometría y Rendimiento Económico', y);
        const pesoActual  = parseFloat(animal.peso_actual)  || 0;
        const pesoInicial = parseFloat(animal.peso_inicial) || 0;
        const ganancia    = pesoActual - pesoInicial;
        const gdp         = parseFloat(animal.ultimo_gdp)   || 0;
        const precioKg    = animal.precio_compra && animal.peso_inicial
                            ? (animal.precio_compra / animal.peso_inicial) : 0;

        fieldRow('Peso de Ingreso (kg):',  pesoInicial.toLocaleString('es-PY'), 13, 65,  y);
        fieldRow('Peso Actual (kg):',      pesoActual.toLocaleString('es-PY'),  105, 148, y); y += 9;
        fieldRow('Ganancia Total (kg):',   ganancia.toFixed(1), 13, 65,  y);
        fieldRow('\u00daltima GDP (kg/d\u00eda):', gdp.toFixed(3), 105, 148, y); y += 9;
        fieldRow('Precio Compra (\u20b2/kg):', precioKg > 0 ? precioKg.toLocaleString('es-PY', { maximumFractionDigits: 0 }) : '---', 13, 65, y);
        fieldRow('Lote de Compra:', `#${animal.lote_id || 'S/L'}`, 105, 148, y); y += 5;

        doc.line(10, y, 200, y); y += 8;

        if (history && history.length > 0) {
            y = sectionTitle('Historial de Eventos Registrados', y);
            const histRows = history.map(ev => {
                const tipo = ev.type || ev.tipo_evento || '---';
                let desc = '';
                switch (tipo) {
                    case 'PESAJE':   desc = `${ev.peso_kg} kg` + (ev.gdp_calculado > 0 ? ` (GDP: +${parseFloat(ev.gdp_calculado).toFixed(3)} kg/d)` : ' \u2014 Peso inicial'); break;
                    case 'SANIDAD':  desc = `${ev.tipo_evento || ''}: ${ev.producto || 'Tratamiento'}` + (ev.nro_acta ? ` | Acta: ${ev.nro_acta}` : ''); break;
                    case 'INGRESO':  desc = `Incorporaci\u00f3n al stock (${ev.origen || 'Compra directa'})`; break;
                    case 'SALIDA':   desc = `Egreso: ${ev.motivo_salida || '---'}`; break;
                    case 'TRASLADO': desc = `Traslado: ${ev.origen || ''} \u2192 ${ev.destino || ''}`; break;
                    case 'MARCA':    desc = `Registro de marca: ${ev.tipo_marca || '---'}`; break;
                    default:         desc = ev.detalles || ev.descripcion || '---';
                }
                return [fmtDate(ev.date || ev.fecha_aplicacion), tipo, desc];
            });
            doc.autoTable({
                head: [['Fecha', 'Tipo de Evento', 'Descripci\u00f3n']],
                body: histRows,
                startY: y,
                theme: 'striped',
                headStyles: { fillColor: COLOR_DARK, textColor: 255, fontSize: 8, fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 0: { cellWidth: 28, halign: 'center' }, 1: { cellWidth: 35 }, 2: { cellWidth: 'auto' } },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });
            y = doc.lastAutoTable.finalY + 10;
        } else {
            y = sectionTitle('Historial de Eventos Registrados', y);
            doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(150);
            doc.text('Sin eventos registrados para este animal.', 13, y + 2);
        }

        const pageH = doc.internal.pageSize.height;
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
        doc.line(10, pageH - 30, 200, pageH - 30);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`Documento generado el ${new Date().toLocaleString('es-PY')} por el Sistema de Gesti\u00f3n Ganadera \u2014 Establecimiento Ko'\u1ebcju`, 14, pageH - 24);
        doc.line(14,  pageH - 18, 80,  pageH - 18); doc.text('Responsable del Establecimiento', 14,  pageH - 13);
        doc.line(130, pageH - 18, 196, pageH - 18); doc.text('Firma y Sello', 148, pageH - 13, null, null, 'center');

        return doc.output('datauristring');
    }
};

export default ReportGenerator;
