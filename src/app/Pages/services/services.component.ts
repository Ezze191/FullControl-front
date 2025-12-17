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
  minComision: number | null = null;
  maxComision: number | null = null;

  get FilterServices() {
    return this.services.filter(p => {
      // Search in Name OR Description
      const search = this.wordSearch.toLowerCase();
      const matchesSearch = !this.wordSearch.trim() ||
        (p.name || '').toLowerCase().includes(search) ||
        (p.description || '').toLowerCase().includes(search);

      const matchesMinCha = this.minComision === null || p.commission >= this.minComision;
      const matchesMaxCha = this.maxComision === null || p.commission <= this.maxComision;

      return matchesSearch && matchesMinCha && matchesMaxCha;
    })
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

    });

    // Detectar si es URL para activar el modo correspondiente
    const path = service.imagePath || '';
    this.urlImageMode = path.startsWith('http') || path.startsWith('https');
    this.imgPath = '';
  }

  imgPath: string = '';
  urlImageMode: boolean = false;

  toggleImageMode() {
    this.urlImageMode = !this.urlImageMode;
    if (!this.urlImageMode) {
      this.editService.patchValue({ imagePath: '' });
      this.imgPath = '';
    }
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0]
      const formData = new FormData()
      formData.append('imagen', archivo);

      this.servicesService.uploadImage(formData).subscribe({
        next: (res) => {
          this.imgPath = res.ruta;
          this.editService.patchValue({ imagePath: res.ruta });
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



  // Función helper para cargar imagen como base64
  private cargarImagenComoBase64(url: string): Promise<string> {
    return new Promise((resolve) => {
      // Si la URL está vacía o no es válida, retornar vacío
      if (!url || url.trim() === '') {
        resolve('');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      // Timeout para evitar que se quede colgado
      const timeout = setTimeout(() => {
        resolve('');
      }, 5000); // 5 segundos de timeout

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          // Limitar el tamaño máximo de la imagen para optimizar
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
          // Si falla por CORS u otro error, retornar vacío
          resolve('');
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        // Si falla cargar la imagen, retornar vacío
        resolve('');
      };

      img.src = url;
    });
  }

  // Exportar catálogo para clientes
  async exportarCatalogo() {
    this.SpinnerLoading = true;
    const doc = new jsPDF('p', 'mm', 'a4');
    // Ordenar servicios alfabéticamente por nombre
    const servicios = [...this.FilterServices].sort((a, b) => {
      const nombreA = (a.name || '').toLowerCase();
      const nombreB = (b.name || '').toLowerCase();
      return nombreA.localeCompare(nombreB);
    });

    if (servicios.length === 0) {
      this.SpinnerLoading = false;
      alert('No hay servicios para exportar');
      return;
    }

    // Configuración del layout
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const cardWidth = (pageWidth - margin * 3) / 2; // 2 columnas
    const cardHeight = 70;
    const imgHeight = 40;
    const imgWidth = 50;
    const espacioEntreCards = 5;

    let x = margin;
    let y = margin + 20; // Espacio para el título
    let primeraPagina = true;
    let letraActualPagina = ''; // Letra que se dibujó en la página actual
    let numeroPagina = 1;

    // Función helper para dibujar la letra inicial en la esquina superior derecha
    const dibujarLetraInicial = (letra: string, esPrimeraPagina: boolean) => {
      // Obtener la primera letra del nombre en mayúscula
      const primeraLetra = letra.toUpperCase();

      // Ajustar la posición Y según si es la primera página o no
      const posY = esPrimeraPagina ? 20 : 6;
      const posX = pageWidth - 10;
      const tamanoBadge = 12;

      // Dibujar badge redondeado de fondo para la letra (más elegante y compatible)
      doc.setFillColor(248, 249, 250); // Fondo gris muy claro
      doc.setDrawColor(206, 212, 218); // Borde gris
      doc.setLineWidth(0.2);
      doc.roundedRect(posX - tamanoBadge, posY - tamanoBadge / 2, tamanoBadge, tamanoBadge, 2, 2, 'FD');

      // Dibujar letra más pequeña y elegante
      doc.setTextColor(73, 80, 87); // Color gris oscuro
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(primeraLetra, posX - tamanoBadge / 2, posY, {
        align: 'center',
        baseline: 'middle'
      });
    };

    // Título del catálogo con diseño moderno (solo en la primera página)
    doc.setFillColor(13, 110, 253); // Color primary de Bootstrap
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const tituloTexto = 'CATÁLOGO DE SERVICIOS';
    const tituloWidth = doc.getTextWidth(tituloTexto);
    doc.text(tituloTexto, (pageWidth - tituloWidth) / 2, 12);

    // Fecha
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const fecha = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const fechaWidth = doc.getTextWidth(fecha);
    doc.text(fecha, (pageWidth - fechaWidth) / 2, 17);

    // Procesar servicios
    for (let i = 0; i < servicios.length; i++) {
      const servicio = servicios[i];

      // Obtener la primera letra del nombre
      const primeraLetraServicio = (servicio.name || '').charAt(0).toUpperCase() || '#';
      // Si la letra no es válida (número, símbolo), usar '#'
      const letraValida = /[A-ZÁÉÍÓÚÑ]/.test(primeraLetraServicio) ? primeraLetraServicio : '#';

      // Verificar si necesitamos una nueva página ANTES de dibujar el servicio
      const espacioDisponible = pageHeight - margin - y;
      const necesitaNuevaPagina = espacioDisponible < cardHeight;

      if (necesitaNuevaPagina) {
        doc.addPage();
        numeroPagina++;
        y = margin;
        x = margin;
        primeraPagina = false;
        letraActualPagina = ''; // Resetear para nueva página - esto forzará dibujar la letra
      }

      // Dibujar la letra inicial SOLO si es el primer servicio de la página o cambió la letra
      if (letraValida !== letraActualPagina) {
        letraActualPagina = letraValida;
        dibujarLetraInicial(letraValida, primeraPagina);
      }

      // Dibujar card con estilo Bootstrap
      const cardX = x;
      const cardY = y;

      // Sombra de la card (efecto visual)
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(cardX + 0.5, cardY + 0.5, cardWidth - 1, cardHeight - 1, 2, 2, 'F');

      // Borde de la card
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'S');

      // Header de la card (color primary)
      doc.setFillColor(13, 110, 253);
      doc.roundedRect(cardX, cardY, cardWidth, 12, 2, 2, 'F');

      // Nombre del servicio en el header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const nombre = (servicio.name || 'Sin nombre').toUpperCase();

      // Usar splitTextToSize de jsPDF para dividir automáticamente el texto
      const maxWidthNombre = cardWidth - 6;
      const lineasNombre = doc.splitTextToSize(nombre, maxWidthNombre);

      if (lineasNombre.length === 1) {
        // Una sola línea - centrar verticalmente
        doc.text(lineasNombre[0], cardX + cardWidth / 2, cardY + 8, {
          align: 'center'
        });
      } else if (lineasNombre.length === 2) {
        // Dos líneas
        doc.text(lineasNombre[0], cardX + cardWidth / 2, cardY + 6.5, {
          align: 'center'
        });
        doc.text(lineasNombre[1], cardX + cardWidth / 2, cardY + 9.5, {
          align: 'center'
        });
      } else {
        // Más de dos líneas - mostrar primeras dos y truncar
        doc.text(lineasNombre[0], cardX + cardWidth / 2, cardY + 6.5, {
          align: 'center'
        });
        const segundaLinea = lineasNombre[1].length > 18
          ? lineasNombre[1].substring(0, 15) + '...'
          : lineasNombre[1];
        doc.text(segundaLinea, cardX + cardWidth / 2, cardY + 9.5, {
          align: 'center'
        });
      }

      // Cuerpo de la card
      const bodyY = cardY + 12;

      // Cargar y dibujar imagen
      try {
        const imagenBase64 = await this.cargarImagenComoBase64(servicio.imagePath);
        if (imagenBase64) {
          doc.addImage(imagenBase64, 'JPEG',
            cardX + (cardWidth - imgWidth) / 2,
            bodyY + 2,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
          );
        } else {
          // Placeholder si no se puede cargar la imagen
          doc.setFillColor(240, 240, 240);
          doc.rect(cardX + (cardWidth - imgWidth) / 2, bodyY + 2, imgWidth, imgHeight, 'F');
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(8);
          doc.text('Sin imagen', cardX + cardWidth / 2, bodyY + imgHeight / 2 + 2, { align: 'center' });
        }
      } catch (error) {
        // Placeholder en caso de error
        doc.setFillColor(240, 240, 240);
        doc.rect(cardX + (cardWidth - imgWidth) / 2, bodyY + 2, imgWidth, imgHeight, 'F');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text('Sin imagen', cardX + cardWidth / 2, bodyY + imgHeight / 2 + 2, { align: 'center' });
      }

      // Comisión (Precio) con fondo destacado
      const precioY = bodyY + imgHeight + 6;
      const precioTexto = `$${servicio.commission.toFixed(2)}`;

      // Calcular dimensiones del badge de precio
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const precioWidth = doc.getTextWidth(precioTexto) + 6;
      const precioHeight = 5.5;
      const precioX = cardX + (cardWidth - precioWidth) / 2;

      // Fondo para el precio (badge style mejorado)
      doc.setFillColor(40, 167, 69); // Color success de Bootstrap
      doc.setDrawColor(34, 139, 58); // Borde más oscuro
      doc.setLineWidth(0.2);
      doc.roundedRect(precioX, precioY - precioHeight / 2, precioWidth, precioHeight, 1, 1, 'FD');

      // Texto del precio
      doc.setTextColor(255, 255, 255);
      doc.text(precioTexto, cardX + cardWidth / 2, precioY, {
        align: 'center',
        baseline: 'middle'
      });

      // Actualizar posición para el siguiente servicio
      if (x === margin) {
        // Primera columna, mover a la segunda
        x = margin + cardWidth + espacioEntreCards;
      } else {
        // Segunda columna, nueva fila - mover a la siguiente fila
        x = margin;
        y += cardHeight + espacioEntreCards;
      }
    }

    // Guardar el PDF
    const now = new Date();
    const fileName = `catalogo-servicios-${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    this.SpinnerLoading = false;
  }
}

