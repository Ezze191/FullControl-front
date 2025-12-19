import { AgregarProductoComponent } from './agregar-producto/agregar-producto.component';
import { Component, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../interfaces/producto.model';
//estas importaciones son para crear un formulario y poder editarlas
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
//importaciones para generar pdf
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable'
import { Subscription } from 'rxjs';







declare var bootstrap: any;



@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, FormsModule, AgregarProductoComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent {
  private subscription!: Subscription;

  SpinnerLoading: boolean = false;


  //creamos el objeto donde se va almacenar las tareas:
  productos: Producto[] = [];
  proveedores: string[] = [];

  // Filtros
  filtroProveedor: string = '';

  // Precios
  precioMin: number | null = null;
  precioMax: number | null = null;
  compraMin: number | null = null;
  compraMax: number | null = null; // Nuevo

  // Existencia (Stock)
  stockMin: number | null = null; // Nuevo
  stockMax: number | null = null; // Nuevo

  // Fechas (Último Ingreso)
  fechaInicio: string = ''; // Nuevo
  fechaFin: string = ''; // Nuevo

  editarFM!: FormGroup;

  producto_id: number | null = null;


  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';





  constructor(
    private productoService: ProductosService,
    private fbEdit: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  //esto carga los productos automaticamente cuando se mande a llamar los productos
  ngOnInit() {
    this.obtenerProductos();

    this.subscription = this.productoService.productosActualizados$.subscribe(() => {
      this.obtenerProductos();
    });

    this.editarFM = this.fbEdit.group({
      PLU: [''],
      NOMBRE: [''],
      EXISTENCIA: [''],
      PRECIO_COMPRA: [''],
      PRECIO_VENTA: [''],
      PROVEDOR: [''],
      ULTIMO_INGRESO: [''],
      IMAGE_PATH: ['']
    });
  }



  //metodo para obtener los productos
  obtenerProductos() {
    this.SpinnerLoading = true;
    this.productoService.getProductos().subscribe(data => {
      this.productos = data;
      // Extraer proveedores únicos
      this.proveedores = [...new Set(data.map(p => String(p.PROVEDOR)))].filter(p => p).sort();
      this.SpinnerLoading = false;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  //modalEditarAbierto
  modalEdit(producto: Producto) {
    this.producto_id = producto.ID_PRODUCT;
    this.editarFM.setValue({
      PLU: producto.PLU,
      NOMBRE: producto.NOMBRE,
      EXISTENCIA: producto.EXISTENCIA,
      PRECIO_COMPRA: producto.PRECIO_COMPRA,
      PRECIO_VENTA: producto.PRECIO_VENTA,
      PROVEDOR: producto.PROVEDOR,
      ULTIMO_INGRESO: producto.ULTIMO_INGRESO,
      IMAGE_PATH: producto.IMAGE_PATH
    });

    // Detectar si es URL para activar el modo correspondiente
    const path = producto.IMAGE_PATH || '';
    this.urlImageMode = path.startsWith('http') || path.startsWith('https');
    this.imgPath = '';
  }

  //guardar la ruta de la imagen:
  imgPath: string = '';
  urlImageMode: boolean = false;

  toggleImageMode() {
    this.urlImageMode = !this.urlImageMode;
    // Si cambiamos a modo archivo, limpiamos el path para obligar a seleccionar uno nuevo si se desea cambiar
    if (!this.urlImageMode) {
      this.editarFM.patchValue({ IMAGE_PATH: '' });
      this.imgPath = '';
    }
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];
      const formData = new FormData();
      formData.append('imagen', archivo);

      this.productoService.uploadImage(formData).subscribe({
        next: (res) => {
          this.imgPath = res.ruta;
          this.editarFM.patchValue({ IMAGE_PATH: res.ruta });
          console.log('ruta de imagen guardada:', this.imgPath);
        },
        error: (err) => {
          console.error('Error al subir imagen', err);
        }
      })

    }
  }




  //editar un producto mediante id
  guardarEdit() {
    if (!this.producto_id) return;

    const datosNuevos = this.editarFM.value;

    if (this.imgPath) {
      datosNuevos.IMAGE_PATH = this.imgPath;
    }
    // Si estamos en modo URL, el formControlName="IMAGE_PATH" ya tiene el valor correcto

    this.productoService.updateProducto(this.producto_id, datosNuevos)
      .subscribe(() => {
        this.obtenerProductos();

        // Mostrar toast
        this.toastMessage = 'Producto editado correctamente';
        const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
          delay: 5000
        });
        toast.show();

        this.imgPath = '';



      });
  }

  //eliminar producto
  deleteProducto(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.productoService.deleteProducto(id).subscribe(() => {
        this.obtenerProductos();
        // Mostrar toast
        this.toastMessage = 'Producto Eliminado correctamente';
        const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
          delay: 5000
        });
        toast.show();
      });
    }
  }


  terminoBusqueda: string = '';

  get productosFiltrados() {
    return this.productos.filter(p => {
      // Filtro por nombre (búsqueda)
      const busqueda = this.terminoBusqueda.toLowerCase();
      const nombre = String(p.NOMBRE || '').toLowerCase();
      const plu = String(p.PLU || '').toLowerCase();

      const matchesSearch = !this.terminoBusqueda.trim() ||
        nombre.includes(busqueda) ||
        plu.includes(busqueda);

      // Filtro por proveedor
      const matchesProvider = !this.filtroProveedor || String(p.PROVEDOR) === this.filtroProveedor;

      // Filtro por precio (Venta)
      const matchesMinPrice = this.precioMin === null || p.PRECIO_VENTA >= this.precioMin;
      const matchesMaxPrice = this.precioMax === null || p.PRECIO_VENTA <= this.precioMax;

      // Filtro por precio (Compra)
      const matchesMinCompra = this.compraMin === null || p.PRECIO_COMPRA >= this.compraMin;
      const matchesMaxCompra = this.compraMax === null || p.PRECIO_COMPRA <= this.compraMax;

      // Filtro por Existencia
      const matchesMinStock = this.stockMin === null || p.EXISTENCIA >= this.stockMin;
      const matchesMaxStock = this.stockMax === null || p.EXISTENCIA <= this.stockMax;

      // Filtro por Fecha (Último Ingreso)
      let matchesDate = true;
      if (this.fechaInicio && this.fechaFin && p.ULTIMO_INGRESO) {
        const prodDate = new Date(p.ULTIMO_INGRESO).toISOString().slice(0, 10);
        matchesDate = prodDate >= this.fechaInicio && prodDate <= this.fechaFin;
      }

      return matchesSearch && matchesProvider &&
        matchesMinPrice && matchesMaxPrice &&
        matchesMinCompra && matchesMaxCompra &&
        matchesMinStock && matchesMaxStock &&
        matchesDate;
    });
  }


  async generarPDFConBarras(producto: any) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      // Importar dinámicamente bwip-js
      const bwipjs = await import('bwip-js');

      const doc = new jsPDF();
      const plu = String(producto.PLU);
      const nombre = String(producto.NOMBRE);

      // Crear un canvas temporal para generar el código de barras
      const canvas = document.createElement('canvas');

      // Generar el código de barras en el canvas usando bwip-js
      (bwipjs as any).toCanvas(canvas, {
        bcid: 'code128',       // Tipo de código de barras
        text: plu,             // Texto a codificar (PLU)
        scale: 3,              // Factor de escala
        height: 10,            // Altura de las barras
        includetext: true,     // Incluir el texto legible humanamente
        textxalign: 'center',  // Alinear el texto al centro
      });

      // Obtener la imagen en base64 desde el canvas
      const imgData = canvas.toDataURL('image/png');

      // Calcular la posición central en el PDF
      const pageWidth = doc.internal.pageSize.getWidth();
      const imgWidth = 60; // Ancho deseado de la imagen en el PDF
      const imgHeight = 30; // Alto deseado de la imagen en el PDF
      const x = (pageWidth - imgWidth) / 2;
      const y = 20;

      // Agregar título
      doc.setFontSize(16);
      doc.text(nombre, pageWidth / 2, 15, { align: 'center' });

      // Agregar la imagen del código de barras al PDF
      doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      // Guardar el PDF
      doc.save(`CODIGO-${nombre}.pdf`);

    } catch (e) {
      console.error('Error al generar el código de barras:', e);
      alert('Error al generar el código de barras. Verifique que el PLU sea válido.');
    }
  }

  totalDineroDeVenta(): number {
    return this.productosFiltrados.reduce((total, producto) => {
      return total + (producto.PRECIO_VENTA * producto.EXISTENCIA);
    }, 0);
  }

  totalDineroDeCompra(): number {
    return this.productosFiltrados.reduce((total, producto) => {
      return total + (producto.PRECIO_COMPRA * producto.EXISTENCIA);
    }, 0);
  }

  totalProductos(): number {
    return this.productosFiltrados.reduce((total, producto) => {
      return total + producto.EXISTENCIA;
    }, 0);
  }

  exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Reporte de Productos', 14, 15);

    const fechaHora = new Date().toLocaleString();
    doc.setFontSize(11);
    doc.text(`LISTA DE PRODUCTOS - ${fechaHora}`, 14, 22);

    const columnas = ['NOMBRE', 'PLU', 'EXISTENCIA', 'PRECIO COMPRA', 'PRECIO VENTA', 'GANANCIA', 'PROVEEDOR', 'ÚLTIMO INGRESO'];

    const filas = this.productosFiltrados.map(producto => [
      String(producto.NOMBRE),
      String(producto.PLU),
      String(producto.EXISTENCIA),
      `$${producto.PRECIO_COMPRA.toFixed(2)}`,
      `$${producto.PRECIO_VENTA.toFixed(2)}`,
      `$${producto.GANANCIA.toFixed(2)}`,
      String(producto.PROVEDOR),
      new Date(producto.ULTIMO_INGRESO).toLocaleDateString()
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


    doc.text(`TOTAL DINERO DE VENTA: $${this.totalDineroDeVenta().toFixed(2)}`, 14, espacioInicial);
    doc.text(`TOTAL DINERO DE COMPRA: $${this.totalDineroDeCompra().toFixed(2)}`, 14, espacioInicial + espacioEntreLineas);
    doc.text(`TOTAL PRODUCTOS: ${this.totalProductos()}`, 14, espacioInicial + espacioEntreLineas * 2);


    const now = new Date();
    const fileName = `reporte-productos-${now.toISOString().slice(0, 10)}-${now.getHours()}-${now.getMinutes()}.pdf`;
    doc.save(fileName);
  }


  exportarExcel() {
    const data = this.productosFiltrados.map(producto => ({
      NOMBRE: producto.NOMBRE,
      PLU: producto.PLU,
      EXISTENCIA: producto.EXISTENCIA,
      PRECIO_COMPRA: `$${producto.PRECIO_COMPRA.toFixed(2)}`,
      PRECIO_VENTA: `$${producto.PRECIO_VENTA.toFixed(2)}`,
      GANANCIA: `$${producto.GANANCIA.toFixed(2)}`,
      PROVEEDOR: producto.PROVEDOR,
      'ÚLTIMO INGRESO': new Date(producto.ULTIMO_INGRESO).toLocaleDateString('es-MX', {
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
      { wch: 12 },
      { wch: 20 },
      { wch: 18 }
    ];

    const workbook: XLSX.WorkBook = { Sheets: { 'Productos': worksheet }, SheetNames: ['Productos'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const now = new Date();
    const fileName = `reporte-productos-${now.toISOString().slice(0, 10)}-${now.getHours()}-${now.getMinutes()}.xlsx`;
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, fileName);
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://media.istockphoto.com/id/1180410208/vector/landscape-image-gallery-with-the-photos-stack-up.jpg?s=612x612&w=0&k=20&c=G21-jgMQruADLPDBk7Sf1vVvCEtPiJD3Rf39AeB95yI=';
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
    // Ordenar productos alfabéticamente por nombre
    const productos = [...this.productosFiltrados].sort((a, b) => {
      const nombreA = (a.NOMBRE || '').toLowerCase();
      const nombreB = (b.NOMBRE || '').toLowerCase();
      return nombreA.localeCompare(nombreB);
    });

    if (productos.length === 0) {
      this.SpinnerLoading = false;
      alert('No hay productos para exportar');
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
    const tituloTexto = 'CATÁLOGO DE PRODUCTOS';
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

    // Procesar productos
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];

      // Obtener la primera letra del nombre del producto
      const primeraLetraProducto = (producto.NOMBRE || '').charAt(0).toUpperCase() || '#';
      // Si la letra no es válida (número, símbolo), usar '#'
      const letraValida = /[A-ZÁÉÍÓÚÑ]/.test(primeraLetraProducto) ? primeraLetraProducto : '#';

      // Verificar si necesitamos una nueva página ANTES de dibujar el producto
      // Verificar tanto si estamos en la primera columna como en la segunda
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

      // Dibujar la letra inicial SOLO si es el primer producto de la página o cambió la letra
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

      // Nombre del producto en el header (mejor manejo de texto largo)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const nombre = (producto.NOMBRE || 'Sin nombre').toUpperCase();

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
        const imagenBase64 = await this.cargarImagenComoBase64(producto.IMAGE_PATH);
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

      // Precio de venta con fondo destacado (mejorado)
      const precioY = bodyY + imgHeight + 6;
      const precioTexto = `$${producto.PRECIO_VENTA.toFixed(2)}`;

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

      // Actualizar posición para el siguiente producto
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
    const fileName = `catalogo-productos-${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    this.SpinnerLoading = false;
  }


}
