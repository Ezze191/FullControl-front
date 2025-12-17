import { Component, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../interfaces/producto.model';
import { CarritoModel } from '../../interfaces/carrito.model';
import { ProductosService } from '../../services/productos.service';
import { OrdersService } from '../../services/orders.service';
import { ServiceModel } from '../../interfaces/service.model';
import { ServiceService } from '../../services/service.service';
import { ProductoTemporada } from '../../interfaces/producto-temporada.model';
import { ProductosTemporadaService } from '../../services/productos-temporada.service';
import { OfertasService } from '../../services/ofertas.service';
import { Oferta } from '../../interfaces/oferta.model';

declare var bootstrap: any;

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {
  // Modes
  ProductosActive: boolean = true;
  ServiceActive: boolean = false;
  SeasonalActive: boolean = false;
  OfertasActive: boolean = false;

  // Search Inputs
  pluProducto: number | null = null;
  nombreProducto: string | null = null;
  nombreService: string | null = null;
  findbyname: boolean = false;

  // Results
  producto: Producto | null = null;
  productosporname: Producto[] = [];

  seasonalProducto: ProductoTemporada | null = null;
  seasonalPorName: ProductoTemporada[] = [];

  ofertaProducto: Oferta | null = null;
  ofertaPorName: Oferta[] = [];

  services: ServiceModel[] = [];

  // Cart & UI
  Carrito: CarritoModel[] = [];
  mostrarCarrito: boolean = false;
  UnidadesAcobrar: { [id: number]: number } = {};
  dineroIngresado: number | null = null;

  @ViewChild('modalCobrar') modalCobrarElement!: ElementRef;
  modalBootstrap: any;

  constructor(
    private productosService: ProductosService,
    private cdr: ChangeDetectorRef,
    private ordersService: OrdersService,
    private serviceService: ServiceService,
    private seasonalService: ProductosTemporadaService,
    private ofertasService: OfertasService
  ) { }

  // --- SELECTION MODES ---
  selectProducts() {
    this.ProductosActive = true;
    this.ServiceActive = false;
    this.SeasonalActive = false;
    this.OfertasActive = false;
    this.resetSearch();
  }

  selectService() {
    this.ServiceActive = true;
    this.ProductosActive = false;
    this.SeasonalActive = false;
    this.OfertasActive = false;
    this.resetSearch();
  }

  selectSeasonal() {
    this.SeasonalActive = true;
    this.ProductosActive = false;
    this.ServiceActive = false;
    this.OfertasActive = false;
    this.resetSearch();
  }

  selectOfertas() {
    this.OfertasActive = true;
    this.ProductosActive = false;
    this.ServiceActive = false;
    this.SeasonalActive = false;
    this.resetSearch();
  }

  resetSearch() {
    this.pluProducto = null;
    this.nombreProducto = null;
    this.nombreService = null;
    this.producto = null;
    this.productosporname = [];
    this.seasonalProducto = null;
    this.seasonalPorName = [];
    this.ofertaProducto = null;
    this.ofertaPorName = [];
    this.services = [];
  }

  checkbox(event: Event): void {
    this.findbyname = (event.target as HTMLInputElement).checked;
    this.resetSearch();
  }

  // --- SEARCH LOGIC ---
  findbyPLU() {
    if (!this.pluProducto || this.findbyname) {
      this.searchbyname();
      return;
    }

    if (this.SeasonalActive) {
      this.findSeasonalByPLU();
      return;
    }

    if (this.OfertasActive) {
      this.findOfertaByPLU();
      return;
    }

    // Default: Product
    this.productosService.findPlu(this.pluProducto).subscribe({
      next: (data) => {
        this.producto = data;
      },
      error: () => {
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

    if (this.OfertasActive) {
      this.searchOfertaByName();
      return;
    }

    // Default: Product
    this.productosService.findbyName(this.nombreProducto).subscribe(data => {
      this.productosporname = data;
    });
  }

  findSeasonalByPLU() {
    if (!this.pluProducto) return;
    this.seasonalService.findPlu(this.pluProducto).subscribe({
      next: (data) => { this.seasonalProducto = data; },
      error: () => { this.seasonalProducto = null; }
    });
  }

  searchSeasonalByName() {
    if (!this.nombreProducto) return;
    this.seasonalService.findbyName(this.nombreProducto).subscribe(data => {
      this.seasonalPorName = data;
    });
  }

  findOfertaByPLU() {
    if (!this.pluProducto) return;
    this.ofertasService.findPlu(this.pluProducto).subscribe({
      next: (data) => { this.ofertaProducto = data; },
      error: () => { this.ofertaProducto = null; }
    });
  }

  searchOfertaByName() {
    if (!this.nombreProducto) return;
    this.ofertasService.findbyName(this.nombreProducto).subscribe(data => {
      this.ofertaPorName = data;
    });
  }

  Servicesearchbyname() {
    if (!this.nombreService) return;
    this.serviceService.findbyName(this.nombreService).subscribe(data => {
      this.services = data;
    });
  }

  // --- CART ---
  agregar_carrito(id: number, nombre: string, precio: number) {
    this.agregarItemCarrito(id, nombre, precio, 'producto');
  }

  SeasonalAgregarCarrito(id: number, nombre: string, precio: number) {
    this.agregarItemCarrito(id, nombre, precio, 'seasonal');
  }

  OfertaAgregarCarrito(id: number, nombre: string, precio: number) {
    this.agregarItemCarrito(id, nombre, precio, 'oferta');
  }

  agregar_servicio_carrito(id: number, nombre: string, precio: number) {
    this.agregarItemCarrito(id, nombre, precio, 'servicio');
  }

  agregarItemCarrito(id: number, nombre: string, precio: number, type: string) {
    const unidades = this.UnidadesAcobrar[id];
    if (unidades > 0) {
      const item: CarritoModel = { id, nombre, precio, unidades, type };
      this.Carrito.push(item);
      this.UnidadesAcobrar[id] = 0;
      this.mostrarCarrito = true;

      // Clear selections
      this.resetSearch();
    } else {
      alert('La cantidad debe ser mayor a 0');
    }
  }

  mostrarcarrito() {
    this.mostrarCarrito = !this.mostrarCarrito;
  }

  restarUnidad(item: CarritoModel) {
    if (item.unidades > 1) {
      item.unidades--;
    } else {
      this.Carrito = this.Carrito.filter(i => i !== item);
    }
  }

  sumarUnidad(item: CarritoModel) {
    item.unidades++;
  }

  calcularTotal(): number {
    return this.Carrito.reduce((total, item) => total + (item.precio * item.unidades), 0);
  }

  // --- CHECKOUT ---
  abrirModal() {
    this.dineroIngresado = null;
    // Check if element exists before creating modal
    if (this.modalCobrarElement && this.modalCobrarElement.nativeElement) {
      if (!this.modalBootstrap) {
        this.modalBootstrap = new bootstrap.Modal(this.modalCobrarElement.nativeElement);
      }
      this.modalBootstrap.show();
    } else {
      // Fallback or use document.getElementById if ViewChild isn't ready
      const el = document.getElementById('modalCobrar');
      if (el) {
        this.modalBootstrap = new bootstrap.Modal(el);
        this.modalBootstrap.show();
      }
    }
  }

  cerrarModal() {
    if (this.modalBootstrap) this.modalBootstrap.hide();
    this.dineroIngresado = null;
  }

  puedeCobrar(): boolean {
    return this.dineroIngresado !== null && this.dineroIngresado >= this.calcularTotal();
  }

  confirmarCobrar() {
    if (this.puedeCobrar()) {
      this.Carrito.forEach(item => this.cobrar(item));
      this.Carrito = [];
      this.cerrarModal();
      alert('Venta realizada con éxito'); // Simple alert, can be toast
    }
  }

  cobrar(item: CarritoModel) {
    switch (item.type) {
      case 'producto':
        this.productosService.cobrarProducto(item.id, item.unidades).subscribe({ error: (e: any) => alert(e) });
        break;
      case 'seasonal':
        this.seasonalService.cobrarProducto(item.id, item.unidades).subscribe({ error: (e: any) => alert(e) });
        break;
      case 'oferta':
        this.ofertasService.cobrarOferta(item.id, item.unidades).subscribe({ error: (e: any) => alert(e) });
        break;
      case 'servicio':
        this.serviceService.cobrarService(item.id).subscribe({ error: (e: any) => alert(e) });
        break;
      case 'orden':
        this.ordersService.cobrarOrden(item.id).subscribe({ error: (e: any) => alert(e) });
        break;
    }
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://media.istockphoto.com/id/1180410208/vector/landscape-image-gallery-with-the-photos-stack-up.jpg?s=612x612&w=0&k=20&c=G21-jgMQruADLPDBk7Sf1vVvCEtPiJD3Rf39AeB95yI=';
  }
}
