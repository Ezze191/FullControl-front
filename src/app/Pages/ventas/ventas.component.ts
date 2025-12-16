import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VentasService } from '../../services/ventas.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable'

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.css'
})
export class VentasComponent implements OnInit {
  ventas: any[] = []; // Tu array original de ventas
  ventasFiltradas: any[] = [];
  fechaFiltro: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  terminoBusqueda: string = '';

  // Filtros Avanzados
  unidadesMin: number | null = null;
  unidadesMax: number | null = null;

  totalMin: number | null = null;
  totalMax: number | null = null;

  constructor(private VentasService: VentasService) { }

  ngOnInit() {
    const hoy = new Date();
    this.fechaInicio = hoy.toISOString().slice(0, 10);
    this.fechaFin = hoy.toISOString().slice(0, 10);
    this.getVentas();
  }

  getTotalVentas(): number {
    return this.ventasFiltradas.reduce((acc, venta) => acc + Number(venta.DINERO_GENERADO), 0);
  }

  getTotalUnidades(): number {
    return this.ventasFiltradas.reduce((acc, venta) => acc + Number(venta.EXISTENCIA_DE_SALIDA), 0);
  }

  filtrarPorFecha() {
    this.ventasFiltradas = this.ventas.filter(venta => {
      // 1. Fecha
      const fechaVenta = new Date(venta.FECHA).toISOString().slice(0, 10);
      const inDateRange = (!this.fechaInicio || fechaVenta >= this.fechaInicio) &&
        (!this.fechaFin || fechaVenta <= this.fechaFin);

      // 2. Búsqueda (Nombre o ID)
      const search = this.terminoBusqueda.toLowerCase();
      const matchesSearch = !this.terminoBusqueda.trim() ||
        (venta.PRODUCT_NAME || '').toLowerCase().includes(search) ||
        String(venta.ID).includes(search);

      // 3. Unidades
      const matchesUnidadesMin = this.unidadesMin === null || Number(venta.EXISTENCIA_DE_SALIDA) >= this.unidadesMin;
      const matchesUnidadesMax = this.unidadesMax === null || Number(venta.EXISTENCIA_DE_SALIDA) <= this.unidadesMax;

      // 4. Total Generado
      const matchesTotalMin = this.totalMin === null || Number(venta.DINERO_GENERADO) >= this.totalMin;
      const matchesTotalMax = this.totalMax === null || Number(venta.DINERO_GENERADO) <= this.totalMax;

      return inDateRange && matchesSearch &&
        matchesUnidadesMin && matchesUnidadesMax &&
        matchesTotalMin && matchesTotalMax;
    });
  }

  getVentas() {
    this.VentasService.getVentas().subscribe(data => {
      this.ventas = data;
      this.filtrarPorFecha();
    });
  }

  exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(40);

    doc.text('Reporte de Ventas', 14, 15);

    doc.setFontSize(11);
    doc.text(`Desde: ${this.fechaInicio}  Hasta: ${this.fechaFin}`, 14, 22);

    const columnas = ['#', 'Producto', 'Fecha', 'Unidades', 'Total'];
    const filas = this.ventasFiltradas.map(venta => [
      venta.ID,
      venta.PRODUCT_NAME,
      new Date(venta.FECHA).toLocaleDateString(),
      venta.EXISTENCIA_DE_SALIDA,
      `$${venta.DINERO_GENERADO}`
    ]);

    autoTable(doc, {
      startY: 28,
      head: [columnas],
      body: filas,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: 255,
        halign: 'center'
      },
      bodyStyles: {
        halign: 'center'
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 28;

    doc.setFontSize(11);
    doc.text(`Total dinero: $${this.getTotalVentas()}`, 14, finalY + 10);
    doc.text(`Total unidades: ${this.getTotalUnidades()}`, 14, finalY + 17);

    doc.save(`reporte-ventas-${this.fechaInicio}_a_${this.fechaFin}.pdf`);
  }

  exportarExcel() {
    const data = this.ventasFiltradas.map(venta => ({
      ID: venta.ID,
      Producto: venta.PRODUCT_NAME,
      'Fecha de Venta': new Date(venta.FECHA).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      'Unidades Vendidas': venta.EXISTENCIA_DE_SALIDA,
      'Total Generado': new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(venta.DINERO_GENERADO)
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);


    worksheet['!autofilter'] = { ref: `A1:E${data.length + 1}` };


    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 }
    ];

    const workbook: XLSX.WorkBook = { Sheets: { 'Ventas': worksheet }, SheetNames: ['Ventas'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const now = new Date();
    const hora = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, `reporte-ventas-${this.fechaInicio}_a_${this.fechaFin}_${hora}.xlsx`);
  }



}
