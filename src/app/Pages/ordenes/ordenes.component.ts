import { Component, ViewChild, ElementRef } from '@angular/core';
import { OrdersModel } from '../../interfaces/orders.model';
import { OrdersService } from '../../services/orders.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AgregarOrdenComponent } from './agregar-orden/agregar-orden.component';
import { CarritoModel } from '../../interfaces/carrito.model';
declare var bootstrap: any;
//importaciones para generar pdf
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable'
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule, ReactiveFormsModule, AgregarOrdenComponent],
  templateUrl: './ordenes.component.html',
  styleUrl: './ordenes.component.css'
})
export class OrdenesComponent {
  private subscription!: Subscription;

  Carrito: CarritoModel[] = [];
  UnidadesAcobrar: number = 1;

  SpinnerLoading: boolean = false;

  editOrder!: FormGroup

  OrderID: number | null = null

  Orders: OrdersModel[] = []



  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';

  constructor(private orderservice: OrdersService, private fbEdit: FormBuilder) { }

  ngOnInit() {
    this.cargarCarritoDesdeLocalStorage();
    this.getOrders();

    this.subscription = this.orderservice.ordersActualizados$.subscribe(()=> {
      this.getOrders();
    });

    this.editOrder = this.fbEdit.group({
      date: [''],
      description: [''],
      customerName: [''],
      phoneNumber: [''],
      price: ['']
    });
  }

  cargarCarritoDesdeLocalStorage() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      this.Carrito = JSON.parse(carritoGuardado);
    }
  }

  guardarCarritoEnLocalStorage() {
    localStorage.setItem('carrito', JSON.stringify(this.Carrito));
  }

  agregar_carrito(id: number, nombre: string, precio: number) {
    const unidades = this.UnidadesAcobrar

    const type: string = 'orden'

    const productos: CarritoModel = { type, id, nombre, precio, unidades };
    this.Carrito.push(productos);


    this.guardarCarritoEnLocalStorage();  // Guardar después de agregar

    this.toastMessage = 'Orden puesta en la lista de compras';
    const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
      delay: 5000
    });
    toast.show();

  }




  FinishOrder(id: number) {
    if (confirm('¿Estás seguro de terminar esta Orden?')) {
      if (!id) return;
      this.orderservice.finish(id).subscribe(() => {
        // Mostrar toast
        this.toastMessage = 'Orden Termianda';
        const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
          delay: 5000
        });
        toast.show();

        this.getOrders();

      });
    }
  }

  notFinishOrder(id: number) {
    if (confirm('¿Estás seguro de dejar pendiente esta Orden?')) {
      if (!id) return;
      this.orderservice.notFinish(id).subscribe(() => {
        this.toastMessage = 'Orden puesta en pendiente';
        const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
          delay: 5000
        });
        toast.show();

        this.getOrders();
      });
    }
  }

  //obtene las ordenes normales
  getOrders() {
    this.SpinnerLoading = true;
    this.orderservice.getOrders().subscribe(data => {
      this.Orders = data;
      this.SpinnerLoading = false
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  //obtener las ordenes que estan terminadas

  getOnlyFinished() {
    this.SpinnerLoading = true;
    this.orderservice.getOlnyFinished().subscribe(data => {
      this.Orders = data;
      this.SpinnerLoading = false
    });
  }

  //obtener las ordenes que no estan terminadas

  getOnlyNotFinished() {
    this.SpinnerLoading = true;
    this.orderservice.getOnlyNotFinished().subscribe(data => {
      this.Orders = data;
      this.SpinnerLoading = false

    });
  }

  //obtener todas las ordenes terminadas | no terminadas

  getAllOrders() {
    this.SpinnerLoading = true;
    this.orderservice.getAllOrders().subscribe(data => {
      this.Orders = data;
      this.SpinnerLoading = false
    });
  }

  wordSearch: string = ''

  get FilterOrders() {
    if (!this.wordSearch.trim()) {
      return this.Orders
    }
    return this.Orders.filter(p => (p.customerName || '').toLowerCase().includes(this.wordSearch.toLowerCase()))
  }

  deleteOrder(id: number) {
    if (confirm('¿Estás seguro de eliminar esta Orden?')) {
      this.orderservice.delete(id).subscribe(p => {
        this.getOrders();

        // Mostrar toast
        this.toastMessage = 'Orden eliminado correctamente';
        const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
          delay: 5000
        });
        toast.show();
      });
    }
  }


  modalEdit(Orden: OrdersModel) {
    this.OrderID = Orden.id;
    this.editOrder.setValue({
      date: Orden.date,
      description: Orden.description,
      customerName: Orden.customerName,
      phoneNumber: Orden.phoneNumber,
      price: Orden.price

    })
  }

  guardarEdit() {
    if (!this.OrderID) return

    const datosNuevos = this.editOrder.value



    this.orderservice.update(this.OrderID, datosNuevos).subscribe(() => {
      this.getOrders();
      // Mostrar toast
      this.toastMessage = 'Orden editado correctamente';
      const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
        delay: 5000
      });
      toast.show();

      this.getOrders();
    })
  }

  totalDineroDeOrdenes(): number {
    return this.FilterOrders.reduce((total, order) => {
      return total + (order.price * 1);
    }, 0);
  }

  totalOrders(): number {
    return this.FilterOrders.reduce((total, order) => {
      return total + 1;
    }, 0);
  }





  exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Reporte de Ordenes', 14, 15);

    const fechaHora = new Date().toLocaleString();
    doc.setFontSize(11);
    doc.text(`LISTA DE ORDENES - ${fechaHora}`, 14, 22);

    const columnas = ['STATUS', 'FECHA', 'DESCRIPCION ', 'NOMBRE DEL CLIENTE', 'NUMERO DE TELEFONO', 'PRECIO'];

    const filas = this.FilterOrders.map(order => [
      order.finished ? 'TERMINADO' : 'NO TERMINADO',
      new Date(order.date).toLocaleDateString(),
      String(order.description),
      String(order.customerName),
      order.phoneNumber || 'SIN NUMERO',
      `$${order.price.toFixed(2)}`,
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



    doc.text(`TOTAL DINERO: $${this.totalDineroDeOrdenes().toFixed(2)}`, 14, espacioInicial + espacioEntreLineas);
    doc.text(`TOTAL DE ORDENES: ${this.totalOrders()}`, 14, espacioInicial + espacioEntreLineas * 2);


    const now = new Date();
    const fileName = `reporte-Ordenes-${now.toISOString().slice(0, 10)}-${now.getHours()}-${now.getMinutes()}.pdf`;
    doc.save(fileName);
  }


  exportarExcel() {
    const data = this.FilterOrders.map(order => ({
      STATUS: order.finished ? 'TERMINADO' : 'NO TERMINADO',
      'FECHA DE ENTREGA': new Date(order.date).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      DESCRIPCION: order.description,
      NOMBRE_DEL_CLIENTE: order.customerName,
      NUMERO_DE_TELEFONO: order.phoneNumber || 'SIN NUMERO',
      PRECIO: `$${order.price.toFixed(2)}`,

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

    const workbook: XLSX.WorkBook = { Sheets: { 'Ordenes': worksheet }, SheetNames: ['Ordenes'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const now = new Date();
    const fileName = `reporte-ordenes-${now.toISOString().slice(0, 10)}-${now.getHours()}-${now.getMinutes()}.xlsx`;
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, fileName);
  }



}
