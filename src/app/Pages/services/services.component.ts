import { Component, ViewChild, ElementRef } from '@angular/core';
import { ServiceModel } from '../../interfaces/service.model';
import { AgregarServicioComponent } from './agregar-servicio/agregar-servicio.component';
import { ServiceService } from '../../services/service.service';
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
  selector: 'app-services',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule, ReactiveFormsModule, AgregarServicioComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {
  private subscription!: Subscription;

  SpinnerLoading: boolean = false;

  editService!: FormGroup

  ServiceID: number | null = null

  services: ServiceModel[] = []


  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';

  constructor(private servicesService: ServiceService, private fbEdit: FormBuilder) { }

  ngOnInit() {
    this.getService();

    this.subscription = this.servicesService.servicesActualizados$.subscribe(() => {
      this.getService();
    });

    this.editService = this.fbEdit.group({
      name: [''],
      description: [''],
      commission: [''],
      imagePath: ['']
    });
  }

  getService() {
    this.SpinnerLoading = true;
    this.servicesService.getServices().subscribe(data => {
      this.services = data;
      this.SpinnerLoading = false;
    });
  }

   ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  wordSearch: string = ''

  get FilterServices() {
    if (!this.wordSearch.trim()) {
      return this.services
    }
    return this.services.filter(p => (p.name || '').toLowerCase().includes(this.wordSearch.toLowerCase()))
  }

  deleteService(id: number) {
    if (confirm('¿Estás seguro de eliminar este Servicio?')) {
      this.servicesService.deleteService(id).subscribe(p => {
        this.getService();

        // Mostrar toast
        this.toastMessage = 'Servicio eliminado correctamente';
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

  modalEdit(service: ServiceModel) {
    this.ServiceID = service.id;
    this.editService.setValue({
      name: service.name,
      description: service.description,
      commission: service.commission,
      imagePath: service.imagePath

    })
  }

  imgPath: string = '';

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0]
      const formData = new FormData()
      formData.append('imagen', archivo);

      this.servicesService.uploadImage(formData).subscribe({
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
    if (!this.ServiceID) return

    const datosNuevos = this.editService.value

    if (this.imgPath) {
      datosNuevos.imagePath = this.imgPath
    }

    this.servicesService.updateService(this.ServiceID, datosNuevos).subscribe(() => {
      this.getService();
      // Mostrar toast
      this.toastMessage = 'Servicio editado correctamente';
      const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
        delay: 5000
      });
      toast.show();
    })
  }

  totalDineroDeServicio(): number {
    return this.FilterServices.reduce((total, service) => {
      return total + (service.commission * 1);
    }, 0);
  }

  totalServices(): number {
    return this.FilterServices.reduce((total, order) => {
      return total + 1;
    }, 0);
  }


  exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Reporte de Servicios', 14, 15);

    const fechaHora = new Date().toLocaleString();
    doc.setFontSize(11);
    doc.text(`LISTA DE SERVICIOS - ${fechaHora}`, 14, 22);

    const columnas = ['NOMBRE', 'DESCRIPCION', 'COMISION '];

    const filas = this.FilterServices.map(service => [
      String(service.name),
      String(service.description),
      String('$' + service.commission),
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



    doc.text(`TOTAL DINERO EN SERVICIOS: $${this.totalDineroDeServicio().toFixed(2)}`, 14, espacioInicial + espacioEntreLineas);
    doc.text(`TOTAL DE SERVICIOS: ${this.totalServices()}`, 14, espacioInicial + espacioEntreLineas * 2);


    const now = new Date();
    const fileName = `reporte-servicios-${now.toISOString().slice(0, 10)}-${now.getHours()}-${now.getMinutes()}.pdf`;
    doc.save(fileName);
  }


  exportarExcel() {
    const data = this.FilterServices.map(service => ({
      NOMBRE: service.name,
      DESCRIPCION: service.description,
      COMISION: `$${service.commission.toFixed(2)}`,

    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    worksheet['!autofilter'] = { ref: `A1:H${data.length + 1}` };

    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 10 },
      { wch: 12 },
    ];

    const workbook: XLSX.WorkBook = { Sheets: { 'Servicios': worksheet }, SheetNames: ['Servicios'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const now = new Date();
    const fileName = `reporte-servicios-${now.toISOString().slice(0, 10)}-${now.getHours()}-${now.getMinutes()}.xlsx`;
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, fileName);
  }


}
