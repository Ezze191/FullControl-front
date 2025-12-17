import { InventarioComponent } from './Pages/entradasSalidas/inventario.component';
import { Routes } from '@angular/router';
import { ProductosComponent } from './Pages/productos/productos.component';
import { VentasComponent } from './Pages/ventas/ventas.component';
import { MaquinasComponent } from './Pages/maquinas/maquinas.component';
import { OrdenesComponent } from './Pages/ordenes/ordenes.component';
import { InicioComponent } from './Pages/inicio/inicio.component';
import { ServicesComponent } from './Pages/services/services.component';
import { ProductosTemporadaComponent } from './Pages/productos-temporada/productos-temporada.component';
import { OfertasComponent } from './Pages/ofertas/ofertas.component';
import { AgregarOfertaComponent } from './Pages/ofertas/agregar-oferta/agregar-oferta.component';
import { AgregarProductoTemporadaComponent } from './Pages/productos-temporada/agregar-producto-temporada/agregar-producto-temporada.component';


import { DashboardComponent } from './Pages/dashboard/dashboard.component';


export const routes: Routes = [
    { path: 'dashboard', component: DashboardComponent },
    { path: 'cobrar', component: InicioComponent },
    { path: 'inicio', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'productos', component: ProductosComponent },
    { path: 'productos-temporada', component: ProductosTemporadaComponent },
    { path: 'agregar-producto-temporada', component: AgregarProductoTemporadaComponent },
    { path: 'ofertas', component: OfertasComponent },
    { path: 'agregar-oferta', component: AgregarOfertaComponent },

    // REDIRECCION POR DEFECTO
    { path: 'servicios', component: ServicesComponent },
    { path: 'inventario', component: InventarioComponent },
    { path: 'ventas', component: VentasComponent },
    { path: 'maquinas', component: MaquinasComponent },
    { path: 'ordenes', component: OrdenesComponent },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' }

];
