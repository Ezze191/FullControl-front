import { Component, ViewChild, ElementRef } from '@angular/core';
import { ProductoTemporada } from '../../../interfaces/producto-temporada.model';
import { ProductosTemporadaService } from '../../../services/productos-temporada.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
    selector: 'app-agregar-producto-temporada',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './agregar-producto-temporada.component.html',
    styleUrl: './agregar-producto-temporada.component.css'
})
export class AgregarProductoTemporadaComponent {
    productForm: FormGroup;
    urlImageMode: boolean = false;

    @ViewChild('toastElement') toastElement!: ElementRef;
    toastMessage: string = '';

    constructor(private fb: FormBuilder, private productoservice: ProductosTemporadaService, private router: Router) {
        this.productForm = this.fb.group({
            TEMPORADA: ['', Validators.required],
            PLU: ['', Validators.required],
            NOMBRE: ['', Validators.required],
            EXISTENCIA: ['', Validators.required],
            PRECIO_COMPRA: ['', Validators.required],
            PRECIO_VENTA: ['', Validators.required],
            PROVEDOR: ['', Validators.required],
            ULTIMO_INGRESO: ['', Validators.required],
            IMAGE_PATH: ['']
        });
    }


    imgPath: string = '';


    generarPLUAleatorio() {
        // Generar número aleatorio entre 100000 y 999999
        const randomPLU = Math.floor(100000 + Math.random() * 900000);

        // Actualizar el valor en el formulario
        this.productForm.patchValue({
            PLU: randomPLU
        });
    }

    toggleImageMode() {
        this.urlImageMode = !this.urlImageMode;
        // Limpiar el valor al cambiar de modo para evitar confusiones
        this.productForm.patchValue({ IMAGE_PATH: '' });
        this.imgPath = '';
    }

    selectFile(event: Event) {

        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const formData = new FormData();
            formData.append('imagen', file);

            this.productoservice.uploadImage(formData).subscribe({
                next: (res) => {
                    this.imgPath = res.ruta;
                    this.productForm.patchValue({ IMAGE_PATH: res.ruta });
                    console.log('ruta de imagen guardada', this.imgPath);

                },
                error: (err) => {
                    console.error('error al subir imagen', err);
                }
            });
        }
    }




    saveProduct() {
        if (this.productForm.valid) {
            const newProduct: Partial<ProductoTemporada> = {
                TEMPORADA: this.productForm.value.TEMPORADA,
                PLU: this.productForm.value.PLU,
                NOMBRE: this.productForm.value.NOMBRE,
                EXISTENCIA: this.productForm.value.EXISTENCIA,
                PRECIO_COMPRA: this.productForm.value.PRECIO_COMPRA,
                PRECIO_VENTA: this.productForm.value.PRECIO_VENTA,
                PROVEDOR: this.productForm.value.PROVEDOR,
                ULTIMO_INGRESO: this.productForm.value.ULTIMO_INGRESO,
                IMAGE_PATH: this.productForm.value.IMAGE_PATH || 'URL'
            };



            this.productoservice.addProducto(newProduct).subscribe({
                next: (res) => {
                    console.log('prodcuto agregado correctamente')

                    // Mostrar toast
                    this.toastMessage = 'Producto de temporada agregado correctamente';
                    const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
                        delay: 5000
                    });
                    toast.show();

                    this.imgPath = '';
                    this.productForm.reset(); // Resetear formulario completo
                    this.urlImageMode = false; // Resetear modo imagen

                    this.productoservice.notificarActualizacion();

                },
                error: (err) => {
                    console.log('OCURRIO UN ERRRO AL AGREAR EL PRODUCTO', err);

                }
            });

        }
    }

}
