import { InventarioComponent } from './Pages/entradasSalidas/inventario.component';
import { Routes } from '@angular/router';
import { ProductosComponent } from './Pages/productos/productos.component';
import { VentasComponent } from './Pages/ventas/ventas.component';
import { MaquinasComponent } from './Pages/maquinas/maquinas.component';
import { OrdenesComponent } from './Pages/ordenes/ordenes.component';
import { InicioComponent } from './Pages/inicio/inicio.component';
import { ServicesComponent } from './Pages/services/services.component';
import { ProductosTemporadaComponent } from './Pages/productos-temporada/productos-temporada.component';


export const routes: Routes = [
    { path: 'inicio', component: InicioComponent },
    { path: 'productos', component: ProductosComponent },
    { path: 'productos-temporada', component: ProductosTemporadaComponent },
    { path: 'servicios', component: ServicesComponent },
    { path: 'inventario', component: InventarioComponent },
    { path: 'ventas', component: VentasComponent },
    { path: 'maquinas', component: MaquinasComponent },
    { path: 'ordenes', component: OrdenesComponent },
    { path: '', redirectTo: '/inicio', pathMatch: 'full' }

];
