import { AgregarProductoComponent } from './agregar-producto/agregar-producto.component';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  editarFM!: FormGroup;

  producto_id: number | null = null;


  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';





  //esto manda a llamar automaticamente cuando inicia el componente a los productos
  constructor(
    private productoService: ProductosService,
    private fbEdit: FormBuilder,
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
    })
  }

  //guardar la ruta de la imagen:
  imgPath: string = '';

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];
      const formData = new FormData();
      formData.append('imagen', archivo);

      this.productoService.uploadImage(formData).subscribe({
        next: (res) => {
          this.imgPath = res.ruta;
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
    if (!this.terminoBusqueda.trim()) {
      return this.productos;
    }

    return this.productos.filter(p =>
      (p.NOMBRE || '').toLowerCase().includes(this.terminoBusqueda.toLowerCase())
    );
  }


  generarPDFConBarras(producto: any) {
    const doc = new jsPDF();

    const ancho = 15;
    const alto = 5;
    const espacioHorizontal = 35;
    const espacioVertical = 20;
    const margenY = 5;

    const paginaAncho = doc.internal.pageSize.getWidth();
    const paginaAlto = doc.internal.pageSize.getHeight();

    const columnas = Math.floor(paginaAncho / espacioHorizontal);
    const filas = Math.floor((paginaAlto - margenY * 2) / espacioVertical);
    const totalAnchoContenido = columnas * espacioHorizontal;
    const margenX = (paginaAncho - totalAnchoContenido) / 2;

    for (let fila = 0; fila < filas; fila++) {
      for (let col = 0; col < columnas; col++) {
        const x = margenX + col * espacioHorizontal;
        const y = margenY + fila * espacioVertical;


        const texto = String(producto.PLU);
        doc.setFontSize(10);
        const textWidth = doc.getTextWidth(texto);
        const centerX = x + ancho / 2 - textWidth / 2;


        doc.rect(x, y, ancho, alto);

        doc.text(texto, centerX, y + alto / 2 + 2);
      }
    }

    doc.save(`CODIGOS - ${producto.NOMBRE}.pdf`);
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


}
