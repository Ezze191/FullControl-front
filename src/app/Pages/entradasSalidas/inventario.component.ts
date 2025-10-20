import { Component, ViewChild, ElementRef } from '@angular/core';
import { Producto } from '../../interfaces/producto.model';
import { ProductosService } from '../../services/productos.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModel } from '../../interfaces/material.model';
import { MaterialsService } from '../../services/materials.service';


declare var bootstrap: any;

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent {
  ProductosActive: boolean = true;
  MaterialActive: boolean = false;
  codigoProducto: number | null = null;
  nombreProducto: string | null = null;
  findbyname: boolean = false;
  producto: Producto | null = null;
  productosporname: Producto[] = [];
  cantidadAgregar: { [id: number]: number } = {};
  cantidadQuitar: { [id: number]: number } = {};
  pluBool: boolean = false;
  nameBool: boolean = false;

  nombreMaterial: string | null = null;
  materiales: MaterialModel[] = []



  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';

  constructor(private productoservice: ProductosService, private materialeservice: MaterialsService) { }

  selectProducts() {
    this.ProductosActive = true;
    this.MaterialActive = false;
  }

  selectMaterial() {
    this.MaterialActive = true;
    this.ProductosActive = false;

  }

  findbyPLU() {
    if (!this.codigoProducto || this.nameBool) {
      this.searchbyname();
      return;
    }

    this.nameBool = false;
    this.pluBool = true;

    this.productoservice.findPlu(this.codigoProducto).subscribe({
      next: (prod) => {
        this.producto = prod;


      },
      error: (err) => {
        console.error('Error al buscar producto:', err);
        this.producto = null;

      }
    })
  }

  checkbox(event: Event): void {
    this.findbyname = (event.target as HTMLInputElement).checked;
    // Limpiar campos y resultados al cambiar el tipo de búsqueda
    this.codigoProducto = null;
    this.nombreProducto = null;
    this.producto = null;
    this.productosporname = [];
  }

  onSubmit() {
    if (this.findbyname) {
      this.searchbyname();
    } else {
      this.findbyPLU();
    }
  }


  searchbyname() {
    if (!this.nombreProducto) return;

    this.nameBool = true;
    this.pluBool = false;
    this.producto = null;
    this.productoservice.findbyName(this.nombreProducto).subscribe(data => {
      this.productosporname = data

    })

  }


  agregarExistencia(id: number, producto: Producto) {
    const cantidad = this.cantidadAgregar[id] || 0;
    if (!producto || cantidad <= 0) return;

    const today = new Date();
    const nuevaExistencia = producto.EXISTENCIA + cantidad;

    const ProductoActualizado: Producto = {
      ...producto,
      EXISTENCIA: nuevaExistencia,
      ULTIMO_INGRESO: today.toISOString().split('T')[0]
    };

    this.productoservice.updateProducto(producto.ID_PRODUCT, ProductoActualizado).subscribe(updated => {
      // Actualiza el producto en el array si es necesario
      producto.EXISTENCIA = updated.EXISTENCIA;
      producto.ULTIMO_INGRESO = updated.ULTIMO_INGRESO;
      this.cantidadAgregar[id] = 0;

      // Mostrar toast
      this.toastMessage = 'EXISTENCIA ACTUALIZADA CORRECTAMENTE';
      const toast = new bootstrap.Toast(this.toastElement.nativeElement, { delay: 5000 });
      toast.show();

      if (this.pluBool) {
        this.findbyPLU();
      }
      else {
        this.searchbyname();
      }

    });
  }

  quitarExistencia(id: number, producto: Producto) {
    const cantidad = this.cantidadQuitar[id] || 0;
    if (!producto || cantidad <= 0) return;

    const nuevaExistencia = producto.EXISTENCIA - cantidad;
    if (nuevaExistencia < 0) {
      alert("No puedes tener existencia negativa");
      return;
    }

    const ProductoActualizado: Producto = {
      ...producto,
      EXISTENCIA: nuevaExistencia
    };

    this.productoservice.updateProducto(producto.ID_PRODUCT, ProductoActualizado).subscribe(updated => {
      producto.EXISTENCIA = updated.EXISTENCIA;
      this.cantidadQuitar[id] = 0;

      // Mostrar toast
      this.toastMessage = 'EXISTENCIA ACTUALIZADA CORRECTAMENTE';
      const toast = new bootstrap.Toast(this.toastElement.nativeElement, { delay: 5000 });
      toast.show();

      if (this.pluBool) {
        this.findbyPLU();
      }
      else {
        this.searchbyname();
      }

    });
  }

  //logica para agregar y quitar materiales
  Materialsearchbyname() {
    if (!this.nombreMaterial) return;

    this.materialeservice.findbyName(this.nombreMaterial).subscribe(data => {
      this.materiales = data
    })

  }

  MaterialagregarExistencia(id: number, material: MaterialModel) {
    const cantidad = this.cantidadAgregar[id] || 0;
    if (!material || cantidad <= 0) return;

    const today = new Date();
    const nuevaExistencia = material.existence + cantidad;

    const MaterialActualizado: MaterialModel = {
      ...material,
      existence: nuevaExistencia,
      lastIncome: today.toISOString().split('T')[0]
    };

    this.materialeservice.updateMaterials(material.id, MaterialActualizado).subscribe(updated => {
      // Actualiza el producto en el array si es necesario
      material.existence = updated.existence;
      material.lastIncome = updated.lastIncome;
      this.cantidadAgregar[id] = 0;

      // Mostrar toast
      this.toastMessage = 'EXISTENCIA ACTUALIZADA CORRECTAMENTE';
      const toast = new bootstrap.Toast(this.toastElement.nativeElement, { delay: 5000 });
      toast.show();

      this.Materialsearchbyname()
    });
  }

  MaterialquitarExistencia(id: number, material: MaterialModel) {
    const cantidad = this.cantidadQuitar[id] || 0;
    if (!material || cantidad <= 0) return;

    const nuevaExistencia = material.existence - cantidad;
    if (nuevaExistencia < 0) {
      alert("No puedes tener existencia negativa");
      return;
    }

    const MaterialAcutalizado: MaterialModel = {
      ...material,
      existence: nuevaExistencia
    };

    this.materialeservice.updateMaterials(material.id, MaterialAcutalizado).subscribe(updated => {
      material.existence = updated.existence;
      this.cantidadQuitar[id] = 0;

      // Mostrar toast
      this.toastMessage = 'EXISTENCIA ACTUALIZADA CORRECTAMENTE';
      const toast = new bootstrap.Toast(this.toastElement.nativeElement, { delay: 5000 });
      toast.show();

      this.Materialsearchbyname()
    });
  }



  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://media.istockphoto.com/id/1180410208/vector/landscape-image-gallery-with-the-photos-stack-up.jpg?s=612x612&w=0&k=20&c=G21-jgMQruADLPDBk7Sf1vVvCEtPiJD3Rf39AeB95yI=';
  }

}
