import { Component, ViewChild, ElementRef } from '@angular/core';
import { Producto } from '../../interfaces/producto.model';
import { CarritoModel } from '../../interfaces/carrito.model';
import { ProductosService } from '../../services/productos.service';
import { OrdersService } from '../../services/orders.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiceModel } from '../../interfaces/service.model';
import { ServiceService } from '../../services/service.service';



declare var bootstrap: any;

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',

})
export class InicioComponent {
  ProductosActive: boolean = true;
  ServiceActive: boolean = false;
  pluProducto: number | null = null;
  nombreProducto: string | null = null;
  producto: Producto | null = null;
  productosporname: Producto[] = [];
  UnidadesAcobrar: { [id: number]: number } = {};
  id: number = 0;
  Carrito: CarritoModel[] = [];
  mostrarCarrito = false;
  dineroIngresado: number | null = null;
  findbyname: boolean = false;
  nombreService: string | null = null;
  services: ServiceModel[] = [];
  serviceDineroAcobrar: { [id: number]: number } = {};

  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';

  constructor(private ProductosService: ProductosService, private orderservice: OrdersService, private serviceService: ServiceService) {
    this.cargarCarritoDesdeLocalStorage();
    this.findbyname = false
  }

  mostrarcarrito() {
    if (!this.mostrarCarrito) {
      this.mostrarCarrito = true;
    }
    else {
      this.mostrarCarrito = false;
    }
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

  abrirModal() {
    this.dineroIngresado = null;
    const modalEl = document.getElementById('modalCobrar');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  cerrarModal() {
    const modalEl = document.getElementById('modalCobrar');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }

  puedeCobrar(): boolean {
    return this.dineroIngresado !== null && this.dineroIngresado >= this.calcularTotal();
  }

  confirmarCobrar() {
    this.cobrar();
    this.cerrarModal();
    this.services = [];
    this.producto = null;
    this.productosporname = [];
  }

  findbyPLU() {
    if (!this.pluProducto) {
      this.searchbyname();
      return
    }

    this.ProductosService.findPlu(this.pluProducto).subscribe({
      next: (prod) => {
        this.producto = prod;
        this.id = prod.ID_PRODUCT;

        this.services = [];
        this.productosporname = [];
      },
      error: (err) => {
        console.error('ERRRO AL BUSCAR EL PRODUCTO :', err);
        this.producto = null;
      }
    });
  }

  searchbyname() {
    if (!this.nombreProducto) return;

    this.ProductosService.findbyName(this.nombreProducto).subscribe(data => {
      this.productosporname = data
      this.services = [];
      this.producto = null;
    })

  }

  agregar_carrito(id: number, nombre: string, precio: number) {
    const unidades = this.UnidadesAcobrar[id] || 0;

    if (!unidades) {
      return;
    }

    const type: string = 'producto'

    const productos: CarritoModel = { type, id, nombre, precio, unidades };
    this.Carrito.push(productos);

    this.UnidadesAcobrar[id] = 0;

    this.guardarCarritoEnLocalStorage();  // Guardar después de agregar

    this.producto = null;
    this.productosporname = [];
    this.services = [];
  }

  calcularTotal() {
    return this.Carrito.reduce((total, item) => total + (item.precio * item.unidades), 0);
  }

  cobrar() {
    if (this.Carrito.length === 0) {
      alert('NO HAY NINGUN PRODUCTO EN EL CARRITO');
      return;
    }

    this.Carrito.forEach(producto => {
      switch (producto.type) {
        case 'producto':
          this.ProductosService.cobrarProducto(producto.id, producto.unidades).subscribe({
            next: () => { },
            error: (err) => {
              alert(err);
            }
          });
          break
        case 'orden':
          this.orderservice.cobrarOrden(producto.id).subscribe({
            next: () => { },
            error: (err) => {
              alert(err);
            }
          });
          break
        case 'servicio':
          this.serviceService.cobrarService(producto.id).subscribe({
            next: () => { },
            error: (err) => {
              alert(err);
            }
          });
          break
      }

    });

    this.toastMessage = 'COBRO REALIZADO CON EXITO';
    const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
      delay: 5000
    });
    toast.show();

    this.Carrito = [];
    localStorage.removeItem('carrito');  // Borrar carrito al confirmar
  }

  sumarUnidad(item: any) {
    item.unidades += 1;
    this.guardarCarritoEnLocalStorage();  // Guardar después de modificar
  }

  restarUnidad(item: any) {
    if (item.unidades > 1) {
      item.unidades -= 1;
    } else {
      const index = this.Carrito.indexOf(item);
      if (index !== -1) {
        this.Carrito.splice(index, 1);
      }
    }
    this.guardarCarritoEnLocalStorage();  // Guardar después de modificar
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://media.istockphoto.com/id/1180410208/vector/landscape-image-gallery-with-the-photos-stack-up.jpg?s=612x612&w=0&k=20&c=G21-jgMQruADLPDBk7Sf1vVvCEtPiJD3Rf39AeB95yI=';
  }

  checkbox(event: Event): void {
    this.findbyname = (event.target as HTMLInputElement).checked;
  }

  selectProducts() {
    this.ProductosActive = true;
    this.ServiceActive = false;
  }

  selectService() {
    this.ServiceActive = true;
    this.ProductosActive = false;

  }

  //services

  Servicesearchbyname() {
    if (!this.nombreService) return;

    this.serviceService.findbyName(this.nombreService).subscribe(data => {
      this.services = data
      this.producto = null;
      this.productosporname = [];
    })
    console.log(this.services);

  }

  Serviceagregar_carrito(id: number, nombre: string, comision: number) {
    const unidades = 1

    if (!this.serviceDineroAcobrar) {
      return;
    }

    const precio = comision + this.serviceDineroAcobrar[id]

    const type: string = 'servicio'

    const productos: CarritoModel = { type, id, nombre, precio, unidades };
    this.Carrito.push(productos);

    this.serviceDineroAcobrar[id] = 0;

    this.guardarCarritoEnLocalStorage();  // Guardar después de agregar

    this.producto = null;
    this.productosporname = [];
    this.services = [];
  }

}
