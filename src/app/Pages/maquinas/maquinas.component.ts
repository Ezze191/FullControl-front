import { Component, ViewChild, ElementRef } from '@angular/core';
import { AgregarMaquinasComponent } from './agregar-maquinas/agregar-maquinas.component';
import { MaterialModel } from '../../interfaces/material.model';
import { MaterialsService } from '../../services/materials.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
declare var bootstrap: any;
//importaciones para generar pdf
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable'
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-maquinas',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule, ReactiveFormsModule, AgregarMaquinasComponent],
  templateUrl: './maquinas.component.html',
  styleUrl: './maquinas.component.css'
})
export class MaquinasComponent {
  private subscription!: Subscription;


  SpinnerLoading: boolean = false;

  editMaterial!: FormGroup

  materialID: number | null = null

  materials: MaterialModel[] = []

  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';

  constructor(private materialservice: MaterialsService, private fbEdit: FormBuilder) { }

  ngOnInit() {
    this.getMaterials();

    this.subscription = this.materialservice.materialActualizados$.subscribe(() => {
      this.getMaterials();
    });

    this.editMaterial = this.fbEdit.group({
      name: [''],
      existence: [''],
      price: [''],
      supplier: [''],
      buyLink: [''],
      lastIncome: [''],
      imagePath: ['']
    });
  }

  getMaterials() {
    this.SpinnerLoading = true;
    this.materialservice.getMaterials().subscribe(data => {
      this.materials = data;
      // Extraer proveedores únicos
      this.proveedores = [...new Set(data.map(m => String(m.supplier)))].filter(p => p).sort();
      this.SpinnerLoading = false;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  wordSearch: string = ''

  // Filtros
  proveedores: string[] = [];
  filtroProveedor: string = '';

  precioMin: number | null = null;
  precioMax: number | null = null;

  stockMin: number | null = null;
  stockMax: number | null = null;

  fechaInicio: string = ''; // Fecha ingreso
  fechaFin: string = '';    // Fecha ingreso

  get FilterMaterials() {
    return this.materials.filter(p => {
      // Búsqueda
      const search = this.wordSearch.toLowerCase();
      const matchesSearch = !this.wordSearch.trim() || (p.name || '').toLowerCase().includes(search);

      // Proveedor
      const matchesProvider = !this.filtroProveedor || String(p.supplier) === this.filtroProveedor;

      // Precio
      const matchesMinPrice = this.precioMin === null || p.price >= this.precioMin;
      const matchesMaxPrice = this.precioMax === null || p.price <= this.precioMax;

      // Stock
      const matchesMinStock = this.stockMin === null || p.existence >= this.stockMin;
      const matchesMaxStock = this.stockMax === null || p.existence <= this.stockMax;

      // Fecha Ingreso
      let matchesDate = true;
      if (this.fechaInicio && this.fechaFin && p.lastIncome) {
        const incomeDate = new Date(p.lastIncome).toISOString().slice(0, 10);
        matchesDate = incomeDate >= this.fechaInicio && incomeDate <= this.fechaFin;
      }

      return matchesSearch && matchesProvider &&
        matchesMinPrice && matchesMaxPrice &&
        matchesMinStock && matchesMaxStock &&
        matchesDate;
    });
  }

  deleteMaterial(id: number) {
    if (confirm('¿Estás seguro de eliminar este Material?')) {
      this.materialservice.deleteMaterial(id).subscribe(p => {
        this.getMaterials();

        // Mostrar toast
        this.toastMessage = 'Material eliminado correctamente';
        const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
          delay: 5000
        });
        toast.show();
      });
    }
  }


  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://media.istockphoto.com/id/1180410208/vector/landscape-image-gallery-with-the-photos-stack-up.jpg?s=612x612&w=0&k=20&c=G21-jgMQruADLPDBk7Sf1vVvCEtPiJD3Rf39AeB95yI=';
  }


  //edit
  modalEdit(material: MaterialModel) {
    this.materialID = material.id;
    this.editMaterial.setValue({
      name: material.name,
      existence: material.existence,
      price: material.price,
      supplier: material.supplier,
      buyLink: material.buyLink,
      lastIncome: material.lastIncome,
      imagePath: material.imagePath

    });

    // Detectar si es URL para activar el modo correspondiente
    const path = material.imagePath || '';
    this.urlImageMode = path.startsWith('http') || path.startsWith('https');
    this.imgPath = '';
  }

  imgPath: string = '';
  urlImageMode: boolean = false;

