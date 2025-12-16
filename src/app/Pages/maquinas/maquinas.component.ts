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

    })
  }

  imgPath: string = '';

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0]
      const formData = new FormData()
      formData.append('imagen', archivo);

      this.materialservice.uploadImage(formData).subscribe({
        next: (res) => {
          this.imgPath = res.ruta;
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




}
