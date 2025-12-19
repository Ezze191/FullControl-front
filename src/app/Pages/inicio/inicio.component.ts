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
import { ScannerSyncService } from '../../services/scanner-sync.service';
import { Subscription } from 'rxjs';

declare var bootstrap: any;

import { ZXingScannerModule } from '@zxing/ngx-scanner';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
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

  // Scanner
  mostrarScanner: boolean = false;
  scannerEnabled: boolean = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  hasDevices: boolean = false;
  hasPermission: boolean | null = null;

  // Results
  producto: Producto | null = null;

  // ... (existing constructor)

  toggleScanner() {
    this.mostrarScanner = !this.mostrarScanner;
    this.scannerEnabled = this.mostrarScanner;
    if (this.mostrarScanner) {
      console.log('Scanner activado. Esperando permisos y dispositivos...');
      this.hasPermission = null;

      // Check for non-secure context (HTTP) specifically for potential camera issues
      if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
        alert('ADVERTENCIA: La cámara podría no funcionar en este dispositivo porque la conexión no es segura (HTTP).\n\nPara que funcione en móviles/tablets, debes habilitar el flag "Insecure origins treated as secure" en chrome://flags y agregar: ' + window.location.origin);
      }
      this.cdr.detectChanges();
    }
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    console.log('Cámaras encontradas:', devices);
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);

    // Solo intentar seleccionar automáticamente la cámara TRASERA si estamos en móvil.
    // Si estamos en PC (sin trasera), dejamos que el scanner (y el navegador) elijan la default por sí mismos (currentDevice = undefined)
    const rearCamera = this.availableDevices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('trasera'));

    if (rearCamera) {
      this.currentDevice = rearCamera;
      console.log('Cámara trasera detectada y seleccionada.', this.currentDevice.label);
    } else {
      console.log('Usando cámara por defecto del sistema (sin forzar ID).');
      this.currentDevice = undefined; // Esto es CLAVE para que no falle si el ID está corrupto
    }
  }

  reiniciarScanner() {
    this.scannerEnabled = false;
    this.currentDevice = undefined;
    this.retryCount = 0;
    setTimeout(() => {
      this.scannerEnabled = true;
    }, 500);
  }

  onPermissionResponse(permission: boolean): void {
    console.log('Permiso de cámara:', permission);
    this.hasPermission = permission;
  }

  onDeviceSelectChange(selected: string) {
    console.log('Cambio de dispositivo:', selected);
    const device = this.availableDevices.find(x => x.deviceId === selected);
    if (device) {
      this.currentDevice = device;
    }
  }
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

  // Remote scanner subscription
  private remoteScanSubscription?: Subscription;

  constructor(
    private productosService: ProductosService,
    private cdr: ChangeDetectorRef,
    private ordersService: OrdersService,
    private serviceService: ServiceService,
    private seasonalService: ProductosTemporadaService,
    private ofertasService: OfertasService,
    private scannerSync: ScannerSyncService
  ) { }

  ngOnInit(): void {
    // Escuchar códigos del escáner remoto
    this.remoteScanSubscription = this.scannerSync.scannedCode$.subscribe(code => {
      if (code) {
        console.log('📱 Código recibido del escáner remoto:', code);
        const plu = Number(code);
        if (!isNaN(plu)) {
          this.pluProducto = plu;
          this.findbyPLU(true); // Auto-agregar al carrito
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripción
    if (this.remoteScanSubscription) {
      this.remoteScanSubscription.unsubscribe();
    }
  }

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

  onCodeResult(resultString: string) {
    if (!resultString) return;

    this.mostrarScanner = false;
    this.scannerEnabled = false;

    // Intentar convertir a numero (PLU)
    const plu = Number(resultString);
    if (!isNaN(plu)) {
      this.pluProducto = plu;
      this.findbyPLU(true); // Pasar flag para indicar que viene del scanner y queremos agregar directo
    } else {
      alert('Código escaneado no es numérico válido para PLU: ' + resultString);
    }
  }

  retryCount: number = 0;

  onScanError(error: any) {
    console.error('Error del escáner:', error);
    // Verificar si es un error de "Dispositivo en uso" o "No legible"
    if (error && (error.name === 'NotReadableError' || error.message?.includes('NotReadableError') || error.message?.includes('Could not start video source'))) {

      // Intento de recuperación automática 1: Probar con la cámara por defecto del sistema si falló una específica
      if (this.currentDevice && this.retryCount === 0) {
        console.warn('Fallo al iniciar cámara específica. Reintentando con cámara por defecto del sistema...');
        this.retryCount++;
        this.currentDevice = undefined; // Quitar dispositivo específico para dejar que el navegador elija
        this.scannerEnabled = false;
        setTimeout(() => {
          this.scannerEnabled = true;
        }, 200);
        return;
      }

      alert('ERROR DE CÁMARA (Bloqueada o no disponible):\n\nWindows no permite usar la cámara. Sigue estos pasos:\n\n1. Ve a "Configuración" de Windows -> "Privacidad" -> "Cámara".\n2. Asegúrate de que "Permitir que las aplicaciones accedan a la cámara" esté ACTIVADO.\n3. Asegúrate de que tu navegador (Chrome/Edge) tenga permiso en esa lista.\n4. Cierra cualquier otra app que use cámara (Zoom, Skype, OBS).\n5. Reinicia el navegador.');
      this.retryCount = 0; // Reset para la próxima
    }
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
  findbyPLU(autoAdd: boolean = false) {
    if (!this.pluProducto || this.findbyname) {
      this.searchbyname();
      return;
    }

    if (this.SeasonalActive) {
      this.findSeasonalByPLU(autoAdd);
      return;
    }

    if (this.OfertasActive) {
      this.findOfertaByPLU(autoAdd);
      return;
    }

    // Default: Product
    this.productosService.findPlu(this.pluProducto).subscribe({
      next: (data) => {
        this.producto = data;
        if (autoAdd && this.producto) {
          this.UnidadesAcobrar[this.producto.ID_PRODUCT] = 1;
          this.agregar_carrito(this.producto.ID_PRODUCT, this.producto.NOMBRE, this.producto.PRECIO_VENTA);
        }
      },
      error: () => {
        this.producto = null;
        if (autoAdd) alert('Producto no encontrado con PLU: ' + this.pluProducto);
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

  findSeasonalByPLU(autoAdd: boolean = false) {
    if (!this.pluProducto) return;
    this.seasonalService.findPlu(this.pluProducto).subscribe({
      next: (data) => {
        this.seasonalProducto = data;
        if (autoAdd && this.seasonalProducto) {
          this.UnidadesAcobrar[this.seasonalProducto.ID_PRODUCT] = 1;
          this.SeasonalAgregarCarrito(this.seasonalProducto.ID_PRODUCT, this.seasonalProducto.NOMBRE, this.seasonalProducto.PRECIO_VENTA);
        }
      },
      error: () => {
        this.seasonalProducto = null;
        if (autoAdd) alert('Producto de temporada no encontrado con PLU: ' + this.pluProducto);
      }
    });
  }

  searchSeasonalByName() {
    if (!this.nombreProducto) return;
    this.seasonalService.findbyName(this.nombreProducto).subscribe(data => {
      this.seasonalPorName = data;
    });
  }

  findOfertaByPLU(autoAdd: boolean = false) {
    if (!this.pluProducto) return;
    this.ofertasService.findPlu(this.pluProducto).subscribe({
      next: (data) => {
        this.ofertaProducto = data;
        if (autoAdd && this.ofertaProducto) {
          this.UnidadesAcobrar[this.ofertaProducto.ID_OFERTA] = 1;
          this.OfertaAgregarCarrito(this.ofertaProducto.ID_OFERTA, this.ofertaProducto.NOMBRE, this.ofertaProducto.PRECIO);
        }
      },
      error: () => {
        this.ofertaProducto = null;
        if (autoAdd) alert('Oferta no encontrada con PLU: ' + this.pluProducto);
      }
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