  toggleImageMode() {
    this.urlImageMode = !this.urlImageMode;
    if (!this.urlImageMode) {
      this.editMaterial.patchValue({ imagePath: '' });
      this.imgPath = '';
    }
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0]
      const formData = new FormData()
      formData.append('imagen', archivo);

      this.materialservice.uploadImage(formData).subscribe({
        next: (res) => {
          this.imgPath = res.ruta;
          this.editMaterial.patchValue({ imagePath: res.ruta });
        },
        error: (err) => {
          console.error('Error al subir la imagen', err);
        }
      })

    }
  }

  guardarEdit() {
    if (!this.materialID) return

    const datosNuevos = this.editMaterial.value

    if (this.imgPath) {
      datosNuevos.imagePath = this.imgPath
    }

    this.materialservice.updateMaterials(this.materialID, datosNuevos).subscribe(() => {
      this.getMaterials();
      // Mostrar toast
      this.toastMessage = 'Material editado correctamente';
      const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
        delay: 5000
      });
      toast.show();
    })
  }



  totalDineroDeCompra(): number {
    return this.FilterMaterials.reduce((total, material) => {
      return total + (material.price * material.existence);
    }, 0);
  }

  totalMateriales(): number {
    return this.FilterMaterials.reduce((total, material) => {
      return total + material.existence;
    }, 0);
  }




  exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Reporte de Materiales', 14, 15);

    const fechaHora = new Date().toLocaleString();
    doc.setFontSize(11);
    doc.text(`LISTA DE MATERIALES - ${fechaHora}`, 14, 22);

    const columnas = ['NOMBRE', 'EXISTENCIA', 'PRECIO ', 'PROVEEDOR', 'ÚLTIMO INGRESO'];

    const filas = this.FilterMaterials.map(material => [
      String(material.name),
      String(material.existence),
      `$${material.price.toFixed(2)}`,
      String(material.supplier),
      new Date(material.lastIncome).toLocaleDateString()
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


    doc.setFontSize(12);
    doc.setTextColor(0);

    const espacioInicial = finalY + 10;
    const espacioEntreLineas = 7;



    doc.text(`TOTAL DINERO: $${this.totalDineroDeCompra().toFixed(2)}`, 14, espacioInicial + espacioEntreLineas);
    doc.text(`TOTAL Materiales: ${this.totalMateriales()}`, 14, espacioInicial + espacioEntreLineas * 2);


    const now = new Date();
    const fileName = `reporte-materiales-${now.toISOString().slice(0, 10)}-${now.getHours()}-${now.getMinutes()}.pdf`;
    doc.save(fileName);
  }


  exportarExcel() {
    const data = this.FilterMaterials.map(material => ({
      NOMBRE: material.name,
      EXISTENCIA: material.existence,
      PRECIO: `$${material.price.toFixed(2)}`,
      PROVEEDOR: material.supplier,
      'FECHA DE INGRESO': new Date(material.lastIncome).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    worksheet['!autofilter'] = { ref: `A1:H${data.length + 1}` };

    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ];

    const workbook: XLSX.WorkBook = { Sheets: { 'Materiales': worksheet }, SheetNames: ['Materiales'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const now = new Date();
    const fileName = `reporte-materiales-${now.toISOString().slice(0, 10)}-${now.getHours()}-${now.getMinutes()}.xlsx`;
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, fileName);
  }







  // Función helper para cargar imagen como base64
  private cargarImagenComoBase64(url: string): Promise<string> {
    return new Promise((resolve) => {
      if (!url || url.trim() === '') {
        resolve('');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timeout = setTimeout(() => { resolve(''); }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          const maxWidth = 200;
          const maxHeight = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL('image/jpeg', 0.85);
            resolve(base64);
          } else {
            resolve('');
          }
        } catch (error) {
          resolve('');
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve('');
      };

      img.src = url;
    });
  }

  async exportarCatalogo() {
    this.SpinnerLoading = true;
    const doc = new jsPDF('p', 'mm', 'a4');

    const materiales = [...this.FilterMaterials].sort((a, b) => {
      const nombreA = (a.name || '').toLowerCase();
      const nombreB = (b.name || '').toLowerCase();
      return nombreA.localeCompare(nombreB);
    });

    if (materiales.length === 0) {
      this.SpinnerLoading = false;
      alert('No hay materiales para exportar');
      return;
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const cardWidth = (pageWidth - margin * 3) / 2;
    const cardHeight = 70;
    const imgHeight = 40;
    const imgWidth = 50;
    const espacioEntreCards = 5;

    let x = margin;
    let y = margin + 20;
    let primeraPagina = true;
    let letraActualPagina = '';
    let numeroPagina = 1;

    const dibujarLetraInicial = (letra: string, esPrimeraPagina: boolean) => {
      const primeraLetra = letra.toUpperCase();
      const posY = esPrimeraPagina ? 20 : 6;
      const posX = pageWidth - 10;
      const tamanoBadge = 12;

      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(206, 212, 218);
      doc.setLineWidth(0.2);
      doc.roundedRect(posX - tamanoBadge, posY - tamanoBadge / 2, tamanoBadge, tamanoBadge, 2, 2, 'FD');

      doc.setTextColor(73, 80, 87);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(primeraLetra, posX - tamanoBadge / 2, posY, { align: 'center', baseline: 'middle' });
    };

    doc.setFillColor(13, 110, 253);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const tituloTexto = 'CATÁLOGO DE MATERIALES';
    const tituloWidth = doc.getTextWidth(tituloTexto);
    doc.text(tituloTexto, (pageWidth - tituloWidth) / 2, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const fechaWidth = doc.getTextWidth(fecha);
    doc.text(fecha, (pageWidth - fechaWidth) / 2, 17);

    for (let i = 0; i < materiales.length; i++) {
      const material = materiales[i];
      const primeraLetra = (material.name || '').charAt(0).toUpperCase() || '#';
      const letraValida = /[A-ZÁÉÍÓÚÑ]/.test(primeraLetra) ? primeraLetra : '#';

      if ((pageHeight - margin - y) < cardHeight) {
        doc.addPage();
        numeroPagina++;
        y = margin;
        x = margin;
        primeraPagina = false;
        letraActualPagina = '';
      }

      if (letraValida !== letraActualPagina) {
        letraActualPagina = letraValida;
        dibujarLetraInicial(letraValida, primeraPagina);
      }

      const cardX = x;
      const cardY = y;

      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(cardX + 0.5, cardY + 0.5, cardWidth - 1, cardHeight - 1, 2, 2, 'F');

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'S');

      doc.setFillColor(13, 110, 253);
      doc.roundedRect(cardX, cardY, cardWidth, 12, 2, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const nombre = (material.name || 'Sin nombre').toUpperCase();

      const lines = doc.splitTextToSize(nombre, cardWidth - 6);
      if (lines.length === 1) doc.text(lines[0], cardX + cardWidth / 2, cardY + 8, { align: 'center' });
      else {
        doc.text(lines[0], cardX + cardWidth / 2, cardY + 6.5, { align: 'center' });
        doc.text(lines[1].length > 20 ? lines[1].substring(0, 18) + '...' : lines[1], cardX + cardWidth / 2, cardY + 9.5, { align: 'center' });
      }

      const bodyY = cardY + 12;
      const imgBase64 = await this.cargarImagenComoBase64(material.imagePath);

      if (imgBase64) {
        doc.addImage(imgBase64, 'JPEG', cardX + (cardWidth - imgWidth) / 2, bodyY + 2, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        doc.setFillColor(230, 230, 230);
        doc.rect(cardX + (cardWidth - imgWidth) / 2, bodyY + 2, imgWidth, imgHeight, 'F');
        doc.setTextColor(150, 150, 150);
        doc.text('Sin imagen', cardX + cardWidth / 2, bodyY + imgHeight / 2 + 2, { align: 'center' });
      }

      const precioY = bodyY + imgHeight + 6;
      const precioTxt = `$${material.price.toFixed(2)}`;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const pWidth = doc.getTextWidth(precioTxt) + 6;
      const pX = cardX + (cardWidth - pWidth) / 2;

      doc.setFillColor(40, 167, 69);
      doc.setDrawColor(34, 139, 58);
      doc.roundedRect(pX, precioY - 2.75, pWidth, 5.5, 1, 1, 'FD');

      doc.setTextColor(255, 255, 255);
      doc.text(precioTxt, cardX + cardWidth / 2, precioY, { align: 'center', baseline: 'middle' });

      if (x === margin) x = margin + cardWidth + espacioEntreCards;
      else {
        x = margin;
        y += cardHeight + espacioEntreCards;
      }
    }

    doc.save(`catalogo-materiales-${new Date().toISOString().slice(0, 10)}.pdf`);
    this.SpinnerLoading = false;
  }
}
