import { Component, ViewChild, ElementRef } from '@angular/core';
import { Producto } from '../../interfaces/producto.model';
import { CarritoModel } from '../../interfaces/carrito.model';
import { ProductosService } from '../../services/productos.service';
import { OrdersService } from '../../services/orders.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiceModel } from '../../interfaces/service.model';
import { ServiceService } from '../../services/service.service';
import { ProductoTemporada } from '../../interfaces/producto-temporada.model';
import { ProductosTemporadaService } from '../../services/productos-temporada.service';

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
  SeasonalActive: boolean = false; // Nuevo estado

  pluProducto: number | null = null;
  nombreProducto: string | null = null;
  producto: Producto | null = null;
  productosporname: Producto[] = [];
  UnidadesAcobrar: { [id: number]: number } = {};

  // Temporal/Seasonal vars
  seasonalProducto: ProductoTemporada | null = null;
  seasonalPorName: ProductoTemporada[] = [];

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

  constructor(
    private ProductosService: ProductosService,
    private orderservice: OrdersService,
    private serviceService: ServiceService,
    private seasonalService: ProductosTemporadaService // Inject new service
  ) {
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
    this.seasonalProducto = null;
    this.seasonalPorName = [];
  }

  findbyPLU() {
    if (!this.pluProducto) {
      this.searchbyname();
      return
    }

    if (this.SeasonalActive) {
      this.findSeasonalByPLU();
      return;
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

    if (this.SeasonalActive) {
      this.searchSeasonalByName();
      return;
    }

    this.ProductosService.findbyName(this.nombreProducto).subscribe(data => {
      this.productosporname = data
      this.services = [];
      this.producto = null;
    })
  }

  // --- SEASONAL LOGIC ---
  findSeasonalByPLU() {
    if (!this.pluProducto) return;
    this.seasonalService.findPlu(this.pluProducto).subscribe({
      next: (prod) => {
        this.seasonalProducto = prod;
        this.seasonalPorName = [];
      },
      error: (err) => {
        console.error('Error buscando producto temporada:', err);
        this.seasonalProducto = null;
      }
    });
  }

  searchSeasonalByName() {
    if (!this.nombreProducto) return;
    this.seasonalService.findbyName(this.nombreProducto).subscribe({
      next: (data) => {
        this.seasonalPorName = data;
        this.seasonalProducto = null;
      },
      error: (err) => {
        console.error('Error buscando producto temporada por nombre:', err);
      }
    });
  }

  SeasonalAgregarCarrito(id: number, nombre: string, precio: number) {
    const unidades = this.UnidadesAcobrar[id] || 0;
    if (!unidades) return;

    const type = 'seasonal';
    const item: CarritoModel = { type, id, nombre, precio, unidades };
    this.Carrito.push(item);
    this.UnidadesAcobrar[id] = 0;
    this.guardarCarritoEnLocalStorage();

    this.seasonalProducto = null;
    this.seasonalPorName = [];
  }
  // -----------------------

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
            error: (err) => { alert(err); }
          });
          break
        case 'seasonal': // New case
          this.seasonalService.cobrarProducto(producto.id, producto.unidades).subscribe({
            next: () => { },
            error: (err) => { alert(err); }
          });
          break;
        case 'orden':
          this.orderservice.cobrarOrden(producto.id).subscribe({
            next: () => { },
            error: (err) => { alert(err); }
          });
          break
        case 'servicio':
          this.serviceService.cobrarService(producto.id).subscribe({
            next: () => { },
            error: (err) => { alert(err); }
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
    this.SeasonalActive = false;
  }

  selectService() {
    this.ServiceActive = true;
    this.ProductosActive = false;
    this.SeasonalActive = false;
  }

  selectSeasonal() {
    this.SeasonalActive = true;
    this.ProductosActive = false;
    this.ServiceActive = false;
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
