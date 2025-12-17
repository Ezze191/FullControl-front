
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../services/productos.service';
import { VentasService } from '../../services/ventas.service';
import { MaterialsService } from '../../services/materials.service';
import { ProductosTemporadaService } from '../../services/productos-temporada.service';
import { OfertasService } from '../../services/ofertas.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

    // Statistics
    totalProductos: number = 0;
    totalVentas: number = 0;
    totalIngresos: number = 0;
    ingresosHoy: number = 0;
    totalMateriales: number = 0;
    productosTemporada: number = 0;
    totalOfertas: number = 0;
    productosBajoStock: number = 0;

    isLoading: boolean = true;
    greeting: string = '';

    constructor(
        private productosService: ProductosService,
        private ventasService: VentasService,
        private materialsService: MaterialsService,
        private temporadaService: ProductosTemporadaService,
        private ofertasService: OfertasService
    ) { }

    ngOnInit(): void {
        this.setGreeting();
        this.loadData();
    }

    setGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) this.greeting = 'Buenos días';
        else if (hour < 18) this.greeting = 'Buenas tardes';
        else this.greeting = 'Buenas noches';
    }

    loadData() {
        this.isLoading = true;

        // 1. Productos
        this.productosService.getProductos().subscribe({
            next: (data) => {
                this.totalProductos = data.length;
                this.productosBajoStock = data.filter(p => p.EXISTENCIA < 5).length;
            },
            error: (e) => console.error(e)
        });

        // 2. Ventas
        this.ventasService.getVentas().subscribe({
            next: (data) => {
                this.totalVentas = data.length;
                this.totalIngresos = data.reduce((acc, curr) => acc + (Number(curr.DINERO_GENERADO) || 0), 0);

                // Ventas de hoy
                const today = new Date().toISOString().slice(0, 10);
                this.ingresosHoy = data
                    .filter(v => typeof v.FECHA === 'string' && v.FECHA.startsWith(today))
                    .reduce((acc, curr) => acc + (Number(curr.DINERO_GENERADO) || 0), 0);
            },
            error: (e) => console.error(e)
        });

        // 3. Materiales
        this.materialsService.getMaterials().subscribe({
            next: (data) => {
                this.totalMateriales = data.length;
            },
            error: (e) => console.error(e)
        });

        // 4. Temporada
        this.temporadaService.getProductos().subscribe({
            next: (data) => {
                this.productosTemporada = data.length;
            },
            error: (e) => console.error(e)
        });

        // 5. Ofertas
        this.ofertasService.getOfertas().subscribe({
            next: (data) => {
                this.totalOfertas = data.length;
                this.isLoading = false;
            },
            error: (e) => {
                console.error(e);
                this.isLoading = false;
            }
        });

        // Fallback loading stop just in case
        setTimeout(() => {
            this.isLoading = false;
        }, 2000);
    }
}
